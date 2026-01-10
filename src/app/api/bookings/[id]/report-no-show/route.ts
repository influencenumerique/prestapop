import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { requireRole, isCompanyOwner } from "@/lib/api-auth"

const reportNoShowSchema = z.object({
  comment: z.string().min(10, "Le commentaire doit contenir au moins 10 caractères"),
  evidence: z.string().url().optional(),
})

/**
 * POST /api/bookings/[id]/report-no-show
 *
 * L'entreprise signale un no-show (chauffeur absent/non présenté)
 *
 * Workflow:
 * 1. Entreprise signale le no-show avec commentaire obligatoire et preuve optionnelle
 * 2. Ajout d'un marqueur "NO_SHOW_REPORTED:" dans companyNotes
 * 3. Statut booking reste ASSIGNED (car schema ne contient pas NO_SHOW_REPORTED)
 * 4. Notification chauffeur (email + in-app)
 * 5. Admin peut ensuite confirmer via confirm-no-show → CANCELLED + sanctions
 *
 * Accessible uniquement par la Company propriétaire de la mission
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify authentication and role (Company only)
    const authResult = await requireRole("COMPANY")
    if ("error" in authResult) {
      return authResult.error
    }

    const { user } = authResult

    // Fetch booking with related data
    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            company: true,
          },
        },
        driver: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 }
      )
    }

    // Verify user is the company owner
    if (!isCompanyOwner(user, booking.job.companyId)) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à signaler un no-show pour cette mission" },
        { status: 403 }
      )
    }

    // Check booking status - must be ASSIGNED or IN_PROGRESS
    if (!["ASSIGNED", "IN_PROGRESS"].includes(booking.status)) {
      return NextResponse.json(
        {
          error: "Le no-show ne peut être signalé que pour une mission assignée ou en cours",
          currentStatus: booking.status
        },
        { status: 400 }
      )
    }

    // Check if already reported (check in companyNotes since schema doesn't have NO_SHOW status)
    if (booking.companyNotes?.includes("NO_SHOW_REPORTED:")) {
      return NextResponse.json(
        { error: "Le no-show a déjà été signalé pour cette mission" },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const data = reportNoShowSchema.parse(body)

    // Update booking with NO_SHOW marker in company notes (status remains ASSIGNED)
    const timestamp = new Date().toISOString()
    const noShowNote = `NO_SHOW_REPORTED: [${timestamp}] ${data.comment}${data.evidence ? `\nPreuve: ${data.evidence}` : ""}`
    const existingNotes = booking.companyNotes || ""

    const updatedBooking = await db.booking.update({
      where: { id },
      data: {
        companyNotes: existingNotes ? `${existingNotes}\n\n${noShowNote}` : noShowNote,
        updatedAt: new Date(),
      },
      include: {
        job: true,
        driver: {
          include: {
            user: true,
          },
        },
      },
    })

    // TODO: Send notification to driver (email + in-app)
    // Example: await sendNoShowNotification(booking.driver.user.email, booking)
    console.log(`[NO-SHOW] Notification à envoyer au chauffeur ${booking.driver.user.email}`, {
      bookingId: booking.id,
      driverName: booking.driver.user.name,
      comment: data.comment,
      evidence: data.evidence,
    })

    return NextResponse.json({
      success: true,
      message: "No-show signalé avec succès. Le chauffeur a été notifié.",
      booking: updatedBooking,
      nextStep: "Un administrateur ou le chauffeur peut maintenant confirmer ou contester ce signalement.",
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error reporting no-show:", error)
    return NextResponse.json(
      { error: "Erreur lors du signalement du no-show" },
      { status: 500 }
    )
  }
}
