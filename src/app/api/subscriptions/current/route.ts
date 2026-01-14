import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-auth"

/**
 * GET /api/subscriptions/current
 * Récupère l'abonnement actuel de l'utilisateur
 */
export async function GET() {
  try {
    const authResult = await requireAuth()
    if ("error" in authResult) return authResult.error

    const { user } = authResult

    const subscription = await db.subscription.findUnique({
      where: { userId: user.id },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            slug: true,
            tier: true,
            priceMonthly: true,
            priceYearly: true,
            maxMissionsPerMonth: true,
            maxApplicationsPerMonth: true,
            commissionRate: true,
            features: true,
          },
        },
      },
    })

    if (!subscription) {
      return NextResponse.json({
        subscription: null,
        plan: null,
        tier: "FREE",
      })
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        billingInterval: subscription.billingInterval,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        missionsUsedThisMonth: subscription.missionsUsedThisMonth,
        applicationsUsedThisMonth: subscription.applicationsUsedThisMonth,
      },
      plan: subscription.plan,
      tier: subscription.plan.tier,
    })
  } catch (error) {
    console.error("Error fetching current subscription:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'abonnement" },
      { status: 500 }
    )
  }
}
