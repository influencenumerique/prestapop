import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/api-auth"
import { stripe } from "@/lib/stripe"

/**
 * POST /api/bookings/[id]/auto-validate
 *
 * Auto-validation d'une mission DELIVERED après délai (48h)
 *
 * Anti-blocage: Si l'entreprise ne valide pas sous 48h, cette route peut être appelée
 * par un admin ou un cron job pour valider automatiquement et payer le chauffeur.
 *
 * Usage:
 * - Cron job qui tourne toutes les heures
 * - Cherche les bookings DELIVERED depuis > 48h
 * - Appelle cet endpoint pour chaque booking
 *
 * Accessible uniquement par les ADMIN
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify authentication - ADMIN only
    const authResult = await requireRole("ADMIN")
    if ("error" in authResult) {
      return authResult.error
    }

    const { user } = authResult

    // Fetch booking with related data
    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            company: true,
          },
        },
        driver: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 }
      )
    }

    // Check booking status - must be DELIVERED
    if (booking.status !== "DELIVERED") {
      return NextResponse.json(
        { error: `La mission doit être livrée pour auto-validation. Statut actuel: ${booking.status}` },
        { status: 400 }
      )
    }

    // Check if payment was made by company
    if (booking.stripePaymentStatus !== "payment_paid") {
      return NextResponse.json(
        { error: "Le paiement doit être effectué avant validation" },
        { status: 400 }
      )
    }

    // Check deliveredAt timestamp
    if (!booking.deliveredAt) {
      return NextResponse.json(
        { error: "Aucune date de livraison trouvée" },
        { status: 400 }
      )
    }

    // Check if 48 hours have passed
    const now = new Date()
    const deliveredAt = new Date(booking.deliveredAt)
    const hoursSinceDelivery = (now.getTime() - deliveredAt.getTime()) / (1000 * 60 * 60)
    const AUTO_VALIDATE_THRESHOLD_HOURS = 48

    if (hoursSinceDelivery < AUTO_VALIDATE_THRESHOLD_HOURS) {
      return NextResponse.json(
        {
          error: `Auto-validation possible seulement après ${AUTO_VALIDATE_THRESHOLD_HOURS}h. ` +
                 `Heures écoulées: ${hoursSinceDelivery.toFixed(1)}h`,
        },
        { status: 400 }
      )
    }

    // Calculate platform fee (15% commission PrestaPop)
    const platformFeePercentage = 0.15 // 15%
    const platformFee = Math.round(booking.agreedPrice * platformFeePercentage)
    const driverAmount = booking.agreedPrice - platformFee

    let transferId: string | null = null
    let payoutStatus = "payout_pending"

    // Initiate transfer to driver if Stripe Connect account exists
    if (booking.driver.stripeAccountId) {
      try {
        const transfer = await stripe.transfers.create({
          amount: driverAmount,
          currency: "eur",
          destination: booking.driver.stripeAccountId,
          metadata: {
            bookingId: booking.id,
            jobId: booking.jobId,
            driverId: booking.driverId,
            companyId: booking.job.companyId,
            missionType: booking.job.typeMission,
            platformFee: platformFee.toString(),
            platformFeePercentage: (platformFeePercentage * 100).toString() + "%",
            autoValidated: "true",
          },
          description: `Auto-validation mission: ${booking.job.title}`,
        })

        transferId = transfer.id
        payoutStatus = "payout_paid"

        console.log(
          `[Auto Validate] Transfer created to driver ${booking.driverId} - ` +
          `Amount: ${driverAmount / 100}€ (Platform fee: ${platformFee / 100}€ - 15%)`
        )
      } catch (transferError: any) {
        console.error(
          `[Auto Validate] Transfer failed for booking ${id}:`,
          transferError.message
        )

        payoutStatus = "payout_failed"
      }
    } else {
      console.warn(
        `[Auto Validate] Driver ${booking.driverId} has no Stripe Connect account - payout skipped`
      )
      payoutStatus = "payout_failed_no_account"
    }

    // Update booking to COMPLETED
    const updatedBooking = await db.booking.update({
      where: { id },
      data: {
        status: "COMPLETED",
        stripePaymentStatus: payoutStatus,
        companyNotes: (booking.companyNotes || "") + " [AUTO-VALIDÉ après 48h sans réponse]",
      },
      include: {
        job: { include: { company: { include: { user: true } } } },
        driver: { include: { user: true } },
      },
    })

    // Update job status to COMPLETED
    await db.job.update({
      where: { id: booking.jobId },
      data: { status: "COMPLETED" },
    })

    // Increment driver's total deliveries
    await db.driverProfile.update({
      where: { id: booking.driverId },
      data: { totalDeliveries: { increment: 1 } },
    })

    console.log(
      `[Auto Validate] Booking ${id} auto-validated after 48h by admin ${user.id}`
    )

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      autoValidated: true,
      hoursSinceDelivery: hoursSinceDelivery.toFixed(1),
      payout: {
        status: payoutStatus,
        transferId,
        driverAmount: driverAmount / 100,
        platformFee: platformFee / 100,
        platformFeePercentage: "15%",
      },
      message: "Mission auto-validée après 48h sans réponse de l'entreprise",
    })
  } catch (error: any) {
    console.error("Error auto-validating booking:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'auto-validation de la mission" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/bookings/[id]/auto-validate
 *
 * Vérifie si une mission est éligible à l'auto-validation
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify authentication - ADMIN only
    const authResult = await requireRole("ADMIN")
    if ("error" in authResult) {
      return authResult.error
    }

    // Fetch booking
    const booking = await db.booking.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        deliveredAt: true,
        stripePaymentStatus: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 }
      )
    }

    const AUTO_VALIDATE_THRESHOLD_HOURS = 48
    const isDelivered = booking.status === "DELIVERED"
    const hasDeliveredAt = !!booking.deliveredAt
    const isPaid = booking.stripePaymentStatus === "payment_paid"

    let hoursSinceDelivery = 0
    let isEligible = false

    if (hasDeliveredAt) {
      const now = new Date()
      const deliveredAt = new Date(booking.deliveredAt!)
      hoursSinceDelivery = (now.getTime() - deliveredAt.getTime()) / (1000 * 60 * 60)
      isEligible = isDelivered && isPaid && hoursSinceDelivery >= AUTO_VALIDATE_THRESHOLD_HOURS
    }

    return NextResponse.json({
      bookingId: booking.id,
      status: booking.status,
      isDelivered,
      isPaid,
      hasDeliveredAt,
      deliveredAt: booking.deliveredAt,
      hoursSinceDelivery: hoursSinceDelivery.toFixed(1),
      thresholdHours: AUTO_VALIDATE_THRESHOLD_HOURS,
      isEligible,
      hoursRemaining: isEligible ? 0 : Math.max(0, AUTO_VALIDATE_THRESHOLD_HOURS - hoursSinceDelivery).toFixed(1),
    })
  } catch (error: any) {
    console.error("Error checking auto-validate eligibility:", error)
    return NextResponse.json(
      { error: "Erreur lors de la vérification de l'éligibilité" },
      { status: 500 }
    )
  }
}
