import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { z } from "zod"
import Pusher from "pusher"

// Pusher server instance
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

const sendMessageSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1).max(5000),
  receiverId: z.string().optional(),
})

// GET: Récupérer les messages d'une conversation
export async function GET(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get("conversationId")
    const limit = parseInt(searchParams.get("limit") || "50")
    const cursor = searchParams.get("cursor")

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId requis" },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    const participant = await db.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: session.user.id,
        },
      },
    })

    if (!participant) {
      return NextResponse.json(
        { error: "Accès non autorisé à cette conversation" },
        { status: 403 }
      )
    }

    // Récupérer les messages avec pagination cursor-based
    const messages = await db.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, name: true, image: true },
        },
        receiver: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    })

    // Marquer les messages non lus comme lus
    await db.message.updateMany({
      where: {
        conversationId,
        receiverId: session.user.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    })

    return NextResponse.json({
      messages: messages.reverse(), // Chronological order
      nextCursor: messages.length === limit ? messages[0]?.id : null,
    })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des messages" },
      { status: 500 }
    )
  }
}

// POST: Envoyer un message
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await req.json()
    const { conversationId, content, receiverId } = sendMessageSchema.parse(body)

    // Vérifier que l'utilisateur fait partie de la conversation
    const participant = await db.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: session.user.id,
        },
      },
    })

    if (!participant) {
      return NextResponse.json(
        { error: "Accès non autorisé à cette conversation" },
        { status: 403 }
      )
    }

    // Créer le message
    const message = await db.message.create({
      data: {
        conversationId,
        senderId: session.user.id,
        receiverId,
        content,
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true },
        },
        receiver: {
          select: { id: true, name: true, image: true },
        },
      },
    })

    // Mettre à jour lastMessage de la conversation
    await db.conversation.update({
      where: { id: conversationId },
      data: { lastMessage: new Date() },
    })

    // Envoyer via Pusher pour le realtime
    await pusher.trigger(`conversation-${conversationId}`, "new-message", {
      message,
    })

    // Notifier le destinataire sur son canal personnel
    if (receiverId) {
      await pusher.trigger(`user-${receiverId}`, "new-message-notification", {
        conversationId,
        senderId: session.user.id,
        senderName: session.user.name,
        preview: content.substring(0, 100),
      })
    }

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error sending message:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 }
    )
  }
}
