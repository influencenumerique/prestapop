import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/**
 * GET /api/drivers/me
 * Retourne le profil chauffeur de l'utilisateur connecte avec ses missions en cours
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        driverProfile: {
          include: {
            bookings: {
              where: {
                status: { in: ["ASSIGNED", "IN_PROGRESS"] },
              },
              include: {
                job: {
                  select: {
                    id: true,
                    title: true,
                    startTime: true,
                    estimatedEndTime: true,
                    secteurLivraison: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    })

    if (!user?.driverProfile) {
      return NextResponse.json(
        { error: "Profil chauffeur non trouve" },
        { status: 404 }
      )
    }

    const activeBookings = user.driverProfile.bookings
    const currentJob = activeBookings.length > 0 ? activeBookings[0].job : null

    return NextResponse.json({
      id: user.driverProfile.id,
      userId: user.id,
      name: user.name,
      city: user.driverProfile.city,
      rating: user.driverProfile.rating,
      totalDeliveries: user.driverProfile.totalDeliveries,
      currentJob,
      activeBookings: activeBookings.map((b) => ({
        id: b.id,
        status: b.status,
        job: b.job,
      })),
      hasActiveMission: activeBookings.length > 0,
    })
  } catch (error) {
    console.error("Error fetching driver profile:", error)
    return NextResponse.json(
      { error: "Erreur lors de la recuperation du profil" },
      { status: 500 }
    )
  }
}
