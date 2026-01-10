import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getDriverRegionalRank } from "@/lib/utils/badges"

/**
 * GET /api/drivers/[id]/stats
 * Retourne les statistiques complètes d'un chauffeur :
 * - Note moyenne
 * - Nombre d'avis
 * - Tags avec pourcentages (top 5)
 * - Badges obtenus
 * - Position dans le classement régional
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: driverId } = await params

    // Récupérer le profil du chauffeur avec toutes les relations
    const driver = await db.driverProfile.findUnique({
      where: { id: driverId },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        tagStats: {
          orderBy: {
            count: "desc",
          },
          take: 5, // Top 5 tags
        },
        badges: {
          orderBy: {
            earnedAt: "desc",
          },
        },
        feedbacks: {
          select: {
            rating: true,
            tags: true,
            comment: true,
            createdAt: true,
            company: {
              select: {
                companyName: true,
                logo: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10, // 10 derniers feedbacks
        },
      },
    })

    if (!driver) {
      return NextResponse.json(
        { error: "Chauffeur non trouvé" },
        { status: 404 }
      )
    }

    // Récupérer le classement régional
    const regionalRank = await getDriverRegionalRank(driverId)

    // Calculer les statistiques globales
    const totalFeedbacks = await db.driverFeedback.count({
      where: { driverId },
    })

    // Formater les tags avec pourcentages
    const topTags = driver.tagStats.map((tagStat) => ({
      tag: tagStat.tag,
      count: tagStat.count,
      percentage: parseFloat(tagStat.percentage.toFixed(1)),
    }))

    // Formater les badges
    const badges = driver.badges.map((badge) => ({
      type: badge.badge,
      earnedAt: badge.earnedAt,
    }))

    // Formater les feedbacks récents
    const recentFeedbacks = driver.feedbacks.map((feedback) => ({
      rating: feedback.rating,
      tags: feedback.tags,
      comment: feedback.comment,
      createdAt: feedback.createdAt,
      company: feedback.company,
    }))

    // Construire la réponse
    const stats = {
      driver: {
        id: driver.id,
        name: driver.user.name,
        image: driver.user.image,
        city: driver.city,
        region: driver.region,
        bio: driver.bio,
        vehicleTypes: driver.vehicleTypes,
        isVerified: driver.isVerified,
      },
      performance: {
        rating: parseFloat(driver.rating.toFixed(2)),
        totalReviews: driver.totalReviews,
        totalDeliveries: driver.totalDeliveries,
        totalFeedbacks,
      },
      topTags,
      badges,
      ranking: {
        regionalRank,
        region: driver.region,
      },
      recentFeedbacks,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching driver stats:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    )
  }
}
