import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { z } from "zod"

// Devenir chauffeur
const driverSchema = z.object({
  phone: z.string().min(10),
  bio: z.string().optional(),
  city: z.string().min(2),
  vehicleTypes: z.array(z.enum(["BIKE", "SCOOTER", "CAR", "VAN", "TRUCK"])).min(1),
  licenseNumber: z.string().optional(),
  insuranceNumber: z.string().optional(),
})

// Créer une entreprise
const companySchema = z.object({
  companyName: z.string().min(2),
  siret: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  description: z.string().optional(),
})

// POST /api/users/become-freelancer - Devenir chauffeur OU créer entreprise
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await req.json()
    const { type, ...data } = body

    if (type === "driver") {
      // Vérifier si déjà chauffeur
      const existing = await db.driverProfile.findUnique({
        where: { userId: session.user.id },
      })

      if (existing) {
        return NextResponse.json(
          { error: "Vous êtes déjà chauffeur" },
          { status: 400 }
        )
      }

      const driverData = driverSchema.parse(data)

      const [profile] = await db.$transaction([
        db.driverProfile.create({
          data: {
            userId: session.user.id!,
            ...driverData,
          },
        }),
        db.user.update({
          where: { id: session.user.id },
          data: { role: "DRIVER" },
        }),
      ])

      return NextResponse.json(profile)
    } else if (type === "company") {
      // Vérifier si déjà entreprise
      const existing = await db.company.findUnique({
        where: { userId: session.user.id },
      })

      if (existing) {
        return NextResponse.json(
          { error: "Vous avez déjà une entreprise" },
          { status: 400 }
        )
      }

      const companyData = companySchema.parse(data)

      const [company] = await db.$transaction([
        db.company.create({
          data: {
            userId: session.user.id!,
            ...companyData,
          },
        }),
        db.user.update({
          where: { id: session.user.id },
          data: { role: "COMPANY" },
        }),
      ])

      return NextResponse.json(company)
    } else {
      return NextResponse.json(
        { error: "Type invalide. Utilisez 'driver' ou 'company'" },
        { status: 400 }
      )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error creating profile:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du profil" },
      { status: 500 }
    )
  }
}
