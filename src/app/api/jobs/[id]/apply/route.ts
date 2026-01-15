import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { requireRole } from "@/lib/api-auth"
import { checkApplicationLimit, incrementApplicationUsage } from "@/lib/subscription-limits"
import { VehicleVolume } from "@prisma/client"

const applySchema = z.object({
  proposedPrice: z.number().optional(),
  message: z.string().optional(),
})

// Ordre des volumes (du plus petit au plus grand)
const VOLUME_ORDER: VehicleVolume[] = ["CUBE_6M", "CUBE_9M", "CUBE_12M", "CUBE_15M", "CUBE_20M"]

const VOLUME_LABELS: Record<VehicleVolume, string> = {
  CUBE_6M: "6 m³",
  CUBE_9M: "9 m³",
  CUBE_12M: "12 m³",
  CUBE_15M: "15 m³",
  CUBE_20M: "20 m³",
}

// Vérifie si le volume du chauffeur est suffisant pour la mission
function isVehicleVolumeSufficient(driverVolume: VehicleVolume, jobVolume: VehicleVolume): boolean {
  const driverIndex = VOLUME_ORDER.indexOf(driverVolume)
  const jobIndex = VOLUME_ORDER.indexOf(jobVolume)
  return driverIndex >= jobIndex
}

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

    // Vérifier que le chauffeur a un volume de véhicule renseigné
    if (!driver.vehicleVolume) {
      return NextResponse.json(
        { error: "Veuillez renseigner le volume de votre véhicule dans votre profil pour postuler" },
        { status: 400 }
      )
    }

    // Vérifier que le volume du véhicule du chauffeur est suffisant
    if (!isVehicleVolumeSufficient(driver.vehicleVolume, job.vehicleVolume)) {
      return NextResponse.json(
        {
          error: `Votre véhicule (${VOLUME_LABELS[driver.vehicleVolume]}) est trop petit pour cette mission qui nécessite ${VOLUME_LABELS[job.vehicleVolume]}`,
          driverVolume: driver.vehicleVolume,
          requiredVolume: job.vehicleVolume,
        },
        { status: 400 }
      )
    }

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

    // Vérifier la limite de candidatures selon l'abonnement
    const limitCheck = await checkApplicationLimit(user.id)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: limitCheck.reason,
          upgradeUrl: limitCheck.upgradeUrl,
          remaining: limitCheck.remaining,
          limit: limitCheck.limit,
        },
        { status: 403 }
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

    // Incrémenter le compteur d'usage si l'utilisateur a un abonnement
    await incrementApplicationUsage(user.id)

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
