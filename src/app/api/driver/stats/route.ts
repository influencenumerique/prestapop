import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
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

    // Get all stats in parallel
    const [
      totalBookings,
      pendingBookings,
      acceptedBookings,
      inProgressBookings,
      completedBookings,
      cancelledBookings,
      completedBookingsData,
      earningsPerMonth
    ] = await Promise.all([
      db.booking.count({ where: { driverId: driverProfile.id } }),
      db.booking.count({ where: { driverId: driverProfile.id, status: "PENDING" } }),
      db.booking.count({ where: { driverId: driverProfile.id, status: "ASSIGNED" } }),
      db.booking.count({ where: { driverId: driverProfile.id, status: "IN_PROGRESS" } }),
      db.booking.count({ where: { driverId: driverProfile.id, status: "COMPLETED" } }),
      db.booking.count({ where: { driverId: driverProfile.id, status: "CANCELLED" } }),
      db.booking.findMany({
        where: {
          driverId: driverProfile.id,
          status: "COMPLETED",
          paidAt: { not: null }
        },
        select: { agreedPrice: true, paidAt: true }
      }),
      // Earnings per month (last 6 months)
      db.$queryRaw`
        SELECT
          DATE_TRUNC('month', b."paidAt") as month,
          SUM(b."agreedPrice")::bigint as earnings,
          COUNT(*)::int as count
        FROM bookings b
        WHERE b."driverId" = ${driverProfile.id}
          AND b.status = 'COMPLETED'
          AND b."paidAt" IS NOT NULL
          AND b."paidAt" > NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', b."paidAt")
        ORDER BY month ASC
      ` as Promise<Array<{ month: Date; earnings: bigint; count: number }>>
    ])

    // Calculate total earnings and commission
    const totalEarnings = completedBookingsData.reduce((sum, b) => sum + b.agreedPrice, 0)
    const commission = Math.round(totalEarnings * 0.15)

    // Get average rating from reviews on completed bookings
    const reviews = await db.review.findMany({
      where: {
        booking: {
          driverId: driverProfile.id,
          status: "COMPLETED"
        }
      },
      select: { rating: true }
    })
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    return NextResponse.json({
      totalBookings,
      pendingBookings,
      acceptedBookings,
      inProgressBookings,
      completedBookings,
      cancelledBookings,
      totalEarnings,
      commission,
      averageRating: Math.round(averageRating * 10) / 10,
      earningsPerMonth: earningsPerMonth.map(r => ({
        month: r.month,
        earnings: Number(r.earnings),
        count: r.count
      }))
    })
  } catch (error) {
    console.error("Error fetching driver stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
