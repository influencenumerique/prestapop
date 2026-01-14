import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { requireAuth, requireRole } from "@/lib/api-auth"
import { checkMissionLimit, incrementMissionUsage } from "@/lib/subscription-limits"

const createJobSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().optional(),

  // Type et secteur de mission
  typeMission: z.enum(["DAY", "HALF_DAY", "WEEK"]).default("DAY"),
  missionZoneType: z.enum(["URBAN", "CITY_TO_CITY"]).default("URBAN"),
  secteurLivraison: z.string().min(2), // Ex: "Paris 11e, 12e, 20e"

  // Détails colis
  packageSize: z.enum(["SMALL", "MEDIUM", "LARGE", "MIXED"]).default("MIXED"),
  nombreColis: z.number().int().min(1), // Nombre de colis à livrer

  // Timing
  startTime: z.string().transform((s) => new Date(s)), // Heure de début de mission
  estimatedEndTime: z.string().transform((s) => new Date(s)), // Heure de fin estimée

  // Véhicule requis
  vehicleVolume: z.enum(["CUBE_6M", "CUBE_9M", "CUBE_12M", "CUBE_15M", "CUBE_20M"]),
  needsTailLift: z.boolean().default(false), // Hayon élévateur requis

  // Rémunération
  dayRate: z.number().int().min(1000), // Tarif journée en centimes (minimum 10€)
})

// GET /api/jobs - Liste des missions ouvertes
// Accessible aux DRIVER et COMPANY authentifiés
export async function GET(req: Request) {
  try {
    // Vérifier l'authentification (obligatoire pour voir les missions)
    const authResult = await requireAuth()
    if ("error" in authResult) {
      return authResult.error
    }

    const { user: _user } = authResult

    const { searchParams } = new URL(req.url)
    const secteur = searchParams.get("secteur")
    const missionZoneType = searchParams.get("missionZoneType")
    const vehicleVolume = searchParams.get("vehicleVolume")
    const typeMission = searchParams.get("typeMission")
    const needsTailLift = searchParams.get("needsTailLift")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const where: any = { status: "OPEN" }

    // Si c'est une COMPANY, elle peut voir toutes les missions (même les siennes)
    // Si c'est un DRIVER, il voit seulement les missions ouvertes

    // Filtre par secteur de livraison
    if (secteur) {
      where.secteurLivraison = { contains: secteur, mode: "insensitive" }
    }

    // Filtre par type de zone de mission (URBAN ou CITY_TO_CITY)
    if (missionZoneType && ["URBAN", "CITY_TO_CITY"].includes(missionZoneType)) {
      where.missionZoneType = missionZoneType
    }

    // Filtre par volume de véhicule
    if (vehicleVolume && ["CUBE_6M", "CUBE_9M", "CUBE_12M", "CUBE_15M", "CUBE_20M"].includes(vehicleVolume)) {
      where.vehicleVolume = vehicleVolume
    }

    // Filtre par type de mission (DAY, HALF_DAY, WEEK)
    if (typeMission && ["DAY", "HALF_DAY", "WEEK"].includes(typeMission)) {
      where.typeMission = typeMission
    }

    // Filtre pour hayon élévateur
    if (needsTailLift === "true") {
      where.needsTailLift = true
    }

    const [jobs, total] = await Promise.all([
      db.job.findMany({
        where,
        include: {
          company: { include: { user: true } },
          _count: { select: { bookings: true } },
        },
        orderBy: [{ startTime: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.job.count({ where }),
    ])

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching jobs:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des missions" },
      { status: 500 }
    )
  }
}

// POST /api/jobs - Créer une mission (Role.COMPANY only)
export async function POST(req: Request) {
  try {
    // Vérifier que l'utilisateur est une entreprise (Role.COMPANY)
    const authResult = await requireRole("COMPANY")
    if ("error" in authResult) {
      return authResult.error
    }

    const { user } = authResult

    // Vérifier que l'utilisateur a bien un profil Company
    if (!user.company) {
      return NextResponse.json(
        { error: "Profil entreprise non trouvé. Veuillez compléter votre profil." },
        { status: 400 }
      )
    }

    // Vérifier la limite de missions selon l'abonnement
    const limitCheck = await checkMissionLimit(user.id)
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
    const data = createJobSchema.parse(body)

    const job = await db.job.create({
      data: {
        ...data,
        companyId: user.company.id,
        status: "OPEN",
      },
      include: {
        company: { include: { user: true } },
      },
    })

    // Incrémenter le compteur d'usage si l'utilisateur a un abonnement
    await incrementMissionUsage(user.id)

    return NextResponse.json(job)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error creating job:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de la mission" },
      { status: 500 }
    )
  }
}
