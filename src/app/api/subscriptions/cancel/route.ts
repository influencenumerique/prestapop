import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-auth"
import { cancelSubscriptionAtPeriodEnd } from "@/lib/stripe"

/**
 * POST /api/subscriptions/cancel
 * Annule l'abonnement à la fin de la période en cours
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

    if (subscription.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "L'abonnement n'est pas actif" },
        { status: 400 }
      )
    }

    if (subscription.cancelAtPeriodEnd) {
      return NextResponse.json(
        { error: "L'abonnement est déjà programmé pour être annulé" },
        { status: 400 }
      )
    }

    // Annuler sur Stripe
    await cancelSubscriptionAtPeriodEnd(subscription.stripeSubscriptionId)

    // Mettre à jour en DB
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Votre abonnement sera annulé à la fin de la période en cours",
      cancelAt: subscription.currentPeriodEnd,
    })
  } catch (error) {
    console.error("Error canceling subscription:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'annulation de l'abonnement" },
      { status: 500 }
    )
  }
}
