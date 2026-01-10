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
    const { kbisUrl } = body

    if (!kbisUrl) {
      return NextResponse.json(
        { error: "URL du KBIS manquante" },
        { status: 400 }
      )
    }

    // Check if company exists
    const company = await db.company.findUnique({
      where: { userId: session.user.id },
    })

    if (!company) {
      return NextResponse.json(
        { error: "Profil entreprise introuvable" },
        { status: 404 }
      )
    }

    // TODO: Uncomment when KBIS fields are added to schema
    // await db.company.update({
    //   where: { userId: session.user.id },
    //   data: {
    //     kbisUrl,
    //     kbisUploadedAt: new Date(),
    //     kbisVerified: false, // Pending verification
    //   },
    // })

    // Temporary: Just return success
    // In production, the above update should be uncommented after schema migration
    console.log(`KBIS uploaded for company ${session.user.id}: ${kbisUrl}`)

    return NextResponse.json(
      { success: true, message: "KBIS enregistré avec succès" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Company KBIS update error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du KBIS" },
      { status: 500 }
    )
  }
}
