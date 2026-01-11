import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { DocumentType } from "@prisma/client"

const docSchema = z.object({
  type: z.nativeEnum(DocumentType),
  url: z.string().url(),
  status: z.enum(["PENDING", "OK"]).default("PENDING"),
})

const requestSchema = z.object({
  docs: z.array(docSchema).min(1),
})

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await req.json()
    const { docs } = requestSchema.parse(body)

    // Create verification request
    const verificationRequest = await db.verificationRequest.create({
      data: {
        userId: session.user.id,
        docs: docs,
        status: "PENDING",
      },
    })

    // Update user status to PENDING_VERIF
    await db.user.update({
      where: { id: session.user.id },
      data: {
        status: "PENDING_VERIF",
        verificationDocs: docs,
      },
    })

    // Upsert documents in Document table
    for (const doc of docs) {
      await db.document.upsert({
        where: {
          userId_type: {
            userId: session.user.id,
            type: doc.type,
          },
        },
        update: {
          url: doc.url,
          status: "MISSING", // Will be updated by admin
        },
        create: {
          userId: session.user.id,
          type: doc.type,
          url: doc.url,
          status: "MISSING",
        },
      })
    }

    return NextResponse.json({
      success: true,
      requestId: verificationRequest.id,
      message: "Documents envoyés ! En attente de vérification admin",
    })
  } catch (error) {
    console.error("Verification request error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const requests = await db.verificationRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Get verification requests error:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
