import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, isCompanyOwner } from "@/lib/api-auth"
import { createMissionPaymentIntent } from "@/lib/stripe"

/**
 * POST /api/bookings/[id]/initiate-payment
 *
 * Initie le paiement d'une mission après qu'une Company ait accepté un chauffeur
 *
 * Workflow:
 * 1. Company accepte la candidature d'un chauffeur (status: ASSIGNED)
 * 2. Company appelle cette route pour créer un PaymentIntent
 * 3. Le montant est calculé automatiquement selon le type de mission:
 *    - DAY: dayRate (journée complète)
 *    - HALF_DAY: dayRate / 2 (demi-journée)
 *    - WEEK: dayRate * 5 (semaine de 5 jours)
 * 4. Le PaymentIntent est attaché au booking
 * 5. Company confirme le paiement côté frontend avec Stripe Elements
 * 6. Webhook met à jour le statut après confirmation du paiement
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
        { error: "Vous n'êtes pas autorisé à initier le paiement de cette mission" },
        { status: 403 }
      )
    }

    // Check booking status - must be ASSIGNED or IN_PROGRESS
    if (!["ASSIGNED", "IN_PROGRESS", "DELIVERED"].includes(booking.status)) {
      return NextResponse.json(
        { error: "Cette mission doit être acceptée avant d'être payée" },
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

    // Check if already paid
    if (booking.stripePaymentStatus === "succeeded" && booking.paidAt) {
      return NextResponse.json(
        { error: "Cette mission a déjà été payée" },
        { status: 400 }
      )
    }

    // Calculate amount based on mission type
    // agreedPrice should already reflect the mission type calculation
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

    // Update booking with PaymentIntent ID
    await db.booking.update({
      where: { id },
      data: {
        stripePaymentId: paymentIntent.id,
        stripePaymentStatus: "pending",
      },
    })

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      missionType: booking.job.typeMission,
      message: "PaymentIntent créé avec succès",
    })
  } catch (error: any) {
    console.error("Error initiating payment:", error)

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
      { error: "Erreur lors de l'initiation du paiement" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/bookings/[id]/initiate-payment
 *
 * Récupère les informations de paiement pour une mission
 * Utile pour vérifier l'état du paiement sans créer un nouveau PaymentIntent
 */
export async function GET(
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

    // Verify user is the company owner or the driver
    const isDriver = user.driverProfile?.id === booking.driverId
    const isCompany = isCompanyOwner(user, booking.job.companyId)

    if (!isDriver && !isCompany) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à consulter ce paiement" },
        { status: 403 }
      )
    }

    // If no payment initiated yet
    if (!booking.stripePaymentId) {
      return NextResponse.json({
        paymentInitiated: false,
        bookingStatus: booking.status,
        agreedPrice: booking.agreedPrice,
        missionType: booking.job.typeMission,
        message: "Aucun paiement n'a été initié pour cette mission",
      })
    }

    // Retrieve PaymentIntent from Stripe
    const { stripe } = await import("@/lib/stripe")
    const paymentIntent = await stripe.paymentIntents.retrieve(booking.stripePaymentId)

    return NextResponse.json({
      paymentInitiated: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      missionType: booking.job.typeMission,
      bookingStatus: booking.status,
      paidAt: booking.paidAt,
      stripePaymentStatus: booking.stripePaymentStatus,
    })
  } catch (error: any) {
    console.error("Error fetching payment info:", error)

    return NextResponse.json(
      { error: "Erreur lors de la récupération des informations de paiement" },
      { status: 500 }
    )
  }
}
