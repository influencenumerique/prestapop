import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
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

    // Get all stats in parallel
    const [
      totalJobs,
      draftJobs,
      openJobs,
      assignedJobs,
      completedJobs,
      totalBookings,
      completedBookings,
      revenuePerMonth
    ] = await Promise.all([
      db.job.count({ where: { companyId: company.id } }),
      db.job.count({ where: { companyId: company.id, status: "DRAFT" } }),
      db.job.count({ where: { companyId: company.id, status: "OPEN" } }),
      db.job.count({ where: { companyId: company.id, status: "ASSIGNED" } }),
      db.job.count({ where: { companyId: company.id, status: "COMPLETED" } }),
      db.booking.count({
        where: {
          job: { companyId: company.id }
        }
      }),
      db.booking.findMany({
        where: {
          job: { companyId: company.id },
          status: "COMPLETED",
          paidAt: { not: null }
        },
        select: { agreedPrice: true, paidAt: true }
      }),
      // Revenue per month (last 6 months)
      db.$queryRaw`
        SELECT
          DATE_TRUNC('month', b."paidAt") as month,
          SUM(b."agreedPrice")::bigint as revenue,
          COUNT(*)::int as count
        FROM bookings b
        INNER JOIN jobs j ON j.id = b."jobId"
        WHERE j."companyId" = ${company.id}
          AND b.status = 'COMPLETED'
          AND b."paidAt" IS NOT NULL
          AND b."paidAt" > NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', b."paidAt")
        ORDER BY month ASC
      ` as Promise<Array<{ month: Date; revenue: bigint; count: number }>>
    ])

    // Calculate total revenue and average rating
    const totalRevenue = completedBookings.reduce((sum, b) => sum + b.agreedPrice, 0)
    const commission = Math.round(totalRevenue * 0.15)

    // Get average driver rating from reviews on completed bookings
    const reviews = await db.review.findMany({
      where: {
        booking: {
          job: { companyId: company.id },
          status: "COMPLETED"
        }
      },
      select: { rating: true }
    })
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    return NextResponse.json({
      totalJobs,
      draftJobs,
      openJobs,
      assignedJobs,
      completedJobs,
      totalBookings,
      totalRevenue,
      commission,
      averageRating: Math.round(averageRating * 10) / 10,
      revenuePerMonth: revenuePerMonth.map(r => ({
        month: r.month,
        revenue: Number(r.revenue),
        count: r.count
      }))
    })
  } catch (error) {
    console.error("Error fetching company stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
