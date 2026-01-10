import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/api-auth"

/**
 * GET /api/bookings/auto-validate
 *
 * Liste toutes les missions éligibles à l'auto-validation (DELIVERED depuis > 48h)
 *
 * Utilisé par un cron job ou un admin pour identifier les missions bloquées
 *
 * Accessible uniquement par les ADMIN
 */
export async function GET(req: Request) {
  try {
    // Verify authentication - ADMIN only
    const authResult = await requireRole("ADMIN")
    if ("error" in authResult) {
      return authResult.error
    }

    const AUTO_VALIDATE_THRESHOLD_HOURS = 48
    const thresholdDate = new Date(Date.now() - AUTO_VALIDATE_THRESHOLD_HOURS * 60 * 60 * 1000)

    // Find all bookings that are DELIVERED for more than 48h
    const eligibleBookings = await db.booking.findMany({
      where: {
        status: "DELIVERED",
        stripePaymentStatus: "payment_paid",
        deliveredAt: {
          lte: new Date(Date.now() - AUTO_VALIDATE_THRESHOLD_HOURS * 60 * 60 * 1000),
        },
      },
      include: {
        job: { include: { company: true } },
        driver: { include: { user: true } },
      },
    })

    return NextResponse.json({
      count: eligibleBookings.length,
      bookings: eligibleBookings,
      message: `${eligibleBookings.length} mission(s) éligible(s) à l'auto-validation`,
    })
  } catch (error: any) {
    console.error("Error listing auto-validate eligible bookings:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des missions éligibles" },
      { status: 500 }
    )
  }
}
