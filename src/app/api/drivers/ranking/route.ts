import { NextResponse } from "next/server"
import { db } from "@/lib/db"

/**
 * GET /api/drivers/ranking?region=Paris
 * Retourne le classement des chauffeurs par région
 * - Top 10 avec nom, note, nombre de livraisons
 * - Filtrable par région
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const region = searchParams.get("region")
    const limit = parseInt(searchParams.get("limit") || "10")

    if (!region) {
      return NextResponse.json(
        { error: "Le paramètre 'region' est requis" },
        { status: 400 }
      )
    }

    // Récupérer les meilleurs chauffeurs de la région
    const topDrivers = await db.driverProfile.findMany({
      where: {
        region,
        totalReviews: { gte: 5 }, // Au moins 5 avis pour être classé
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        badges: {
          select: {
            badge: true,
          },
        },
        tagStats: {
          orderBy: {
            count: "desc",
          },
          take: 3, // Top 3 tags
        },
      },
      orderBy: [
        { rating: "desc" },
        { totalReviews: "desc" },
        { totalDeliveries: "desc" },
      ],
      take: limit,
    })

    // Formater la réponse
    const ranking = topDrivers.map((driver, index) => ({
      rank: index + 1,
      driver: {
        id: driver.id,
        name: driver.user.name,
        image: driver.user.image,
        city: driver.city,
        isVerified: driver.isVerified,
      },
      performance: {
        rating: parseFloat(driver.rating.toFixed(2)),
        totalReviews: driver.totalReviews,
        totalDeliveries: driver.totalDeliveries,
      },
      badges: driver.badges.map((b) => b.badge),
      topTags: driver.tagStats.map((ts) => ({
        tag: ts.tag,
        count: ts.count,
      })),
    }))

    return NextResponse.json({
      region,
      totalDrivers: ranking.length,
      ranking,
    })
  } catch (error) {
    console.error("Error fetching driver ranking:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du classement" },
      { status: 500 }
    )
  }
}
