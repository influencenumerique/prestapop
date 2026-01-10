import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { requireAuth, isCompanyOwner, isDriver } from "@/lib/api-auth"

const disputeSchema = z.object({
  reason: z.string().min(10, "La raison doit contenir au moins 10 caractères"),
  disputeType: z.enum(["NOT_DELIVERED", "DAMAGED", "INCOMPLETE", "OTHER"]).optional(),
})

/**
 * POST /api/bookings/[id]/dispute
 *
 * Contester une mission (utilisé par l'entreprise pour refuser la validation)
 *
 * Workflow:
 * 1. Chauffeur marque DELIVERED
 * 2. Entreprise conteste au lieu de valider
 * 3. Status passe à DISPUTED
 * 4. Aucun payout n'est effectué
 * 5. Intervention manuelle admin requise pour résolution
 *
 * Accessible par la Company propriétaire ou le Driver assigné
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify authentication
    const authResult = await requireAuth()
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

    // Verify user is either company owner or driver
    const isCompany = isCompanyOwner(user, booking.job.companyId)
    const isDriverUser = isDriver(user, booking.driverId)

    if (!isCompany && !isDriverUser) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à contester cette mission" },
        { status: 403 }
      )
    }

    // Check booking status - must be DELIVERED (or potentially ASSIGNED/IN_PROGRESS)
    if (!["DELIVERED", "ASSIGNED", "IN_PROGRESS"].includes(booking.status)) {
      return NextResponse.json(
        { error: `Impossible de contester cette mission. Statut actuel: ${booking.status}` },
        { status: 400 }
      )
    }

    // If already disputed
    if (booking.stripePaymentStatus === "disputed") {
      return NextResponse.json(
        { error: "Cette mission est déjà en litige" },
        { status: 400 }
      )
    }

    const body = await req.json()
    const data = disputeSchema.parse(body)

    // Determine who is disputing
    const disputedBy = isCompany ? "COMPANY" : "DRIVER"

    // Update booking to DISPUTED status
    const updatedBooking = await db.booking.update({
      where: { id },
      data: {
        stripePaymentStatus: "disputed",
        companyNotes: isCompany
          ? `[LITIGE OUVERT par entreprise] ${data.reason}\n${booking.companyNotes || ""}`
          : booking.companyNotes,
        driverNotes: isDriverUser
          ? `[LITIGE OUVERT par chauffeur] ${data.reason}\n${booking.driverNotes || ""}`
          : booking.driverNotes,
      },
      include: {
        job: { include: { company: { include: { user: true } } } },
        driver: { include: { user: true } },
      },
    })

    // Note: Le status JE NE le change pas à CANCELLED car on veut garder DELIVERED
    // pour savoir qu'il y a eu une livraison, juste contestée
    // On utilise stripePaymentStatus = "disputed" comme indicateur

    console.log(
      `[Dispute] Booking ${id} disputed by ${disputedBy} - Reason: ${data.reason}`
    )

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      disputedBy,
      message: "Mission contestée. Une intervention manuelle est requise pour résolution.",
      nextSteps: [
        "Le litige a été enregistré",
        "Un administrateur PrestaPop va examiner le dossier",
        "Aucun paiement au chauffeur ne sera effectué tant que le litige n'est pas résolu",
        "Vous serez contacté pour fournir des informations supplémentaires si nécessaire",
      ],
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error disputing booking:", error)
    return NextResponse.json(
      { error: "Erreur lors de la contestation de la mission" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/bookings/[id]/dispute
 *
 * Récupère les informations sur un litige
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify authentication
    const authResult = await requireAuth()
    if ("error" in authResult) {
      return authResult.error
    }

    const { user } = authResult

    // Fetch booking
    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        job: { include: { company: { include: { user: true } } } },
        driver: { include: { user: true } },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 }
      )
    }

    // Verify authorization
    const isCompany = isCompanyOwner(user, booking.job.companyId)
    const isDriverUser = isDriver(user, booking.driverId)
    const isAdmin = user.role === "ADMIN"

    if (!isCompany && !isDriverUser && !isAdmin) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à consulter ce litige" },
        { status: 403 }
      )
    }

    const isDisputed = booking.stripePaymentStatus === "disputed"

    return NextResponse.json({
      bookingId: booking.id,
      status: booking.status,
      isDisputed,
      disputeInfo: isDisputed ? {
        companyNotes: booking.companyNotes,
        driverNotes: booking.driverNotes,
        deliveredAt: booking.deliveredAt,
        proofOfDelivery: booking.proofOfDelivery,
      } : null,
      message: isDisputed
        ? "Cette mission est en litige"
        : "Cette mission n'est pas en litige",
    })
  } catch (error: any) {
    console.error("Error fetching dispute info:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des informations du litige" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/bookings/[id]/dispute
 *
 * Résolution d'un litige par un admin
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify authentication - ADMIN only
    const authResult = await requireAuth()
    if ("error" in authResult) {
      return authResult.error
    }

    const { user } = authResult

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent résoudre les litiges" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const resolution = z.object({
      action: z.enum(["VALIDATE", "CANCEL", "PARTIAL_REFUND"]),
      adminNotes: z.string(),
      refundAmount: z.number().optional(), // Si PARTIAL_REFUND
    }).parse(body)

    const booking = await db.booking.findUnique({
      where: { id },
      include: { job: true, driver: true },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 }
      )
    }

    if (booking.stripePaymentStatus !== "disputed") {
      return NextResponse.json(
        { error: "Cette mission n'est pas en litige" },
        { status: 400 }
      )
    }

    let updatedStatus: string
    let updatedPaymentStatus: string

    switch (resolution.action) {
      case "VALIDATE":
        // Valider la mission malgré le litige
        updatedStatus = "COMPLETED"
        updatedPaymentStatus = "payout_pending"
        // TODO: Déclencher le payout comme dans validate-completion
        break

      case "CANCEL":
        // Annuler la mission et rembourser l'entreprise
        updatedStatus = "CANCELLED"
        updatedPaymentStatus = "refunded"
        // TODO: Créer un refund Stripe
        break

      case "PARTIAL_REFUND":
        // Remboursement partiel
        updatedStatus = "COMPLETED"
        updatedPaymentStatus = "partial_refund"
        // TODO: Créer un refund partiel Stripe
        break

      default:
        throw new Error("Action non reconnue")
    }

    const updatedBooking = await db.booking.update({
      where: { id },
      data: {
        status: updatedStatus as any,
        stripePaymentStatus: updatedPaymentStatus,
        companyNotes: `${booking.companyNotes}\n\n[RÉSOLUTION ADMIN] ${resolution.adminNotes}`,
      },
    })

    await db.job.update({
      where: { id: booking.jobId },
      data: { status: updatedStatus as any },
    })

    console.log(
      `[Dispute Resolution] Booking ${id} resolved by admin ${user.id} - Action: ${resolution.action}`
    )

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      resolution: resolution.action,
      message: `Litige résolu: ${resolution.action}`,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error resolving dispute:", error)
    return NextResponse.json(
      { error: "Erreur lors de la résolution du litige" },
      { status: 500 }
    )
  }
}
