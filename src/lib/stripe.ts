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
