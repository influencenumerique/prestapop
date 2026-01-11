import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all stats in parallel
    const [
      totalUsers,
      totalCompanies,
      totalDrivers,
      totalJobs,
      openJobs,
      completedJobs,
      totalBookings,
      recentBookings,
      jobsPerWeek,
      usersPerMonth
    ] = await Promise.all([
      db.user.count(),
      db.company.count(),
      db.driverProfile.count(),
      db.job.count(),
      db.job.count({ where: { status: "OPEN" } }),
      db.job.count({ where: { status: "COMPLETED" } }),
      db.booking.count(),
      db.booking.findMany({
        where: {
          status: "COMPLETED",
          paidAt: { not: null }
        },
        select: { agreedPrice: true }
      }),
      // Jobs created per week (last 8 weeks)
      db.$queryRaw`
        SELECT
          DATE_TRUNC('week', "createdAt") as week,
          COUNT(*)::int as count
        FROM jobs
        WHERE "createdAt" > NOW() - INTERVAL '8 weeks'
        GROUP BY DATE_TRUNC('week', "createdAt")
        ORDER BY week ASC
      ` as Promise<Array<{ week: Date; count: number }>>,
      // Users created per month (last 6 months)
      db.$queryRaw`
        SELECT
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*)::int as count
        FROM users
        WHERE "createdAt" > NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month ASC
      ` as Promise<Array<{ month: Date; count: number }>>
    ])

    // Calculate total revenue (15% commission)
    const totalPaid = recentBookings.reduce((sum, b) => sum + b.agreedPrice, 0)
    const revenue = Math.round(totalPaid * 0.15)

    return NextResponse.json({
      totalUsers,
      totalCompanies,
      totalDrivers,
      totalJobs,
      openJobs,
      completedJobs,
      totalBookings,
      revenue,
      totalPaid,
      jobsPerWeek: jobsPerWeek.map(j => ({
        week: j.week,
        count: j.count
      })),
      usersPerMonth: usersPerMonth.map(u => ({
        month: u.month,
        count: u.count
      }))
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
