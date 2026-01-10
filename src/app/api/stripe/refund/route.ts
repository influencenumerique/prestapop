import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { z } from "zod"

const refundSchema = z.object({
  bookingId: z.string(),
  reason: z.enum(["duplicate", "fraudulent", "requested_by_customer"]).optional(),
})

/**
 * POST /api/stripe/refund
 * Crée un remboursement pour une mission annulée
 * Accessible uniquement par la Company qui a payé
 *
 * Cas d'usage:
 * - Mission annulée après paiement
 * - Mission non livrée
 * - Litige client
 */
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await req.json()
    const { bookingId, reason } = refundSchema.parse(body)

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

    // Check if payment exists
    if (!booking.stripePaymentId) {
      return NextResponse.json(
        { error: "Aucun paiement n'a été effectué pour cette mission" },
        { status: 400 }
      )
    }

    // Check if already refunded
    if (booking.stripePaymentStatus === "refunded") {
      return NextResponse.json(
        { error: "Cette mission a déjà été remboursée" },
        { status: 400 }
      )
    }

    // Check if payment was successful
    if (booking.stripePaymentStatus !== "succeeded") {
      return NextResponse.json(
        { error: "Le paiement n'a pas été confirmé, impossible de rembourser" },
        { status: 400 }
      )
    }

    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: booking.stripePaymentId,
      reason: reason || "requested_by_customer",
      metadata: {
        bookingId: booking.id,
        jobId: booking.jobId,
        driverId: booking.driverId,
      },
    })

    // Update booking status
    await db.booking.update({
      where: { id: bookingId },
      data: {
        stripePaymentStatus: "refunded",
        status: "CANCELLED",
      },
    })

    // Update job status
    await db.job.update({
      where: { id: booking.jobId },
      data: { status: "CANCELLED" },
    })

    // Decrement driver's total deliveries if it was completed
    if (booking.status === "COMPLETED") {
      await db.driverProfile.update({
        where: { id: booking.driverId },
        data: {
          totalDeliveries: {
            decrement: 1,
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status,
      message: "Remboursement effectué avec succès",
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }

    // Handle Stripe errors
    if (error.type === "StripeCardError") {
      return NextResponse.json(
        { error: "Erreur de carte bancaire", details: error.message },
        { status: 400 }
      )
    }

    if (error.type === "StripeInvalidRequestError") {
      return NextResponse.json(
        { error: "Requête invalide", details: error.message },
        { status: 400 }
      )
    }

    console.error("Error creating refund:", error)
    return NextResponse.json(
      { error: "Erreur lors du remboursement" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/stripe/refund?bookingId=xxx
 * Récupère les informations de remboursement pour une mission
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
        refunded: false,
        message: "Aucun paiement n'a été effectué pour cette mission",
      })
    }

    if (booking.stripePaymentStatus !== "refunded") {
      return NextResponse.json({
        refunded: false,
        message: "Cette mission n'a pas été remboursée",
      })
    }

    // List refunds for this payment intent
    const refunds = await stripe.refunds.list({
      payment_intent: booking.stripePaymentId,
      limit: 10,
    })

    return NextResponse.json({
      refunded: true,
      refunds: refunds.data.map((refund) => ({
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        created: refund.created,
      })),
    })
  } catch (error) {
    console.error("Error retrieving refund:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du remboursement" },
      { status: 500 }
    )
  }
}
