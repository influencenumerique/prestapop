import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const applicationSchema = z.object({
  jobId: z.string(),
})

/**
 * POST /api/applications
 * Permet a un chauffeur de postuler a une mission
 */
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    }

    const body = await req.json()
    const { jobId } = applicationSchema.parse(body)

    // Get driver profile
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { driverProfile: true },
    })

    if (!user?.driverProfile) {
      return NextResponse.json(
        { error: "Vous devez etre chauffeur pour postuler" },
        { status: 403 }
      )
    }

    const driverId = user.driverProfile.id

    // Check if job exists and is open
    const job = await db.job.findUnique({
      where: { id: jobId },
      include: {
        bookings: {
          where: { driverId },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Mission non trouvee" }, { status: 404 })
    }

    if (job.status !== "OPEN") {
      return NextResponse.json(
        { error: "Cette mission n'est plus disponible" },
        { status: 400 }
      )
    }

    // Check if driver has already applied
    if (job.bookings.length > 0) {
      return NextResponse.json(
        { error: "Vous avez deja postule a cette mission" },
        { status: 400 }
      )
    }

    // Check if driver has an overlapping active mission
    const existingBookings = await db.booking.findMany({
      where: {
        driverId,
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
      },
      include: { job: true },
    })

    for (const booking of existingBookings) {
      const existingStart = new Date(booking.job.startTime)
      const existingEnd = new Date(booking.job.estimatedEndTime)
      const newStart = new Date(job.startTime)
      const newEnd = new Date(job.estimatedEndTime)

      // Check for date overlap
      if (newStart <= existingEnd && newEnd >= existingStart) {
        return NextResponse.json(
          {
            error: "Vous avez deja une mission sur cette periode",
            conflictingJob: {
              title: booking.job.title,
              date: existingStart.toLocaleDateString("fr-FR"),
            },
          },
          { status: 400 }
        )
      }
    }

    // Create the booking/application
    const booking = await db.booking.create({
      data: {
        jobId,
        driverId,
        status: "PENDING",
        agreedPrice: job.dayRate,
      },
    })

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      message: "Candidature envoyee avec succes",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Donnees invalides", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error creating application:", error)
    return NextResponse.json(
      { error: "Erreur lors de la candidature" },
      { status: 500 }
    )
  }
}
