import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { z } from "zod"
import Pusher from "pusher"

// Pusher server instance
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

const locationSchema = z.object({
  bookingId: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().optional(),
})

// Rate limiting: store last update times per booking
const lastUpdateTimes = new Map<string, number>()
const MIN_UPDATE_INTERVAL = 10000 // 10 seconds

// POST: Driver sends GPS location update
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    }

    // Verify user is a driver
    const driver = await db.driverProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!driver) {
      return NextResponse.json(
        { error: "Seuls les chauffeurs peuvent envoyer leur position" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validation = locationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: validation.error.errors },
        { status: 400 }
      )
    }

    const { bookingId, latitude, longitude, accuracy, speed, heading } = validation.data

    // Rate limiting check
    const lastUpdate = lastUpdateTimes.get(bookingId)
    if (lastUpdate && Date.now() - lastUpdate < MIN_UPDATE_INTERVAL) {
      return NextResponse.json(
        { error: "Trop de requetes. Attendez quelques secondes." },
        { status: 429 }
      )
    }

    // Verify booking exists, belongs to driver, and is IN_PROGRESS
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        job: {
          include: {
            company: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Reservation introuvable" },
        { status: 404 }
      )
    }

    if (booking.driverId !== driver.id) {
      return NextResponse.json(
        { error: "Cette reservation ne vous appartient pas" },
        { status: 403 }
      )
    }

    if (booking.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Le tracking est actif uniquement pour les missions en cours" },
        { status: 400 }
      )
    }

    // Create location update in database
    const locationUpdate = await db.locationUpdate.create({
      data: {
        bookingId,
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
      },
    })

    // Update rate limiting
    lastUpdateTimes.set(bookingId, Date.now())

    // Trigger Pusher event for real-time update
    await pusher.trigger(`booking-${bookingId}`, "location-update", {
      latitude,
      longitude,
      accuracy,
      speed,
      heading,
      timestamp: locationUpdate.timestamp.toISOString(),
      driverId: driver.id,
    })

    return NextResponse.json({
      success: true,
      locationUpdate: {
        id: locationUpdate.id,
        timestamp: locationUpdate.timestamp,
      },
    })
  } catch (error) {
    console.error("Error updating location:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
