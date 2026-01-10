import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const body = await req.json()
    const {
      companyName,
      siret,
      phone,
      address,
      city,
      description,
      acceptedTerms,
      acceptedValidationDelay,
    } = body

    // Validation
    if (!companyName || !siret || !phone || !city || !address) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 }
      )
    }

    if (!acceptedTerms || !acceptedValidationDelay) {
      return NextResponse.json(
        { error: "Vous devez accepter toutes les conditions" },
        { status: 400 }
      )
    }

    // Validate SIRET format (14 digits)
    const siretClean = siret.replace(/\s/g, "")
    if (!/^\d{14}$/.test(siretClean)) {
      return NextResponse.json(
        { error: "Format SIRET invalide (14 chiffres requis)" },
        { status: 400 }
      )
    }

    // Check if company profile already exists
    const existingCompany = await db.company.findUnique({
      where: { userId: session.user.id },
    })

    if (existingCompany) {
      return NextResponse.json(
        { error: "Profil entreprise déjà existant" },
        { status: 400 }
      )
    }

    // Update user role
    await db.user.update({
      where: { id: session.user.id },
      data: { role: "COMPANY" },
    })

    // Create company profile
    const company = await db.company.create({
      data: {
        userId: session.user.id,
        companyName,
        siret: siretClean,
        phone,
        address,
        city,
        description: description || null,
      },
    })

    return NextResponse.json(
      { success: true, company },
      { status: 201 }
    )
  } catch (error) {
    console.error("Company onboarding error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du profil" },
      { status: 500 }
    )
  }
}
