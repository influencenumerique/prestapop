import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { getUsageStats } from "@/lib/subscription-limits"

/**
 * GET /api/subscriptions/usage
 * Récupère les statistiques d'usage de l'abonnement
 */
export async function GET() {
  try {
    const authResult = await requireAuth()
    if ("error" in authResult) return authResult.error

    const { user } = authResult

    const usage = await getUsageStats(user.id)

    return NextResponse.json({ usage })
  } catch (error) {
    console.error("Error fetching usage stats:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques d'usage" },
      { status: 500 }
    )
  }
}
