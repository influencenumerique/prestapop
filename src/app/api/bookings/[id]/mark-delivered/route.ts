import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { requireAuth, isDriver } from "@/lib/api-auth"

const markDeliveredSchema = z.object({
  proofOfDelivery: z.string().optional(), // URL photo/signature
  driverNotes: z.string().optional(),
})

/**
 * POST /api/bookings/[id]/mark-delivered
 *
 * Le chauffeur marque la mission comme livrée (DELIVERED)
 *
 * Workflow:
 * 1. Chauffeur termine la livraison
 * 2. Appelle cet endpoint pour marquer DELIVERED + deliveredAt
 * 3. L'entreprise doit ensuite valider pour déclencher le payout
 *
 * Accessible uniquement par le Driver assigné à la mission
 */
export async function POST(
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

    // Verify user is the assigned driver
    if (!isDriver(user, booking.driverId)) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à modifier cette mission" },
        { status: 403 }
      )
    }

    // Check booking status - must be ASSIGNED or IN_PROGRESS
    if (!["ASSIGNED", "IN_PROGRESS"].includes(booking.status)) {
      return NextResponse.json(
        { error: `Impossible de marquer comme livré. Statut actuel: ${booking.status}` },
        { status: 400 }
      )
    }

    // Check if payment was made by company
    if (booking.stripePaymentStatus !== "payment_paid") {
      return NextResponse.json(
        { error: "La mission doit être payée avant de pouvoir être livrée" },
        { status: 400 }
      )
    }

    const body = await req.json()
    const data = markDeliveredSchema.parse(body)

    // Update booking to DELIVERED
    const updatedBooking = await db.booking.update({
      where: { id },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(),
        proofOfDelivery: data.proofOfDelivery,
        driverNotes: data.driverNotes || booking.driverNotes,
      },
      include: {
        job: { include: { company: { include: { user: true } } } },
        driver: { include: { user: true } },
      },
    })

    // Update job status to DELIVERED
    await db.job.update({
      where: { id: booking.jobId },
      data: { status: "DELIVERED" },
    })

    console.log(
      `[Mark Delivered] Booking ${id} marked as delivered by driver ${booking.driverId}`
    )

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: "Mission marquée comme livrée. En attente de validation par l'entreprise.",
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error marking delivered:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la mission" },
      { status: 500 }
    )
  }
}
