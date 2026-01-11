import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (status && status !== "ALL") {
      where.status = status
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { secteurLivraison: { contains: search, mode: "insensitive" } }
      ]
    }

    const [jobs, total] = await Promise.all([
      db.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          company: {
            select: {
              companyName: true,
              phone: true,
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          bookings: {
            select: {
              id: true,
              status: true,
              driver: {
                select: {
                  phone: true,
                  user: {
                    select: { id: true, name: true, email: true }
                  }
                }
              }
            }
          }
        }
      }),
      db.job.count({ where })
    ])

    return NextResponse.json({
      jobs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error("Error fetching jobs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { jobId, action, status } = body

    if (!jobId) {
      return NextResponse.json({ error: "jobId required" }, { status: 400 })
    }

    let updateData: Record<string, unknown> = {}

    switch (action) {
      case "changeStatus":
        if (!status) {
          return NextResponse.json({ error: "status required" }, { status: 400 })
        }
        updateData = { status }
        break
      case "cancel":
        updateData = { status: "CANCELLED" }
        break
      case "complete":
        updateData = { status: "COMPLETED" }
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const updatedJob = await db.job.update({
      where: { id: jobId },
      data: updateData
    })

    return NextResponse.json({ job: updatedJob })
  } catch (error) {
    console.error("Error updating job:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
