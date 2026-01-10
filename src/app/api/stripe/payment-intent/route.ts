import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { z } from "zod"

const paymentIntentSchema = z.object({
  bookingId: z.string(),
})

/**
 * POST /api/stripe/payment-intent
 * Crée un PaymentIntent pour une mission acceptée
 * Permet au client de payer directement via Stripe Elements
 *
 * Flux:
 * 1. Company accepte le chauffeur (status: ASSIGNED ou DELIVERED)
 * 2. Company crée un PaymentIntent pour payer la mission
 * 3. Company confirme le paiement côté frontend
 * 4. Webhook met à jour le statut à COMPLETED et déclenche le versement au chauffeur
 *
 * Calcul du montant:
 * - DAY: dayRate (journée complète)
 * - HALF_DAY: dayRate / 2 (demi-journée)
 * - WEEK: dayRate * 5 (semaine = 5 jours)
 */
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await req.json()
    const { bookingId } = paymentIntentSchema.parse(body)

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
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
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 })
    }

    // Verify the user belongs to the company that created the job
    if (booking.job.company.userId !== session.user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // Allow payment for ASSIGNED (mission acceptée) or DELIVERED bookings
    if (!["ASSIGNED", "IN_PROGRESS", "DELIVERED"].includes(booking.status)) {
      return NextResponse.json(
        { error: "Cette mission doit être acceptée ou livrée avant d'être payée" },
        { status: 400 }
      )
    }

    // Check if already paid
    if (booking.stripePaymentStatus === "succeeded" && booking.paidAt) {
      return NextResponse.json(
        { error: "Cette mission a déjà été payée" },
        { status: 400 }
      )
    }

    // Check if PaymentIntent already exists
    if (booking.stripePaymentId) {
      // Retrieve existing PaymentIntent
      const existingIntent = await stripe.paymentIntents.retrieve(booking.stripePaymentId)

      if (existingIntent.status === "succeeded") {
        return NextResponse.json(
          { error: "Cette mission a déjà été payée" },
          { status: 400 }
        )
      }

      // Return existing PaymentIntent if not yet completed
      return NextResponse.json({
        clientSecret: existingIntent.client_secret,
        paymentIntentId: existingIntent.id,
        amount: existingIntent.amount,
      })
    }

    // Calculate amount based on mission type and agreedPrice
    // agreedPrice is already in cents and should reflect the mission type
    const amount = booking.agreedPrice

    // Determine mission type label for description
    const missionTypeLabel = {
      DAY: "Journée complète",
      HALF_DAY: "Demi-journée",
      WEEK: "Mission semaine (5 jours)",
    }[booking.job.typeMission] || "Mission"

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "eur",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        bookingId: booking.id,
        jobId: booking.jobId,
        driverId: booking.driverId,
        companyId: booking.job.companyId,
        missionType: booking.job.typeMission,
      },
      description: `${missionTypeLabel} - ${booking.job.title}`,
    })

    // Update booking with PaymentIntent ID
    await db.booking.update({
      where: { id: bookingId },
      data: {
        stripePaymentId: paymentIntent.id,
        stripePaymentStatus: "pending",
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      missionType: booking.job.typeMission,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error creating payment intent:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du paiement" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/stripe/payment-intent?bookingId=xxx
 * Récupère le statut d'un PaymentIntent existant
 */
export async function GET(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const bookingId = searchParams.get("bookingId")

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId requis" }, { status: 400 })
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        job: {
          include: {
            company: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 })
    }

    // Verify user is authorized (company or driver)
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { driverProfile: true, company: true },
    })

    const isDriver = user?.driverProfile?.id === booking.driverId
    const isCompany = user?.company?.id === booking.job.companyId

    if (!isDriver && !isCompany) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    if (!booking.stripePaymentId) {
      return NextResponse.json({
        status: "no_payment",
        message: "Aucun paiement n'a été initié pour cette mission"
      })
    }

    // Retrieve PaymentIntent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(booking.stripePaymentId)

    return NextResponse.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      created: paymentIntent.created,
      paidAt: booking.paidAt,
    })
  } catch (error) {
    console.error("Error retrieving payment intent:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du paiement" },
      { status: 500 }
    )
  }
}
