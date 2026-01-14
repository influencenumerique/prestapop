import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { constructWebhookEvent } from "@/lib/stripe"
import { SubscriptionStatus, BillingInterval } from "@prisma/client"
import Stripe from "stripe"

/**
 * POST /api/subscriptions/webhook
 * Gère les webhooks Stripe pour les abonnements
 */
export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured")
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    event = constructWebhookEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    )
  }

  // Enregistrer l'événement pour audit
  try {
    await db.stripeWebhookEvent.create({
      data: {
        stripeEventId: event.id,
        type: event.type,
        data: event.data as object,
      },
    })
  } catch (err) {
    // L'événement existe peut-être déjà (idempotence)
    console.log("Event already processed or error:", err)
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(invoice)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Marquer l'événement comme traité
    await db.stripeWebhookEvent.update({
      where: { stripeEventId: event.id },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing webhook:", error)

    // Enregistrer l'erreur
    await db.stripeWebhookEvent.update({
      where: { stripeEventId: event.id },
      data: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    })

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription" || !session.subscription) {
    return
  }

  const userId = session.metadata?.userId
  const planId = session.metadata?.planId
  const billingInterval = session.metadata?.billingInterval as BillingInterval

  if (!userId || !planId) {
    console.error("Missing metadata in checkout session:", session.id)
    return
  }

  // Mettre à jour le stripeCustomerId de l'utilisateur si nécessaire
  if (session.customer) {
    await db.user.update({
      where: { id: userId },
      data: { stripeCustomerId: session.customer as string },
    })
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  const planId = subscription.metadata?.planId

  if (!userId || !planId) {
    console.error("Missing metadata in subscription:", subscription.id)
    return
  }

  // Mapper le statut Stripe vers notre enum
  const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
    active: SubscriptionStatus.ACTIVE,
    past_due: SubscriptionStatus.PAST_DUE,
    canceled: SubscriptionStatus.CANCELED,
    incomplete: SubscriptionStatus.INCOMPLETE,
    incomplete_expired: SubscriptionStatus.INCOMPLETE_EXPIRED,
    trialing: SubscriptionStatus.TRIALING,
    unpaid: SubscriptionStatus.UNPAID,
    paused: SubscriptionStatus.PAUSED,
  }

  const billingInterval =
    subscription.items.data[0]?.price.recurring?.interval === "year"
      ? BillingInterval.YEARLY
      : BillingInterval.MONTHLY

  // Upsert l'abonnement
  await db.subscription.upsert({
    where: { userId },
    create: {
      userId,
      planId,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      status: statusMap[subscription.status] || SubscriptionStatus.INCOMPLETE,
      billingInterval,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
      trialStart: subscription.trial_start
        ? new Date(subscription.trial_start * 1000)
        : null,
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
    },
    update: {
      planId,
      status: statusMap[subscription.status] || SubscriptionStatus.INCOMPLETE,
      billingInterval,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
    },
  })

  // Réinitialiser les compteurs d'usage si nouvelle période
  const existingSubscription = await db.subscription.findUnique({
    where: { userId },
  })

  if (existingSubscription) {
    const newPeriodStart = new Date(subscription.current_period_start * 1000)
    if (existingSubscription.usagePeriodStart < newPeriodStart) {
      await db.subscription.update({
        where: { userId },
        data: {
          missionsUsedThisMonth: 0,
          applicationsUsedThisMonth: 0,
          usagePeriodStart: newPeriodStart,
        },
      })
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId

  if (!userId) {
    // Essayer de trouver par stripeSubscriptionId
    const existingSubscription = await db.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    })

    if (existingSubscription) {
      await db.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          status: SubscriptionStatus.CANCELED,
          endedAt: new Date(),
        },
      })
    }
    return
  }

  await db.subscription.update({
    where: { userId },
    data: {
      status: SubscriptionStatus.CANCELED,
      endedAt: new Date(),
    },
  })
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return

  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription.id

  const subscription = await db.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  })

  if (!subscription) return

  // Créer ou mettre à jour la facture
  await db.invoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: {
      subscriptionId: subscription.id,
      stripeInvoiceId: invoice.id,
      amountDue: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status || "paid",
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
      paidAt: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : new Date(),
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
    },
    update: {
      amountPaid: invoice.amount_paid,
      status: invoice.status || "paid",
      paidAt: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : new Date(),
    },
  })
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return

  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription.id

  // Mettre à jour le statut de l'abonnement
  await db.subscription.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: { status: SubscriptionStatus.PAST_DUE },
  })
}
