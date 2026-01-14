import { db } from "@/lib/db"
import { SubscriptionTier, SubscriptionStatus, Role } from "@prisma/client"

// Limites par défaut pour le plan gratuit
const FREE_TIER_LIMITS = {
  DRIVER: {
    maxApplicationsPerMonth: 3,
    commissionRate: 0.15,
  },
  COMPANY: {
    maxMissionsPerMonth: 1,
    commissionRate: 0.15,
  },
}

export interface SubscriptionLimits {
  tier: SubscriptionTier
  maxMissionsPerMonth: number | null
  maxApplicationsPerMonth: number | null
  commissionRate: number
  canCreateMission: boolean
  canApplyToMission: boolean
  remainingMissions: number | null
  remainingApplications: number | null
}

export interface LimitCheckResult {
  allowed: boolean
  reason?: string
  remaining?: number
  limit?: number
  upgradeUrl?: string
}

/**
 * Récupère l'abonnement actif d'un utilisateur avec son plan
 */
export async function getUserSubscription(userId: string) {
  return db.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  })
}

/**
 * Récupère les limites d'abonnement d'un utilisateur
 */
export async function getSubscriptionLimits(userId: string): Promise<SubscriptionLimits> {
  const subscription = await getUserSubscription(userId)

  // Utilisateur sans abonnement = plan gratuit
  if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
    // Récupérer le rôle de l'utilisateur
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    const isDriver = user?.role === Role.DRIVER
    const freeLimits = isDriver ? FREE_TIER_LIMITS.DRIVER : FREE_TIER_LIMITS.COMPANY

    return {
      tier: SubscriptionTier.FREE,
      maxMissionsPerMonth: isDriver ? null : FREE_TIER_LIMITS.COMPANY.maxMissionsPerMonth,
      maxApplicationsPerMonth: isDriver ? FREE_TIER_LIMITS.DRIVER.maxApplicationsPerMonth : null,
      commissionRate: freeLimits.commissionRate,
      canCreateMission: true, // Sera vérifié avec checkMissionLimit
      canApplyToMission: true, // Sera vérifié avec checkApplicationLimit
      remainingMissions: null,
      remainingApplications: null,
    }
  }

  const plan = subscription.plan
  const missionsUsed = subscription.missionsUsedThisMonth
  const applicationsUsed = subscription.applicationsUsedThisMonth

  return {
    tier: plan.tier,
    maxMissionsPerMonth: plan.maxMissionsPerMonth,
    maxApplicationsPerMonth: plan.maxApplicationsPerMonth,
    commissionRate: plan.commissionRate,
    canCreateMission: plan.maxMissionsPerMonth === null || missionsUsed < plan.maxMissionsPerMonth,
    canApplyToMission: plan.maxApplicationsPerMonth === null || applicationsUsed < plan.maxApplicationsPerMonth,
    remainingMissions: plan.maxMissionsPerMonth ? plan.maxMissionsPerMonth - missionsUsed : null,
    remainingApplications: plan.maxApplicationsPerMonth ? plan.maxApplicationsPerMonth - applicationsUsed : null,
  }
}

/**
 * Vérifie si une entreprise peut créer une nouvelle mission
 */
export async function checkMissionLimit(userId: string): Promise<LimitCheckResult> {
  const subscription = await getUserSubscription(userId)

  // Plan gratuit
  if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
    // Compter les missions créées ce mois
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { company: true },
    })

    if (!user?.company) {
      return { allowed: false, reason: "Profil entreprise non trouvé" }
    }

    const missionsThisMonth = await db.job.count({
      where: {
        companyId: user.company.id,
        createdAt: { gte: startOfMonth },
      },
    })

    const limit = FREE_TIER_LIMITS.COMPANY.maxMissionsPerMonth
    if (missionsThisMonth >= limit) {
      return {
        allowed: false,
        reason: `Vous avez atteint la limite de ${limit} mission(s) par mois sur le plan gratuit.`,
        remaining: 0,
        limit,
        upgradeUrl: "/pricing",
      }
    }

    return {
      allowed: true,
      remaining: limit - missionsThisMonth,
      limit,
    }
  }

  // Plan payant
  const plan = subscription.plan
  if (plan.maxMissionsPerMonth === null) {
    return { allowed: true, remaining: undefined, limit: undefined }
  }

  const remaining = plan.maxMissionsPerMonth - subscription.missionsUsedThisMonth
  if (remaining <= 0) {
    return {
      allowed: false,
      reason: `Vous avez atteint la limite de ${plan.maxMissionsPerMonth} missions par mois.`,
      remaining: 0,
      limit: plan.maxMissionsPerMonth,
      upgradeUrl: "/pricing",
    }
  }

  return {
    allowed: true,
    remaining,
    limit: plan.maxMissionsPerMonth,
  }
}

/**
 * Vérifie si un chauffeur peut candidater à une mission
 */
