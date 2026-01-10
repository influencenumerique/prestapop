import { NextResponse } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"

/**
 * POST /api/stripe/webhook
 * Webhook Stripe pour gérer les événements de paiement
 *
 * Événements gérés:
 * - checkout.session.completed: Paiement via Checkout Session
 * - payment_intent.succeeded: Paiement réussi
 * - payment_intent.payment_failed: Paiement échoué
 * - charge.refunded: Remboursement effectué
 * - refund.created: Remboursement créé
 * - refund.updated: Remboursement mis à jour
 * - account.updated: Mise à jour compte Stripe Connect du chauffeur
 */
export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get("Stripe-Signature")

  if (!signature) {
    console.error("Webhook error: Missing signature")
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const bookingId = session.metadata?.bookingId

        if (bookingId) {
          const booking = await db.booking.findUnique({
            where: { id: bookingId },
            include: { job: true, driver: true },
          })

          if (booking) {
            // Update booking with payment info and change status to COMPLETED
            await db.booking.update({
              where: { id: bookingId },
              data: {
                stripePaymentId: session.payment_intent as string,
                stripePaymentStatus: "succeeded",
                paidAt: new Date(),
                status: "COMPLETED",
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

            // If driver has Stripe Connect account, initiate transfer
            if (booking.driver.stripeAccountId) {
              try {
                // Transfer funds to driver (minus platform fee if applicable)
                // For now, we transfer the full amount
                await stripe.transfers.create({
                  amount: booking.agreedPrice,
                  currency: "eur",
                  destination: booking.driver.stripeAccountId,
                  metadata: {
                    bookingId: booking.id,
                    jobId: booking.jobId,
                    driverId: booking.driverId,
                    missionType: booking.job.typeMission,
                  },
                  description: `Paiement mission: ${booking.job.title}`,
                })

                console.log(`[Webhook] Transfer initiated to driver ${booking.driverId}`)
              } catch (transferError: any) {
                console.error(`[Webhook] Transfer failed for booking ${bookingId}:`, transferError.message)
                // Payment succeeded but transfer failed - needs manual intervention
              }
            }

            console.log(`[Webhook] Checkout completed for booking ${bookingId}`)
          }
        }
        break
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const bookingId = paymentIntent.metadata.bookingId

        if (bookingId) {
          const booking = await db.booking.findUnique({
            where: { id: bookingId },
            include: { job: true, driver: true },
          })

          if (booking) {
            // Flow Uber Eats: L'entreprise paie maintenant, le chauffeur sera payé après validation
            // Update booking: marquer paiement confirmé et passer en ASSIGNED (chauffeur assigné, mission prête)
            await db.booking.update({
              where: { id: bookingId },
              data: {
                stripePaymentId: paymentIntent.id,
                stripePaymentStatus: "payment_paid", // Entreprise a payé
                paidAt: new Date(),
                status: "ASSIGNED", // Mission assignée au chauffeur, prête à être exécutée
              },
            })

            // Update job status to ASSIGNED
            await db.job.update({
              where: { id: booking.jobId },
              data: { status: "ASSIGNED" },
            })

            console.log(
              `[Webhook] Payment succeeded for booking ${bookingId} - Driver assigned, awaiting delivery`
            )

            // NOTE: Le paiement au chauffeur (transfer) sera effectué après validation de la livraison
            // Voir endpoint /api/bookings/[id]/validate-completion
          }
        }
        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const bookingId = paymentIntent.metadata.bookingId

        if (bookingId) {
          await db.booking.update({
            where: { id: bookingId },
            data: {
              stripePaymentStatus: "failed",
            },
          })

          console.error(`[Webhook] Payment failed for booking ${bookingId}`)
        }
        break
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = charge.payment_intent as string

        if (paymentIntentId) {
          // Find booking by payment intent ID
          const booking = await db.booking.findFirst({
            where: { stripePaymentId: paymentIntentId },
          })

          if (booking) {
            await db.booking.update({
              where: { id: booking.id },
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

            console.log(`[Webhook] Refund processed for booking ${booking.id}`)
          }
        }
        break
      }

      case "refund.created":
      case "refund.updated": {
        const refund = event.data.object as Stripe.Refund
        const paymentIntentId = refund.payment_intent as string

        if (paymentIntentId) {
          // Find booking by payment intent ID
          const booking = await db.booking.findFirst({
            where: { stripePaymentId: paymentIntentId },
            include: { job: true },
          })

          if (booking) {
            const timestamp = new Date().toISOString()
            let updateNote = ""

            if (event.type === "refund.created") {
              updateNote = `\n[${timestamp}] Stripe webhook: Refund créé (ID: ${refund.id}, Montant: ${refund.amount / 100}€, Statut: ${refund.status})`
            } else {
              updateNote = `\n[${timestamp}] Stripe webhook: Refund mis à jour (ID: ${refund.id}, Statut: ${refund.status})`
            }

            // Update booking notes with refund status
            const existingNotes = booking.companyNotes || ""
            await db.booking.update({
              where: { id: booking.id },
              data: {
                companyNotes: `${existingNotes}${updateNote}`,
                stripePaymentStatus: refund.status === "succeeded" ? "refunded" : "refund_pending",
              },
            })

            // If refund succeeded, ensure booking and job are cancelled
            if (refund.status === "succeeded") {
              await db.booking.update({
                where: { id: booking.id },
                data: { status: "CANCELLED" },
              })

              await db.job.update({
                where: { id: booking.jobId },
                data: { status: "CANCELLED" },
              })

              console.log(`[Webhook] Refund succeeded for booking ${booking.id} - Amount: ${refund.amount / 100}€`)
            } else {
              console.log(`[Webhook] Refund ${event.type} for booking ${booking.id} - Status: ${refund.status}`)
            }
          }
        }
        break
      }

      case "account.updated": {
        // When a driver's Stripe Connect account is fully verified
        const account = event.data.object as Stripe.Account

        if (account.charges_enabled && account.payouts_enabled) {
          await db.driverProfile.updateMany({
            where: { stripeAccountId: account.id },
            data: { isVerified: true },
          })

          console.log(`[Webhook] Driver account ${account.id} verified`)
        }
        break
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error(`[Webhook] Error processing event ${event.type}:`, error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true })
}
