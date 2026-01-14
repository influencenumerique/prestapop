import Stripe from 'stripe'

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
  })
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    const client = getStripeClient()
    return (client as any)[prop]
  }
})

/**
 * Crée un PaymentIntent pour une mission de transport
 * @param amount - Montant en centimes
 * @param metadata - Métadonnées de la transaction
 */
export async function createPaymentIntent(amount: number, metadata: Record<string, string>) {
  const client = getStripeClient()
  return client.paymentIntents.create({
    amount,
    currency: 'eur',
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  })
}

/**
 * Crée un PaymentIntent pour une mission avec calcul automatique du montant
 * selon le type de mission (journée, demi-journée, semaine)
 * @param bookingId - ID de la réservation
 * @param dayRate - Tarif journée en centimes
 * @param missionType - Type de mission (DAY, HALF_DAY, WEEK)
 */
export async function createMissionPaymentIntent(
  bookingId: string,
  jobId: string,
  driverId: string,
  companyId: string,
  agreedPrice: number,
  missionType: string,
  description: string
) {
  const client = getStripeClient()

  return client.paymentIntents.create({
    amount: agreedPrice,
    currency: 'eur',
    metadata: {
      bookingId,
      jobId,
      driverId,
      companyId,
      missionType,
    },
    description,
    automatic_payment_methods: {
      enabled: true,
    },
  })
}

/**
 * Crée un compte Stripe Connect pour un chauffeur
 * @param email - Email du chauffeur
 */
export async function createConnectAccount(email: string) {
  const client = getStripeClient()
  return client.accounts.create({
    type: 'express',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  })
}

/**
 * Crée un lien d'onboarding pour le compte Stripe Connect
 * @param accountId - ID du compte Stripe Connect
 * @param refreshUrl - URL de rafraîchissement
 * @param returnUrl - URL de retour
 */
export async function createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
  const client = getStripeClient()
  return client.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  })
}

/**
 * Crée un remboursement pour une mission annulée
 * @param paymentIntentId - ID du PaymentIntent
 * @param metadata - Métadonnées du remboursement
 */
export async function createRefund(
  paymentIntentId: string,
  metadata: Record<string, string>,
  reason?: Stripe.RefundCreateParams.Reason
) {
  const client = getStripeClient()
  return client.refunds.create({
    payment_intent: paymentIntentId,
    reason: reason || 'requested_by_customer',
    metadata,
  })
}

/**
 * Récupère le statut d'un PaymentIntent
 * @param paymentIntentId - ID du PaymentIntent
 */
export async function getPaymentIntentStatus(paymentIntentId: string) {
  const client = getStripeClient()
  const paymentIntent = await client.paymentIntents.retrieve(paymentIntentId)
  return {
    status: paymentIntent.status,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    created: paymentIntent.created,
  }
}

/**
 * Transfère des fonds vers le compte Stripe Connect d'un chauffeur
 * @param amount - Montant en centimes
 * @param destinationAccountId - ID du compte Stripe Connect du chauffeur
 * @param metadata - Métadonnées du transfert
 */
export async function transferToDriver(
  amount: number,
  destinationAccountId: string,
  metadata: Record<string, string>
) {
  const client = getStripeClient()
  return client.transfers.create({
    amount,
    currency: 'eur',
    destination: destinationAccountId,
    metadata,
  })
}

// ========== FONCTIONS D'ABONNEMENT ==========

/**
 * Crée ou récupère un Customer Stripe pour un utilisateur
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  const client = getStripeClient()

  // Chercher un customer existant par email
  const existingCustomers = await client.customers.list({
    email,
    limit: 1,
  })

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0].id
  }

  // Créer un nouveau customer
  const customer = await client.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId,
    },
  })

  return customer.id
}

/**
 * Crée une session Checkout pour un abonnement
 */
export async function createSubscriptionCheckout(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  metadata: Record<string, string>
): Promise<Stripe.Checkout.Session> {
  const client = getStripeClient()

  return client.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    subscription_data: {
      metadata,
    },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    locale: 'fr',
  })
}

/**
 * Crée une session du portail client Stripe pour gérer l'abonnement
 */
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const client = getStripeClient()

  return client.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

/**
 * Récupère les détails d'un abonnement Stripe
 */
export async function getStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const client = getStripeClient()
  return client.subscriptions.retrieve(subscriptionId)
}

/**
 * Annule un abonnement à la fin de la période en cours
 */
export async function cancelSubscriptionAtPeriodEnd(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const client = getStripeClient()
  return client.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })
}

/**
 * Réactive un abonnement qui était prévu pour être annulé
 */
export async function reactivateSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const client = getStripeClient()
  return client.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })
}

/**
 * Change l'abonnement vers un autre plan
 */
export async function changeSubscriptionPlan(
  subscriptionId: string,
  newPriceId: string
): Promise<Stripe.Subscription> {
  const client = getStripeClient()

  // Récupérer l'abonnement actuel
  const subscription = await client.subscriptions.retrieve(subscriptionId)

  // Mettre à jour vers le nouveau plan
  return client.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: 'create_prorations',
  })
}

/**
 * Annule immédiatement un abonnement
 */
export async function cancelSubscriptionImmediately(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const client = getStripeClient()
  return client.subscriptions.cancel(subscriptionId)
}

/**
 * Récupère les factures d'un customer
 */
export async function getCustomerInvoices(
  customerId: string,
  limit: number = 10
): Promise<Stripe.Invoice[]> {
  const client = getStripeClient()
  const invoices = await client.invoices.list({
    customer: customerId,
    limit,
  })
  return invoices.data
}

/**
 * Vérifie la signature d'un webhook Stripe
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  const client = getStripeClient()
  return client.webhooks.constructEvent(payload, signature, webhookSecret)
}
