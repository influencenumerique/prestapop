import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, isCompanyOwner } from "@/lib/api-auth"
import { createMissionPaymentIntent } from "@/lib/stripe"

/**
 * POST /api/bookings/[id]/accept-and-pay
 *
 * L'entreprise accepte la candidature d'un chauffeur et initie le paiement (flow Uber Eats)
 *
 * Workflow:
 * 1. Entreprise sélectionne un chauffeur parmi les candidats (status: PENDING)
 * 2. Cette route crée un PaymentIntent Stripe
 * 3. Status passe à PAYMENT_PENDING
 * 4. Frontend Company confirme le paiement
 * 5. Webhook marque PAYMENT_PAID + status ASSIGNED
 * 6. Le chauffeur effectue la livraison
 * 7. Après livraison + validation entreprise => Transfer au chauffeur
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
        { error: "Vous n'êtes pas autorisé à accepter cette candidature" },
        { status: 403 }
      )
    }

    // Check booking status - must be PENDING (candidature)
    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cette candidature a déjà été traitée" },
        { status: 400 }
      )
    }

    // Check if payment already exists
    if (booking.stripePaymentId) {
      // Retrieve existing PaymentIntent
      const { stripe } = await import("@/lib/stripe")
      const existingIntent = await stripe.paymentIntents.retrieve(booking.stripePaymentId)

      if (existingIntent.status === "succeeded") {
        return NextResponse.json(
          { error: "Cette mission a déjà été payée" },
          { status: 400 }
        )
      }

      // Return existing PaymentIntent
      return NextResponse.json({
        clientSecret: existingIntent.client_secret,
        paymentIntentId: existingIntent.id,
        amount: existingIntent.amount,
        missionType: booking.job.typeMission,
        status: existingIntent.status,
      })
    }

    // Calculate amount based on mission type
    const amount = booking.agreedPrice

    // Determine mission type label for description
    const missionTypeLabel = {
      DAY: "Journée complète",
      HALF_DAY: "Demi-journée",
      WEEK: "Mission semaine (5 jours)",
    }[booking.job.typeMission] || "Mission"

    const description = `${missionTypeLabel} - ${booking.job.title} - Chauffeur: ${booking.driver.user.name || "N/A"}`

    // Create PaymentIntent
    const paymentIntent = await createMissionPaymentIntent(
      booking.id,
      booking.jobId,
      booking.driverId,
      booking.job.companyId,
      amount,
      booking.job.typeMission,
      description
    )

    // Update booking status to PAYMENT_PENDING
    await db.booking.update({
      where: { id },
      data: {
        stripePaymentId: paymentIntent.id,
        stripePaymentStatus: "payment_pending",
      },
    })

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      missionType: booking.job.typeMission,
      message: "PaymentIntent créé avec succès. Veuillez confirmer le paiement.",
    })
  } catch (error: any) {
    console.error("Error accepting and initiating payment:", error)

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

    return NextResponse.json(
      { error: "Erreur lors de l'acceptation de la candidature" },
      { status: 500 }
    )
  }
}
