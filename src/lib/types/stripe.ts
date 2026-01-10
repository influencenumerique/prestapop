/**
 * Types TypeScript pour l'intégration Stripe
 */

import { MissionType } from "@prisma/client"

/**
 * Statuts de paiement Stripe
 */
export type StripePaymentStatus =
  | "pending"
  | "succeeded"
  | "failed"
  | "refunded"
  | "canceled"

/**
 * Raisons de remboursement Stripe
 */
export type StripeRefundReason =
  | "duplicate"
  | "fraudulent"
  | "requested_by_customer"

/**
 * Métadonnées pour PaymentIntent de mission
 */
export interface MissionPaymentMetadata {
  bookingId: string
  jobId: string
  driverId: string
  companyId: string
  missionType: MissionType
}

/**
 * Métadonnées pour Checkout Session de mission
 */
export interface MissionCheckoutMetadata extends MissionPaymentMetadata {
  [key: string]: string
}

/**
 * Payload pour créer un paiement
 */
export interface CreatePaymentPayload {
  bookingId: string
}

/**
 * Payload pour créer un remboursement
 */
export interface CreateRefundPayload {
  bookingId: string
  reason?: StripeRefundReason
}

/**
 * Réponse de création de PaymentIntent
 */
export interface PaymentIntentResponse {
  clientSecret: string
  paymentIntentId: string
}

/**
 * Réponse de statut de paiement
 */
export interface PaymentStatusResponse {
  status: string
  amount: number
  currency: string
  created: number
  paidAt?: Date | null
}

/**
 * Réponse de paiement sans PaymentIntent
 */
export interface NoPaymentResponse {
  status: "no_payment"
  message: string
}

/**
 * Réponse de création de remboursement
 */
export interface RefundResponse {
  success: boolean
  refundId: string
  amount: number
  status: string
  message: string
}

/**
 * Détails d'un remboursement
 */
export interface RefundDetails {
  id: string
  amount: number
  currency: string
  status: string
  reason: string | null
  created: number
}

/**
 * Réponse de liste de remboursements
 */
export interface RefundListResponse {
  refunded: boolean
  refunds?: RefundDetails[]
  message?: string
}

/**
 * Réponse de création de Checkout Session
 */
export interface CheckoutSessionResponse {
  url: string
}

/**
 * Configuration de calcul de tarif
 */
export interface MissionRateCalculation {
  dayRate: number // Tarif journée en centimes
  missionType: MissionType
  agreedPrice: number // Prix final en centimes
}

/**
 * Calcule le prix d'une mission selon son type
 */
export function calculateMissionPrice(
  dayRate: number,
  missionType: MissionType
): number {
  switch (missionType) {
    case "DAY":
      return dayRate
    case "HALF_DAY":
      return Math.floor(dayRate / 2)
    case "WEEK":
      return dayRate * 5
    default:
      return dayRate
  }
}

/**
 * Formate un montant en centimes vers une chaîne en euros
 */
export function formatPrice(amountInCents: number): string {
  const euros = amountInCents / 100
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(euros)
}

/**
 * Convertit des euros en centimes
 */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100)
}

/**
 * Convertit des centimes en euros
 */
export function centsToEuros(cents: number): number {
  return cents / 100
}

/**
 * Vérifie si un paiement est complété
 */
export function isPaymentCompleted(status: StripePaymentStatus): boolean {
  return status === "succeeded"
}

/**
 * Vérifie si un paiement peut être remboursé
 */
export function canRefundPayment(status: StripePaymentStatus): boolean {
  return status === "succeeded"
}

/**
 * Type guard pour vérifier si une réponse est un PaymentIntent
 */
export function isPaymentIntentResponse(
  response: PaymentIntentResponse | NoPaymentResponse
): response is PaymentIntentResponse {
  return "clientSecret" in response && "paymentIntentId" in response
}

/**
 * Type guard pour vérifier si une réponse indique l'absence de paiement
 */
export function isNoPaymentResponse(
  response: PaymentIntentResponse | NoPaymentResponse
): response is NoPaymentResponse {
  return "status" in response && response.status === "no_payment"
}

/**
 * Erreurs Stripe personnalisées
 */
export class StripePaymentError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = "StripePaymentError"
  }
}

/**
 * Labels pour les types de mission
 */
export const MISSION_TYPE_LABELS: Record<MissionType, string> = {
  DAY: "Journée complète",
  HALF_DAY: "Demi-journée",
  WEEK: "Mission semaine",
}

/**
 * Labels pour les statuts de paiement
 */
export const PAYMENT_STATUS_LABELS: Record<StripePaymentStatus, string> = {
  pending: "En attente",
  succeeded: "Payé",
  failed: "Échoué",
  refunded: "Remboursé",
  canceled: "Annulé",
}

/**
 * Labels pour les raisons de remboursement
 */
export const REFUND_REASON_LABELS: Record<StripeRefundReason, string> = {
  duplicate: "Transaction en double",
  fraudulent: "Fraude détectée",
  requested_by_customer: "Demandé par le client",
}
