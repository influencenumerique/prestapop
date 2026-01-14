import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-auth"
import { reactivateSubscription } from "@/lib/stripe"

/**
 * POST /api/subscriptions/reactivate
 * Réactive un abonnement qui était programmé pour être annulé
 */
export async function POST() {
  try {
    const authResult = await requireAuth()
    if ("error" in authResult) return authResult.error

    const { user } = authResult

    const subscription = await db.subscription.findUnique({
      where: { userId: user.id },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: "Aucun abonnement trouvé" },
        { status: 404 }
      )
    }

    if (!subscription.cancelAtPeriodEnd) {
      return NextResponse.json(
        { error: "L'abonnement n'est pas programmé pour être annulé" },
        { status: 400 }
      )
    }

    // Réactiver sur Stripe
    await reactivateSubscription(subscription.stripeSubscriptionId)

    // Mettre à jour en DB
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: false,
        canceledAt: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Votre abonnement a été réactivé",
    })
  } catch (error) {
    console.error("Error reactivating subscription:", error)
    return NextResponse.json(
      { error: "Erreur lors de la réactivation de l'abonnement" },
      { status: 500 }
    )
  }
}
