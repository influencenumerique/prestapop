import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import Pusher from "pusher"

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { conversationId, isTyping } = await req.json()

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId requis" }, { status: 400 })
    }

    await pusher.trigger(`conversation-${conversationId}`, "typing", {
      userId: session.user.id,
      userName: session.user.name || "Utilisateur",
      isTyping,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Typing indicator error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
