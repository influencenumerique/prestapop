import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { requireAnyRole, isCompanyOwner, hasRole } from "@/lib/api-auth"
import { createRefund } from "@/lib/stripe"

const refundSchema = z.object({
  reason: z.enum(["duplicate", "fraudulent", "requested_by_customer"]).optional(),
  comment: z.string().optional(),
})

/**
 * PATCH /api/bookings/[id]/refund
 *
 * Rembourse l'entreprise suite à un no-show confirmé
 *
 * Workflow:
 * 1. Vérifier que le no-show a été confirmé (NO_SHOW_CONFIRMED dans companyNotes)
 * 2. Vérifier qu'un paiement existe (stripePaymentId)
 * 3. Vérifier que le paiement a été effectué (stripePaymentStatus = "succeeded")
 * 4. Créer un remboursement Stripe via l'API
 * 5. Mettre à jour le booking avec le refund ID
 * 6. Marquer companyNotes avec "REFUND_INITIATED"
 * 7. Le webhook Stripe confirmera le remboursement et mettra à jour stripePaymentStatus
 *
 * Accessible par Role.ADMIN ou la Company propriétaire
 *
 * NOTE: Le schema Booking n'a pas de champ stripeRefundId ni de status REFUNDED.
 * On utilise companyNotes pour tracker et stripePaymentStatus pour indiquer "refunded".
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify authentication (Admin or Company only)
    const authResult = await requireAnyRole(["ADMIN", "COMPANY"])
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
            company: {
              include: {
                user: true,
              },
            },
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

    // If company, verify ownership
    if (user.role === "COMPANY") {
      if (!isCompanyOwner(user, booking.job.companyId)) {
        return NextResponse.json(
          { error: "Vous n'êtes pas autorisé à demander un remboursement pour cette mission" },
          { status: 403 }
        )
      }
    }

    // Check if no-show was confirmed
    if (!booking.companyNotes?.includes("NO_SHOW_CONFIRMED:")) {
      return NextResponse.json(
        { error: "Le remboursement n'est possible que si le no-show a été confirmé" },
        { status: 400 }
      )
    }

    // Check if payment exists
    if (!booking.stripePaymentId) {
      return NextResponse.json(
        { error: "Aucun paiement n'a été effectué pour cette mission" },
        { status: 400 }
      )
    }

    // Check if payment was successful
    if (booking.stripePaymentStatus !== "succeeded") {
      return NextResponse.json(
        {
          error: "Le paiement n'a pas été effectué avec succès",
          currentStatus: booking.stripePaymentStatus,
        },
        { status: 400 }
      )
    }

    // Check if already refunded
    if (booking.companyNotes?.includes("REFUND_INITIATED:") ||
        booking.stripePaymentStatus === "refunded") {
      return NextResponse.json(
        { error: "Le remboursement a déjà été initié pour cette mission" },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await req.json().catch(() => ({}))
    const data = refundSchema.parse(body)

    // Create Stripe refund
    const timestamp = new Date().toISOString()
    const refundMetadata = {
      bookingId: booking.id,
      jobId: booking.jobId,
      companyId: booking.job.companyId,
      driverId: booking.driverId,
      reason: "no_show_confirmed",
      requestedBy: `${user.role}:${user.id}`,
      timestamp,
    }

    const refund = await createRefund(
      booking.stripePaymentId,
      refundMetadata,
      data.reason || "requested_by_customer"
    )

    // Update booking with refund info
    const refundNote = `REFUND_INITIATED: [${timestamp}] Par ${user.role} ${user.name || user.email}\nStripe Refund ID: ${refund.id}\nMontant: ${refund.amount / 100}€\nStatut: ${refund.status}${data.comment ? `\nCommentaire: ${data.comment}` : ""}`
    const existingCompanyNotes = booking.companyNotes || ""

    const updatedBooking = await db.booking.update({
      where: { id },
      data: {
        companyNotes: `${existingCompanyNotes}\n\n${refundNote}`,
        // Note: stripePaymentStatus will be updated by webhook when refund succeeds
        updatedAt: new Date(),
      },
      include: {
        job: true,
        driver: {
          include: {
            user: true,
          },
        },
      },
    })

    // TODO: Send notification to company and driver
    console.log(`[REFUND INITIATED] Remboursement initié pour booking ${booking.id}`, {
      bookingId: booking.id,
      companyName: booking.job.company.companyName,
      driverName: booking.driver.user.name,
      amount: refund.amount,
      refundId: refund.id,
      status: refund.status,
    })

    return NextResponse.json({
      success: true,
      message: "Remboursement initié avec succès. Le montant sera crédité sous 5-10 jours.",
      booking: updatedBooking,
      refund: {
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
      },
      nextStep: "Le webhook Stripe confirmera le remboursement une fois traité.",
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }

    // Handle Stripe-specific errors
    if (error.type && error.type.startsWith("Stripe")) {
      return NextResponse.json(
        {
          error: "Erreur Stripe",
          details: error.message,
          type: error.type,
        },
        { status: 400 }
      )
    }

    console.error("Error initiating refund:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'initiation du remboursement" },
      { status: 500 }
    )
  }
}
