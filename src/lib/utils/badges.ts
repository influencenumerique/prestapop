import { db } from "@/lib/db"
import { BadgeType, FeedbackTag } from "@prisma/client"

interface BadgeRule {
  type: BadgeType
  condition: (
    driverId: string,
    stats: {
      tagStats: Array<{ tag: FeedbackTag; count: number }>
      totalDeliveries: number
      rating: number
      totalReviews: number
      region?: string | null
    }
  ) => Promise<boolean>
}

// Règles pour chaque badge
const BADGE_RULES: BadgeRule[] = [
  {
    type: BadgeType.PUNCTUALITY_CHAMPION,
    condition: async (driverId, stats) => {
      const punctualCount = stats.tagStats.find(
        (t) => t.tag === FeedbackTag.PUNCTUAL
      )?.count || 0
      return punctualCount >= 50
    },
  },
  {
    type: BadgeType.CAREFUL_EXPERT,
    condition: async (driverId, stats) => {
      const carefulCount = stats.tagStats.find(
        (t) => t.tag === FeedbackTag.CAREFUL
      )?.count || 0
      return carefulCount >= 50
    },
  },
  {
    type: BadgeType.SPEED_DEMON,
    condition: async (driverId, stats) => {
      const fastCount = stats.tagStats.find(
        (t) => t.tag === FeedbackTag.FAST
      )?.count || 0
      return fastCount >= 50
    },
  },
  {
    type: BadgeType.COMMUNICATION_STAR,
    condition: async (driverId, stats) => {
      const communicativeCount = stats.tagStats.find(
        (t) => t.tag === FeedbackTag.COMMUNICATIVE
      )?.count || 0
      return communicativeCount >= 50
    },
  },
  {
    type: BadgeType.TOP_10_REGION,
    condition: async (driverId, stats) => {
      if (!stats.region) return false

      // Récupérer le top 10 de la région
      const topDrivers = await db.driverProfile.findMany({
        where: {
          region: stats.region,
          totalReviews: { gte: 5 }, // Au moins 5 avis pour être classé
        },
        orderBy: [
          { rating: "desc" },
          { totalReviews: "desc" },
        ],
        take: 10,
        select: { id: true },
      })

      return topDrivers.some((d) => d.id === driverId)
    },
  },
  {
    type: BadgeType.TOP_3_REGION,
    condition: async (driverId, stats) => {
      if (!stats.region) return false

      const topDrivers = await db.driverProfile.findMany({
        where: {
          region: stats.region,
          totalReviews: { gte: 10 }, // Au moins 10 avis pour être dans le top 3
        },
        orderBy: [
          { rating: "desc" },
          { totalReviews: "desc" },
        ],
        take: 3,
        select: { id: true },
      })

      return topDrivers.some((d) => d.id === driverId)
    },
  },
  {
    type: BadgeType.FIRST_100_DELIVERIES,
    condition: async (driverId, stats) => {
      return stats.totalDeliveries >= 100
    },
  },
  {
    type: BadgeType.FIRST_500_DELIVERIES,
    condition: async (driverId, stats) => {
      return stats.totalDeliveries >= 500
    },
  },
  {
    type: BadgeType.PERFECT_RATING,
    condition: async (driverId, stats) => {
      return stats.rating === 5.0 && stats.totalReviews >= 20
    },
  },
  {
    type: BadgeType.RISING_STAR,
    condition: async (driverId, stats) => {
      // Nouveau chauffeur avec déjà une bonne note
      return (
        stats.totalReviews >= 5 &&
        stats.totalReviews <= 15 &&
        stats.rating >= 4.5
      )
    },
  },
]

/**
 * Calcule et attribue les badges pour un chauffeur
 * @param driverId ID du chauffeur
 */
export async function updateDriverBadges(driverId: string): Promise<void> {
  // Récupérer les stats du chauffeur
  const driver = await db.driverProfile.findUnique({
    where: { id: driverId },
    include: {
      tagStats: true,
      badges: true,
    },
  })

  if (!driver) return

  const stats = {
    tagStats: driver.tagStats,
    totalDeliveries: driver.totalDeliveries,
    rating: driver.rating,
    totalReviews: driver.totalReviews,
    region: driver.region,
  }

  // Vérifier chaque règle de badge
  for (const rule of BADGE_RULES) {
    const shouldHaveBadge = await rule.condition(driverId, stats)
    const hasBadge = driver.badges.some((b) => b.badge === rule.type)

    if (shouldHaveBadge && !hasBadge) {
      // Attribuer le badge
      await db.driverBadge.create({
        data: {
          driverId,
          badge: rule.type,
        },
      })
    } else if (!shouldHaveBadge && hasBadge) {
      // Retirer le badge si les conditions ne sont plus remplies
      await db.driverBadge.deleteMany({
        where: {
          driverId,
          badge: rule.type,
        },
      })
    }
  }
}

/**
 * Met à jour les statistiques de tags pour un chauffeur
 * @param driverId ID du chauffeur
 * @param tags Tags à incrémenter
 */
export async function updateDriverTagStats(
  driverId: string,
  tags: FeedbackTag[]
): Promise<void> {
  // Incrémenter le count pour chaque tag
  for (const tag of tags) {
    await db.driverTagStats.upsert({
      where: {
        driverId_tag: {
          driverId,
          tag,
        },
      },
      create: {
        driverId,
        tag,
        count: 1,
        percentage: 0, // Sera recalculé
      },
      update: {
        count: { increment: 1 },
      },
    })
  }

  // Recalculer les pourcentages
  const totalFeedbacks = await db.driverFeedback.count({
    where: { driverId },
  })

  if (totalFeedbacks > 0) {
    const allTagStats = await db.driverTagStats.findMany({
      where: { driverId },
    })

    for (const tagStat of allTagStats) {
      await db.driverTagStats.update({
        where: { id: tagStat.id },
        data: {
          percentage: (tagStat.count / totalFeedbacks) * 100,
        },
      })
    }
  }
}

/**
 * Récupère le classement d'un chauffeur dans sa région
 * @param driverId ID du chauffeur
 * @returns Position dans le classement (1-indexed) ou null
 */
export async function getDriverRegionalRank(
  driverId: string
): Promise<number | null> {
  const driver = await db.driverProfile.findUnique({
    where: { id: driverId },
    select: { region: true, rating: true, totalReviews: true },
  })

  if (!driver?.region) return null

  const driversAbove = await db.driverProfile.count({
    where: {
      region: driver.region,
      totalReviews: { gte: 5 },
      OR: [
        { rating: { gt: driver.rating } },
        {
          AND: [
            { rating: driver.rating },
            { totalReviews: { gt: driver.totalReviews } },
          ],
        },
      ],
    },
  })

  return driversAbove + 1
}
