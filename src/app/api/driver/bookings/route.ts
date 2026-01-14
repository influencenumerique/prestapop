import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || session.user?.role !== "DRIVER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get driver profile for this user
    const driverProfile = await db.driverProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!driverProfile) {
      return NextResponse.json({ error: "Driver profile not found" }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")

    const where: any = { driverId: driverProfile.id }
    if (status) {
      where.status = status
    }

    const bookings = await db.booking.findMany({
      where,
      include: {
        job: {
          include: {
            company: {
              select: {
                companyName: true,
                logo: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: limit
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error("Error fetching driver bookings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
