import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { requireAnyRole, hasRole } from "@/lib/api-auth"

const confirmNoShowSchema = z.object({
  confirmed: z.boolean(),
  adminComment: z.string().optional(),
})

/**
 * PATCH /api/bookings/[id]/confirm-no-show
 *
 * Admin ou chauffeur confirme ou conteste le no-show
 *
 * Workflow:
 * 1. Admin/Chauffeur confirme (confirmed: true) ou conteste (confirmed: false)
 * 2. Si confirmé:
 *    - Statut booking → CANCELLED
 *    - Statut job → CANCELLED
 *    - Incrémenter strikeCount du driver
 *    - Appliquer sanction automatique:
 *      * strikeCount=1 → warning (pas de suspension)
 *      * strikeCount=2 → suspensionUntil = now + 7 days + isAvailable=false
 *      * strikeCount>=3 → isBanned=true + suspensionUntil=null + isAvailable=false
 *    - Marquer companyNotes avec "NO_SHOW_CONFIRMED"
 * 3. Si contesté:
 *    - Marquer driverNotes avec "NO_SHOW_CONTESTED"
 *    - Status reste inchangé, nécessite investigation manuelle
 *
 * Accessible par Role.ADMIN ou le chauffeur concerné
 *
 * NOTE: Les champs strikeCount, lastStrikeAt, isBanned, suspensionUntil n'existent pas
 * dans le schema DriverProfile actuel. Cette route utilise driverNotes pour tracker
 * les sanctions en attendant une migration du schema.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify authentication (Admin or Driver only)
    const authResult = await requireAnyRole(["ADMIN", "DRIVER"])
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
            company: {
              include: {
                user: true,
              },
            },
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

    // Check if no-show was reported
    if (!booking.companyNotes?.includes("NO_SHOW_REPORTED:")) {
      return NextResponse.json(
        { error: "Aucun no-show n'a été signalé pour cette mission" },
        { status: 400 }
      )
    }

    // Check if already confirmed or contested
    if (booking.companyNotes?.includes("NO_SHOW_CONFIRMED:") ||
        booking.driverNotes?.includes("NO_SHOW_CONTESTED:")) {
      return NextResponse.json(
        { error: "Ce no-show a déjà été traité" },
        { status: 400 }
      )
    }

    // If driver, verify it's their booking
    if (user.role === "DRIVER") {
      if (!user.driverProfile || user.driverProfile.id !== booking.driverId) {
        return NextResponse.json(
          { error: "Vous n'êtes pas autorisé à traiter ce no-show" },
          { status: 403 }
        )
      }
    }

    // Parse and validate request body
    const body = await req.json()
    const data = confirmNoShowSchema.parse(body)

    const timestamp = new Date().toISOString()
    const isAdmin = hasRole(user, "ADMIN")

    if (data.confirmed) {
      // NO-SHOW CONFIRMÉ → Sanctions + Annulation

      // Parse existing driver sanctions from driverNotes
      const driverNotes = booking.driver.bio || ""
      let strikeCount = 0
      const strikeMatch = driverNotes.match(/STRIKE_COUNT:(\d+)/)
      if (strikeMatch) {
        strikeCount = parseInt(strikeMatch[1], 10)
      }

      // Increment strike count
      strikeCount += 1

      // Determine sanction
      let sanctionMessage = ""
      let suspensionDays = 0
      let isBanned = false

      if (strikeCount === 1) {
        sanctionMessage = "AVERTISSEMENT - 1er no-show"
      } else if (strikeCount === 2) {
        sanctionMessage = "SUSPENSION 7 JOURS - 2ème no-show"
        suspensionDays = 7
      } else {
        sanctionMessage = "BAN PERMANENT - 3ème no-show ou plus"
        isBanned = true
      }

      const suspensionUntil = suspensionDays > 0
        ? new Date(Date.now() + suspensionDays * 24 * 60 * 60 * 1000).toISOString()
        : null

      // Update booking: mark as CANCELLED with confirmation note
      const confirmNote = `NO_SHOW_CONFIRMED: [${timestamp}] Par ${user.role} ${user.name || user.email}${data.adminComment ? `\nCommentaire: ${data.adminComment}` : ""}\nSanction: ${sanctionMessage}`
      const existingCompanyNotes = booking.companyNotes || ""

      const updatedBooking = await db.booking.update({
        where: { id },
        data: {
          status: "CANCELLED",
          companyNotes: `${existingCompanyNotes}\n\n${confirmNote}`,
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

      // Update job status
      await db.job.update({
        where: { id: booking.jobId },
        data: { status: "CANCELLED" },
      })

      // Update driver profile with sanctions
      // NOTE: Schema doesn't have strikeCount, isBanned, suspensionUntil
      // Using bio field to track strikes temporarily
      const sanctionRecord = `\n\n[SANCTION] STRIKE_COUNT:${strikeCount} | LAST_STRIKE:${timestamp}${isBanned ? " | BANNED:true" : ""}${suspensionUntil ? ` | SUSPENDED_UNTIL:${suspensionUntil}` : ""}`
      const existingBio = booking.driver.bio || ""

      // Remove old STRIKE_COUNT record if exists
      const cleanedBio = existingBio.replace(/\[SANCTION\] STRIKE_COUNT:\d+.*?(?=\n\n|\n\[|$)/s, "").trim()

      await db.driverProfile.update({
        where: { id: booking.driverId },
        data: {
          bio: `${cleanedBio}${sanctionRecord}`,
          isAvailable: !isBanned && !suspensionDays, // Disable if banned or suspended
        },
      })

      // TODO: Send notification to driver about sanction
      console.log(`[NO-SHOW CONFIRMED] Sanction appliquée au chauffeur ${booking.driver.user.email}`, {
        bookingId: booking.id,
        driverName: booking.driver.user.name,
        strikeCount,
        sanction: sanctionMessage,
        isBanned,
        suspensionUntil,
      })

      return NextResponse.json({
        success: true,
        message: `No-show confirmé. Sanction appliquée: ${sanctionMessage}`,
        booking: updatedBooking,
        sanction: {
          strikeCount,
          message: sanctionMessage,
          isBanned,
          suspensionUntil,
        },
        nextStep: "L'entreprise peut maintenant demander un remboursement via /api/bookings/:id/refund",
      })
    } else {
      // NO-SHOW CONTESTÉ
      const contestNote = `NO_SHOW_CONTESTED: [${timestamp}] Par ${user.role} ${user.name || user.email}${data.adminComment ? `\nCommentaire: ${data.adminComment}` : ""}`
      const existingDriverNotes = booking.driverNotes || ""

      const updatedBooking = await db.booking.update({
        where: { id },
        data: {
          driverNotes: existingDriverNotes ? `${existingDriverNotes}\n\n${contestNote}` : contestNote,
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

      // TODO: Send notification to company and admin about contestation
      console.log(`[NO-SHOW CONTESTED] Le chauffeur ${booking.driver.user.email} conteste le no-show`, {
        bookingId: booking.id,
        driverName: booking.driver.user.name,
        comment: data.adminComment,
      })

      return NextResponse.json({
        success: true,
        message: "No-show contesté. Une investigation manuelle est nécessaire.",
        booking: updatedBooking,
        nextStep: "Un administrateur doit enquêter et trancher manuellement.",
      })
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error confirming no-show:", error)
    return NextResponse.json(
      { error: "Erreur lors de la confirmation du no-show" },
      { status: 500 }
    )
  }
}
