import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { requireAuth, isDriver, isCompanyOwner } from "@/lib/api-auth"

const updateBookingSchema = z.object({
  status: z.enum(["ASSIGNED", "IN_PROGRESS", "DELIVERED", "COMPLETED", "CANCELLED"]).optional(),
  pickedUpAt: z.string().transform((s) => new Date(s)).optional(),
  deliveredAt: z.string().transform((s) => new Date(s)).optional(),
  proofOfDelivery: z.string().optional(),
  driverNotes: z.string().optional(),
  companyNotes: z.string().optional(),
})

// GET /api/bookings/[id]
// Accessible au chauffeur concerné (Role.DRIVER) ou à la company propriétaire (Role.COMPANY)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Vérifier l'authentification
    const authResult = await requireAuth()
    if ("error" in authResult) {
      return authResult.error
    }

    const { user } = authResult

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        job: { include: { company: { include: { user: true } } } },
        driver: { include: { user: true } },
        review: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Mission non trouvée" }, { status: 404 })
    }

    // Vérifier autorisation (driver concerné ou company du job)
    const isAuthorizedDriver = isDriver(user, booking.driverId)
    const isAuthorizedCompany = isCompanyOwner(user, booking.job.companyId)

    if (!isAuthorizedDriver && !isAuthorizedCompany) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à consulter cette réservation" },
        { status: 403 }
      )
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error("Error fetching booking:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la mission" },
      { status: 500 }
    )
  }
}

// PATCH /api/bookings/[id] - Mettre à jour le statut/suivi
// Accessible au chauffeur concerné (Role.DRIVER) ou à la company propriétaire (Role.COMPANY)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Vérifier l'authentification
    const authResult = await requireAuth()
    if ("error" in authResult) {
      return authResult.error
    }

    const { user } = authResult

    const booking = await db.booking.findUnique({
      where: { id },
      include: { job: true, driver: true },
    })

    if (!booking) {
      return NextResponse.json({ error: "Mission non trouvée" }, { status: 404 })
    }

    // Vérifier autorisation (driver concerné ou company du job)
    const isAuthorizedDriver = isDriver(user, booking.driverId)
    const isAuthorizedCompany = isCompanyOwner(user, booking.job.companyId)

    if (!isAuthorizedDriver && !isAuthorizedCompany) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à modifier cette réservation" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const data = updateBookingSchema.parse(body)

    // Logique de transition de statut
    const updateData: any = { ...data }

    if (data.status === "IN_PROGRESS" && !booking.pickedUpAt) {
      updateData.pickedUpAt = new Date()
    }

    if (data.status === "DELIVERED" && !booking.deliveredAt) {
      updateData.deliveredAt = new Date()
    }

    // Mettre à jour aussi le statut du Job si nécessaire
    if (data.status) {
      await db.job.update({
        where: { id: booking.jobId },
        data: { status: data.status },
      })
    }

    const updatedBooking = await db.booking.update({
      where: { id },
      data: updateData,
      include: {
        job: { include: { company: { include: { user: true } } } },
        driver: { include: { user: true } },
      },
    })

    // Si livré, incrémenter le compteur du driver
    if (data.status === "COMPLETED") {
      await db.driverProfile.update({
        where: { id: booking.driverId },
        data: { totalDeliveries: { increment: 1 } },
      })
    }

    return NextResponse.json(updatedBooking)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error updating booking:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la mission" },
      { status: 500 }
    )
  }
}
