import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { Role } from "@prisma/client"

/**
 * GET /api/subscriptions/plans
 * Liste tous les plans d'abonnement actifs
 * Filtre par rôle si l'utilisateur est connecté
 */
export async function GET() {
  try {
    const session = await auth()
    let targetRole: Role | undefined

    // Si connecté, filtrer par rôle
    if (session?.user?.role) {
      if (session.user.role === "DRIVER") {
        targetRole = Role.DRIVER
      } else if (session.user.role === "COMPANY") {
        targetRole = Role.COMPANY
      }
    }

    const plans = await db.subscriptionPlan.findMany({
      where: {
        isActive: true,
        ...(targetRole && { targetRole }),
      },
      orderBy: [
        { targetRole: "asc" },
        { sortOrder: "asc" },
      ],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        tier: true,
        targetRole: true,
        priceMonthly: true,
        priceYearly: true,
        maxMissionsPerMonth: true,
        maxApplicationsPerMonth: true,
        commissionRate: true,
        features: true,
        isPopular: true,
      },
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error("Error fetching subscription plans:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des plans" },
      { status: 500 }
    )
  }
}
