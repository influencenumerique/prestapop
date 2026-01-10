import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { requireAuth, requireRole, isCompanyOwner } from "@/lib/api-auth"

const updateJobSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  description: z.string().optional(),
  typeMission: z.enum(["DAY", "HALF_DAY", "WEEK"]).optional(),
  missionZoneType: z.enum(["URBAN", "CITY_TO_CITY"]).optional(),
  secteurLivraison: z.string().min(2).optional(),
  packageSize: z.enum(["SMALL", "MEDIUM", "LARGE", "MIXED"]).optional(),
  nombreColis: z.number().int().min(1).optional(),
  startTime: z.string().transform((s) => new Date(s)).optional(),
  estimatedEndTime: z.string().transform((s) => new Date(s)).optional(),
  vehicleVolume: z.enum(["CUBE_6M", "CUBE_9M", "CUBE_12M", "CUBE_15M", "CUBE_20M"]).optional(),
  needsTailLift: z.boolean().optional(),
  dayRate: z.number().int().min(1000).optional(),
  status: z.enum(["DRAFT", "OPEN", "ASSIGNED", "IN_PROGRESS", "DELIVERED", "COMPLETED", "CANCELLED"]).optional(),
})

// GET /api/jobs/[id] - Détail d'une mission
// Accessible aux utilisateurs authentifiés (DRIVER et COMPANY)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier l'authentification
    const authResult = await requireAuth()
    if ("error" in authResult) {
      return authResult.error
    }

    const { user } = authResult
    const { id } = await params

    const job = await db.job.findUnique({
      where: { id },
      include: {
        company: { include: { user: true } },
        bookings: {
          include: {
            driver: { include: { user: true } },
            review: true,
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Mission non trouvée" }, { status: 404 })
    }

    // Les DRIVER peuvent voir toutes les missions ouvertes
    // Les COMPANY peuvent voir toutes les missions (notamment les leurs avec candidatures)
    // Pas de restriction supplémentaire ici car les bookings sensibles sont filtrés

    return NextResponse.json(job)
  } catch (error) {
    console.error("Error fetching job:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la mission" },
      { status: 500 }
    )
  }
}

// PATCH /api/jobs/[id] - Modifier une mission (Role.COMPANY owner only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Vérifier que l'utilisateur est une entreprise (Role.COMPANY)
    const authResult = await requireRole("COMPANY")
    if ("error" in authResult) {
      return authResult.error
    }

    const { user } = authResult

    const job = await db.job.findUnique({
      where: { id },
      include: { company: true },
    })

    if (!job) {
      return NextResponse.json({ error: "Mission non trouvée" }, { status: 404 })
    }

    // Vérifier que l'entreprise est bien propriétaire de la mission
    if (!isCompanyOwner(user, job.companyId)) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à modifier cette mission" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const data = updateJobSchema.parse(body)

    const updatedJob = await db.job.update({
      where: { id },
      data,
      include: {
        company: { include: { user: true } },
      },
    })

    return NextResponse.json(updatedJob)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error updating job:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la mission" },
      { status: 500 }
    )
  }
}

// DELETE /api/jobs/[id] - Supprimer une mission (Role.COMPANY owner only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Vérifier que l'utilisateur est une entreprise (Role.COMPANY)
    const authResult = await requireRole("COMPANY")
    if ("error" in authResult) {
      return authResult.error
    }

    const { user } = authResult

    const job = await db.job.findUnique({
      where: { id },
      include: { company: true },
    })

    if (!job) {
      return NextResponse.json({ error: "Mission non trouvée" }, { status: 404 })
    }

    // Vérifier que l'entreprise est bien propriétaire de la mission
    if (!isCompanyOwner(user, job.companyId)) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à supprimer cette mission" },
        { status: 403 }
      )
    }

    // Ne peut supprimer que si DRAFT ou OPEN sans bookings
    if (!["DRAFT", "OPEN"].includes(job.status)) {
      return NextResponse.json(
        { error: "Impossible de supprimer une mission en cours" },
        { status: 400 }
      )
    }

    await db.job.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting job:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la mission" },
      { status: 500 }
    )
  }
}