export async function checkApplicationLimit(userId: string): Promise<LimitCheckResult> {
  const subscription = await getUserSubscription(userId)

  // Plan gratuit
  if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
    // Compter les candidatures ce mois
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { driverProfile: true },
    })

    if (!user?.driverProfile) {
      return { allowed: false, reason: "Profil chauffeur non trouvé" }
    }

    const applicationsThisMonth = await db.booking.count({
      where: {
        driverId: user.driverProfile.id,
        createdAt: { gte: startOfMonth },
      },
    })

    const limit = FREE_TIER_LIMITS.DRIVER.maxApplicationsPerMonth
    if (applicationsThisMonth >= limit) {
      return {
        allowed: false,
        reason: `Vous avez atteint la limite de ${limit} candidature(s) par mois sur le plan gratuit.`,
        remaining: 0,
        limit,
        upgradeUrl: "/pricing",
      }
    }

    return {
      allowed: true,
      remaining: limit - applicationsThisMonth,
      limit,
    }
  }

  // Plan payant
  const plan = subscription.plan
  if (plan.maxApplicationsPerMonth === null) {
    return { allowed: true, remaining: undefined, limit: undefined }
  }

  const remaining = plan.maxApplicationsPerMonth - subscription.applicationsUsedThisMonth
  if (remaining <= 0) {
    return {
      allowed: false,
      reason: `Vous avez atteint la limite de ${plan.maxApplicationsPerMonth} candidatures par mois.`,
      remaining: 0,
      limit: plan.maxApplicationsPerMonth,
      upgradeUrl: "/pricing",
    }
  }

  return {
    allowed: true,
    remaining,
    limit: plan.maxApplicationsPerMonth,
  }
}

/**
 * Récupère le taux de commission pour un utilisateur
 */
export async function getCommissionRate(userId: string): Promise<number> {
  const subscription = await getUserSubscription(userId)

  if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
    return 0.15 // 15% par défaut
  }

  return subscription.plan.commissionRate
}

/**
 * Incrémente le compteur de missions utilisées
 */
export async function incrementMissionUsage(userId: string): Promise<void> {
  const subscription = await db.subscription.findUnique({
    where: { userId },
  })

  if (subscription && subscription.status === SubscriptionStatus.ACTIVE) {
    await db.subscription.update({
      where: { userId },
      data: {
        missionsUsedThisMonth: { increment: 1 },
      },
    })
  }
}

/**
 * Incrémente le compteur de candidatures utilisées
 */
export async function incrementApplicationUsage(userId: string): Promise<void> {
  const subscription = await db.subscription.findUnique({
    where: { userId },
  })

  if (subscription && subscription.status === SubscriptionStatus.ACTIVE) {
    await db.subscription.update({
      where: { userId },
      data: {
        applicationsUsedThisMonth: { increment: 1 },
      },
    })
  }
}

/**
 * Réinitialise les compteurs d'usage mensuel (à appeler via webhook ou cron)
 */
export async function resetMonthlyUsage(subscriptionId: string): Promise<void> {
  await db.subscription.update({
    where: { id: subscriptionId },
    data: {
      missionsUsedThisMonth: 0,
      applicationsUsedThisMonth: 0,
      usagePeriodStart: new Date(),
    },
  })
}

/**
 * Récupère les statistiques d'usage pour un utilisateur
 */
export async function getUsageStats(userId: string) {
  const subscription = await getUserSubscription(userId)
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
    // Plan gratuit - compter depuis le DB
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    if (user?.role === Role.DRIVER) {
      const driverProfile = await db.driverProfile.findUnique({
        where: { userId },
      })
      const applicationsThisMonth = driverProfile ? await db.booking.count({
        where: {
          driverId: driverProfile.id,
          createdAt: { gte: startOfMonth },
        },
      }) : 0

      return {
        tier: SubscriptionTier.FREE,
        applicationsUsed: applicationsThisMonth,
        applicationsLimit: FREE_TIER_LIMITS.DRIVER.maxApplicationsPerMonth,
        missionsUsed: null,
        missionsLimit: null,
        commissionRate: FREE_TIER_LIMITS.DRIVER.commissionRate,
      }
    } else {
      const company = await db.company.findUnique({
        where: { userId },
      })
      const missionsThisMonth = company ? await db.job.count({
        where: {
          companyId: company.id,
          createdAt: { gte: startOfMonth },
        },
      }) : 0

      return {
        tier: SubscriptionTier.FREE,
        missionsUsed: missionsThisMonth,
        missionsLimit: FREE_TIER_LIMITS.COMPANY.maxMissionsPerMonth,
        applicationsUsed: null,
        applicationsLimit: null,
        commissionRate: FREE_TIER_LIMITS.COMPANY.commissionRate,
      }
    }
  }

  const plan = subscription.plan
  return {
    tier: plan.tier,
    missionsUsed: subscription.missionsUsedThisMonth,
    missionsLimit: plan.maxMissionsPerMonth,
    applicationsUsed: subscription.applicationsUsedThisMonth,
    applicationsLimit: plan.maxApplicationsPerMonth,
    commissionRate: plan.commissionRate,
    currentPeriodEnd: subscription.currentPeriodEnd,
  }
}
