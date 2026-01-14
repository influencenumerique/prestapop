import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, isCompanyOwner } from "@/lib/api-auth"

/**
 * PATCH /api/bookings/[id]/accept
 *
 * L'entreprise accepte la candidature d'un chauffeur
 * Le status du booking passe à ASSIGNED et celui du job aussi
 * Les autres candidatures sont automatiquement rejetées
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify authentication
    const authResult = await requireAuth()
    if ("error" in authResult) {
      return authResult.error
    }

    const { user } = authResult

    // Fetch booking with related data
    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            company: true,
          },
        },
        driver: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 }
      )
    }

    // Verify user is the company owner
    if (!isCompanyOwner(user, booking.job.companyId)) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à accepter cette candidature" },
        { status: 403 }
      )
    }

    // Check booking status - must be PENDING (candidature)
    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cette candidature a déjà été traitée" },
        { status: 400 }
      )
    }

    // Check job status
    if (booking.job.status !== "OPEN") {
      return NextResponse.json(
        { error: "Cette mission n'est plus disponible" },
        { status: 400 }
      )
    }

    // Transaction: update booking to ASSIGNED and reject other candidates
    await db.$transaction([
      // Accept this candidate
      db.booking.update({
        where: { id },
        data: {
          status: "ASSIGNED",
        },
      }),
      // Update job status to ASSIGNED
      db.job.update({
        where: { id: booking.jobId },
        data: {
          status: "ASSIGNED",
        },
      }),
      // Reject all other pending candidates (set to CANCELLED)
      db.booking.updateMany({
        where: {
          jobId: booking.jobId,
          id: { not: id },
          status: "PENDING",
        },
        data: {
          status: "CANCELLED",
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: "Candidature acceptée avec succès",
      booking: {
        id: booking.id,
        status: "ASSIGNED",
        driver: {
          name: booking.driver.user.name,
          email: booking.driver.user.email,
        },
      },
    })
  } catch (error: any) {
    console.error("Error accepting candidate:", error)

    return NextResponse.json(
      { error: "Erreur lors de l'acceptation de la candidature" },
      { status: 500 }
    )
  }
}
