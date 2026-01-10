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
    const { phone, city, region, acceptedTerms, acceptedCommission, acceptedPaymentTerms } = body

    // Validation
    if (!phone || !city || !region) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      )
    }

    if (!acceptedTerms || !acceptedCommission || !acceptedPaymentTerms) {
      return NextResponse.json(
        { error: "Vous devez accepter toutes les conditions" },
        { status: 400 }
      )
    }

    // Check if driver profile already exists
    const existingProfile = await db.driverProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (existingProfile) {
      return NextResponse.json(
        { error: "Profil chauffeur déjà existant" },
        { status: 400 }
      )
    }

    // Update user role
    await db.user.update({
      where: { id: session.user.id },
      data: { role: "DRIVER" },
    })

    // Create driver profile
    const driverProfile = await db.driverProfile.create({
      data: {
        userId: session.user.id,
        phone,
        city,
        region,
      },
    })

    return NextResponse.json(
      { success: true, profile: driverProfile },
      { status: 201 }
    )
  } catch (error) {
    console.error("Driver onboarding error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du profil" },
      { status: 500 }
    )
  }
}
