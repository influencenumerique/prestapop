import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

// GET: Get all active drivers (IN_PROGRESS bookings) for the company
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    }

    // Get user's company
    const company = await db.company.findUnique({
      where: { userId: session.user.id },
    })

    if (!company) {
      return NextResponse.json(
        { error: "Vous devez etre une entreprise" },
        { status: 403 }
      )
    }

    // Get all IN_PROGRESS bookings for this company's jobs
    const activeBookings = await db.booking.findMany({
      where: {
        status: "IN_PROGRESS",
        job: {
          companyId: company.id,
        },
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            secteurLivraison: true,
            startTime: true,
            estimatedEndTime: true,
          },
        },
        driver: {
          include: {
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
        locationUpdates: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    })

    // Format response with latest location for each driver
    const activeDrivers = activeBookings.map((booking) => {
      const latestLocation = booking.locationUpdates[0] || null

      return {
        bookingId: booking.id,
        job: {
          id: booking.job.id,
          title: booking.job.title,
          secteurLivraison: booking.job.secteurLivraison,
          startTime: booking.job.startTime,
          estimatedEndTime: booking.job.estimatedEndTime,
        },
        driver: {
          id: booking.driver.id,
          name: booking.driver.user.name,
          image: booking.driver.user.image,
          phone: booking.driver.phone,
        },
        location: latestLocation
          ? {
              latitude: latestLocation.latitude,
              longitude: latestLocation.longitude,
              accuracy: latestLocation.accuracy,
              speed: latestLocation.speed,
              heading: latestLocation.heading,
              timestamp: latestLocation.timestamp.toISOString(),
            }
          : null,
        pickedUpAt: booking.pickedUpAt?.toISOString() || null,
      }
    })

    return NextResponse.json({
      count: activeDrivers.length,
      drivers: activeDrivers,
    })
  } catch (error) {
    console.error("Error fetching active drivers:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
