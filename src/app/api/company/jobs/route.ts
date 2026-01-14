import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || session.user?.role !== "COMPANY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get company for this user
    const company = await db.company.findUnique({
      where: { userId: session.user.id }
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")

    const where: any = { companyId: company.id }
    if (status) {
      where.status = status
    }

    const jobs = await db.job.findMany({
      where,
      include: {
        _count: { select: { bookings: true } }
      },
      orderBy: { createdAt: "desc" },
      take: limit
    })

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error("Error fetching company jobs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
