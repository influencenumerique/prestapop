import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendContactEmail } from '@/lib/email'
import { z } from 'zod'

const contactSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  userName: z.string(),
  subject: z.string().min(1),
  message: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const validation = contactSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { email, userName, subject, message } = validation.data

    await sendContactEmail({
      to: email,
      userName,
      subject,
      message,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Error sending contact email:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de l\'email' },
      { status: 500 }
    )
  }
}
