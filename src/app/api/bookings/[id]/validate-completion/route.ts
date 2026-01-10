import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { requireAuth, isCompanyOwner } from "@/lib/api-auth"
import { stripe } from "@/lib/stripe"

const validateCompletionSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  companyNotes: z.string().optional(),
})

/**
 * POST /api/bookings/[id]/validate-completion
 *
 * L'entreprise valide la livraison et déclenche le payout du chauffeur
 *
 * Workflow:
 * 1. Chauffeur a marqué DELIVERED
 * 2. Entreprise valide et appelle cet endpoint
 * 3. Status passe à COMPLETED
 * 4. Transfer Stripe vers le chauffeur (85% du montant, 15% commission PrestaPop)
 * 5. Incrémenter totalDeliveries du chauffeur
 *
 * Accessible uniquement par la Company propriétaire de la mission
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify authentication
    const authResult = await requireAuth()
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

    // Verify user is the company owner
    if (!isCompanyOwner(user, booking.job.companyId)) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à valider cette mission" },
        { status: 403 }
      )
    }

    // Check booking status - must be DELIVERED
    if (booking.status !== "DELIVERED") {
      return NextResponse.json(
        { error: `La mission doit être livrée avant validation. Statut actuel: ${booking.status}` },
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

    const body = await req.json()
    const data = validateCompletionSchema.parse(body)

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
          },
          description: `Paiement mission: ${booking.job.title}`,
        })

        transferId = transfer.id
        payoutStatus = "payout_paid"

        console.log(
          `[Validate Completion] Transfer created to driver ${booking.driverId} - ` +
          `Amount: ${driverAmount / 100}€ (Platform fee: ${platformFee / 100}€ - 15%)`
        )
      } catch (transferError: any) {
        console.error(
          `[Validate Completion] Transfer failed for booking ${id}:`,
          transferError.message
        )

        // Continue with completion but mark payout as failed for manual intervention
        payoutStatus = "payout_failed"
      }
    } else {
      console.warn(
        `[Validate Completion] Driver ${booking.driverId} has no Stripe Connect account - payout skipped`
      )
      payoutStatus = "payout_failed_no_account"
    }

    // Update booking to COMPLETED
    const updatedBooking = await db.booking.update({
      where: { id },
      data: {
        status: "COMPLETED",
        stripePaymentStatus: payoutStatus,
        companyNotes: data.companyNotes || booking.companyNotes,
        // Note: Ajouter un champ `validatedAt` et `transferId` au schéma Prisma serait idéal
        // Pour l'instant on stocke dans stripePaymentStatus
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
      `[Validate Completion] Booking ${id} completed and validated by company ${booking.job.companyId}`
    )

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      payout: {
        status: payoutStatus,
        transferId,
        driverAmount: driverAmount / 100,
        platformFee: platformFee / 100,
        platformFeePercentage: "15%",
      },
      message: payoutStatus === "payout_paid"
        ? "Mission validée et chauffeur payé avec succès"
        : "Mission validée mais payout chauffeur en attente (intervention manuelle requise)",
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error validating completion:", error)
    return NextResponse.json(
      { error: "Erreur lors de la validation de la mission" },
      { status: 500 }
    )
  }
}
