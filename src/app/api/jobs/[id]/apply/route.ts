import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { requireRole } from "@/lib/api-auth"

const applySchema = z.object({
  proposedPrice: z.number().optional(),
  message: z.string().optional(),
})

// POST /api/jobs/[id]/apply - Postuler à une mission (Role.DRIVER only)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Vérifier que l'utilisateur est un chauffeur (Role.DRIVER)
    const authResult = await requireRole("DRIVER")
    if ("error" in authResult) {
      return authResult.error
    }

    const { user } = authResult

    // Vérifier que l'utilisateur a bien un profil Driver
    if (!user.driverProfile) {
      return NextResponse.json(
        { error: "Profil chauffeur non trouvé. Veuillez compléter votre profil." },
        { status: 400 }
      )
    }

    const driver = user.driverProfile

    if (!driver.isAvailable) {
      return NextResponse.json(
        { error: "Vous n'êtes pas disponible actuellement" },
        { status: 400 }
      )
    }

    const job = await db.job.findUnique({
      where: { id },
    })

    if (!job) {
      return NextResponse.json({ error: "Mission non trouvée" }, { status: 404 })
    }

    if (job.status !== "OPEN") {
      return NextResponse.json(
        { error: "Cette mission n'est plus disponible" },
        { status: 400 }
      )
    }

    // Note: La validation du véhicule peut être faite côté DriverProfile
    // si on ajoute un champ vehicleVolumes au modèle DriverProfile
    // Pour l'instant, on laisse le chauffeur candidater librement

    // Vérifier si déjà postulé
    const existingBooking = await db.booking.findUnique({
      where: { jobId_driverId: { jobId: id, driverId: driver.id } },
    })

    if (existingBooking) {
      return NextResponse.json(
        { error: "Vous avez déjà postulé à cette mission" },
        { status: 400 }
      )
    }

    const body = await req.json()
    const data = applySchema.parse(body)

    const booking = await db.booking.create({
      data: {
        jobId: id,
        driverId: driver.id,
        agreedPrice: data.proposedPrice || job.dayRate,
        driverNotes: data.message,
        status: "PENDING", // En attente de paiement par la company
        stripePaymentStatus: "pending_company_payment", // Statut interne: en attente du paiement
      },
      include: {
        job: true,
        driver: { include: { user: true } },
      },
    })

    return NextResponse.json(booking)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error applying to job:", error)
    return NextResponse.json(
      { error: "Erreur lors de la candidature" },
      { status: 500 }
    )
  }
}
