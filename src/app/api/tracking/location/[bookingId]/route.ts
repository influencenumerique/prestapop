import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

// GET: Get latest location for a booking
export async function GET(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    }

    const { bookingId } = await params

    // Fetch booking with latest location
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        job: {
          include: {
            company: true,
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

    if (!booking) {
      return NextResponse.json(
        { error: "Reservation introuvable" },
        { status: 404 }
      )
    }

    // Check authorization: user must be either the driver or the company owner
    const isDriver = await db.driverProfile.findFirst({
      where: {
        userId: session.user.id,
        id: booking.driverId,
      },
    })

    const isCompanyOwner = await db.company.findFirst({
      where: {
        userId: session.user.id,
        id: booking.job.companyId,
      },
    })

    if (!isDriver && !isCompanyOwner) {
      return NextResponse.json(
        { error: "Acces non autorise" },
        { status: 403 }
      )
    }

    const latestLocation = booking.locationUpdates[0] || null

    return NextResponse.json({
      booking: {
        id: booking.id,
        status: booking.status,
        pickupLatitude: booking.pickupLatitude,
        pickupLongitude: booking.pickupLongitude,
        deliveryLatitude: booking.deliveryLatitude,
        deliveryLongitude: booking.deliveryLongitude,
      },
      job: {
        id: booking.job.id,
        title: booking.job.title,
        secteurLivraison: booking.job.secteurLivraison,
      },
      driver: {
        id: booking.driver.id,
        name: booking.driver.user.name,
        image: booking.driver.user.image,
        phone: booking.driver.phone,
      },
      latestLocation: latestLocation
        ? {
            latitude: latestLocation.latitude,
            longitude: latestLocation.longitude,
            accuracy: latestLocation.accuracy,
            speed: latestLocation.speed,
            heading: latestLocation.heading,
            timestamp: latestLocation.timestamp.toISOString(),
          }
        : null,
      isTracking: booking.status === "IN_PROGRESS",
    })
  } catch (error) {
    console.error("Error fetching location:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

// GET history: Get all location updates for route visualization
export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    }

    const { bookingId } = await params

    // Fetch booking
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        job: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Reservation introuvable" },
        { status: 404 }
      )
    }

    // Check authorization
    const isDriver = await db.driverProfile.findFirst({
      where: {
        userId: session.user.id,
        id: booking.driverId,
      },
    })

    const isCompanyOwner = await db.company.findFirst({
      where: {
        userId: session.user.id,
        id: booking.job.companyId,
      },
    })

    if (!isDriver && !isCompanyOwner) {
      return NextResponse.json(
        { error: "Acces non autorise" },
        { status: 403 }
      )
    }

    // Get all location updates for route visualization
    const locationHistory = await db.locationUpdate.findMany({
      where: { bookingId },
      orderBy: { timestamp: "asc" },
      select: {
        latitude: true,
        longitude: true,
        timestamp: true,
        speed: true,
      },
    })

    return NextResponse.json({
      bookingId,
      locationHistory: locationHistory.map((loc) => ({
        lat: loc.latitude,
        lng: loc.longitude,
        timestamp: loc.timestamp.toISOString(),
        speed: loc.speed,
      })),
    })
  } catch (error) {
    console.error("Error fetching location history:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
