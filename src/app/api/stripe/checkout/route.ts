import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { z } from "zod"

const checkoutSchema = z.object({
  bookingId: z.string(),
})

/**
 * POST /api/stripe/checkout
 * Crée une session Stripe Checkout pour le paiement d'une mission
 * Utilisé par l'entreprise (Company) pour payer le chauffeur
 *
 * Flux:
 * 1. Company accepte un chauffeur (status: ASSIGNED ou supérieur)
 * 2. Company crée une Checkout Session pour payer la mission
 * 3. Paiement effectué via Stripe Checkout (hosted page)
 * 4. Webhook met à jour le statut à COMPLETED et transfère les fonds au chauffeur
 *
 * Calcul du montant:
 * - Utilise agreedPrice qui reflète déjà le type de mission:
 *   - DAY: dayRate (journée complète)
 *   - HALF_DAY: dayRate / 2 (demi-journée)
 *   - WEEK: dayRate * 5 (semaine de 5 jours)
 */
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await req.json()
    const { bookingId } = checkoutSchema.parse(body)

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

    // Allow payment for ASSIGNED, IN_PROGRESS, or DELIVERED bookings
    if (!["ASSIGNED", "IN_PROGRESS", "DELIVERED"].includes(booking.status)) {
      return NextResponse.json(
        { error: "Cette mission doit être acceptée avant d'être payée" },
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

    // Determine mission type label for description
    const missionTypeLabel = {
      DAY: "Journée complète",
      HALF_DAY: "Demi-journée",
      WEEK: "Mission semaine (5 jours)",
    }[booking.job.typeMission] || "Mission"

    // Format amount for display (in euros)
    const amountInEuros = (booking.agreedPrice / 100).toFixed(2)

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: session.user.email!,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: booking.job.title,
              description: `${missionTypeLabel} - ${booking.job.secteurLivraison} - Chauffeur: ${booking.driver.user.name || "N/A"}`,
              metadata: {
                missionType: booking.job.typeMission,
                secteur: booking.job.secteurLivraison,
                vehicleVolume: booking.job.vehicleVolume,
              },
            },
            unit_amount: booking.agreedPrice,
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: booking.id,
        jobId: booking.jobId,
        driverId: booking.driverId,
        companyId: booking.job.companyId,
        missionType: booking.job.typeMission,
        agreedPrice: booking.agreedPrice.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success&bookingId=${booking.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=cancelled&bookingId=${booking.id}`,
    })

    return NextResponse.json({
      url: stripeSession.url,
      sessionId: stripeSession.id,
      amount: booking.agreedPrice,
      amountDisplay: `${amountInEuros}€`,
      missionType: booking.job.typeMission,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du paiement" },
      { status: 500 }
    )
  }
}
