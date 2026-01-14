import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-auth"
import {
  getOrCreateStripeCustomer,
  createSubscriptionCheckout,
} from "@/lib/stripe"
import { z } from "zod"
import { BillingInterval } from "@prisma/client"

const checkoutSchema = z.object({
  planId: z.string().min(1, "Plan requis"),
  billingInterval: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
})

/**
 * POST /api/subscriptions/checkout
 * Crée une session Stripe Checkout pour un abonnement
 */
export async function POST(req: Request) {
  try {
    const authResult = await requireAuth()
    if ("error" in authResult) return authResult.error

    const { user } = authResult

    // Vérifier si l'utilisateur a déjà un abonnement actif
    const existingSubscription = await db.subscription.findUnique({
      where: { userId: user.id },
    })

    if (existingSubscription && existingSubscription.status === "ACTIVE") {
      return NextResponse.json(
        { error: "Vous avez déjà un abonnement actif. Utilisez le portail client pour le modifier." },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { planId, billingInterval } = checkoutSchema.parse(body)

    // Récupérer le plan
    const plan = await db.subscriptionPlan.findUnique({
      where: { id: planId },
    })

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: "Plan non trouvé ou inactif" },
        { status: 404 }
      )
    }

    // Vérifier que le plan correspond au rôle de l'utilisateur
    if (
      (user.role === "DRIVER" && plan.targetRole !== "DRIVER") ||
      (user.role === "COMPANY" && plan.targetRole !== "COMPANY")
    ) {
      return NextResponse.json(
        { error: "Ce plan n'est pas disponible pour votre type de compte" },
        { status: 400 }
      )
    }

    // Récupérer le price ID Stripe approprié
    const priceId =
      billingInterval === "YEARLY"
        ? plan.stripePriceIdYearly
        : plan.stripePriceIdMonthly

    if (!priceId) {
      return NextResponse.json(
        { error: "Ce plan n'est pas encore configuré pour le paiement" },
        { status: 400 }
      )
    }

    // Créer ou récupérer le customer Stripe
    let stripeCustomerId = user.stripeCustomerId

    if (!stripeCustomerId) {
      stripeCustomerId = await getOrCreateStripeCustomer(
        user.id,
        user.email!,
        user.name || undefined
      )

      // Sauvegarder le customer ID
      await db.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      })
    }

    // Créer la session checkout
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const successUrl = `${baseUrl}/dashboard?subscription=success`
    const cancelUrl = `${baseUrl}/pricing?subscription=cancelled`

    const checkoutSession = await createSubscriptionCheckout(
      stripeCustomerId,
      priceId,
      successUrl,
      cancelUrl,
      {
        userId: user.id,
        planId: plan.id,
        billingInterval,
      }
    )

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
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
      { error: "Erreur lors de la création de la session de paiement" },
      { status: 500 }
    )
  }
}
