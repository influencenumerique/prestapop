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
    const role = searchParams.get("role")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (role && role !== "ALL") {
      where.role = role
    }

    const status = searchParams.get("status")
    if (status && status !== "ALL") {
      where.status = status
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } }
      ]
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          verificationDocs: true,
          rejectionReason: true,
          documents: {
            select: { id: true, type: true, url: true, status: true }
          },
          company: {
            select: { companyName: true, isVerified: true, phone: true }
          },
          driverProfile: {
            select: { isVerified: true, rating: true, totalDeliveries: true, phone: true, city: true }
          }
        }
      }),
      db.user.count({ where })
    ])

    return NextResponse.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error("Error fetching users:", error)
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
    const { userId, action, role } = body

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 })
    }

    let updateData: Record<string, unknown> = {}

    switch (action) {
      case "block":
        // In a real app, you'd have a "blocked" field
        // For now, we'll just change the role to USER
        updateData = { role: "USER" }
        break
      case "unblock":
        // Restore to their previous role or keep as USER
        updateData = { role: role || "USER" }
        break
      case "verify":
        // Verify company or driver
        const user = await db.user.findUnique({
          where: { id: userId },
          include: { company: true, driverProfile: true }
        })
        if (user?.company) {
          await db.company.update({
            where: { userId },
            data: { isVerified: true }
          })
        }
        if (user?.driverProfile) {
          await db.driverProfile.update({
            where: { userId },
            data: { isVerified: true }
          })
        }
        return NextResponse.json({ success: true })
      case "changeRole":
        if (!role) {
          return NextResponse.json({ error: "role required" }, { status: 400 })
        }
        updateData = { role }
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 })
    }

    // Don't allow deleting yourself
    if (userId === session.user?.id) {
      return NextResponse.json(
        { error: "Cannot delete yourself" },
        { status: 400 }
      )
    }

    await db.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
