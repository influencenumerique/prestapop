import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireRole, isCompanyOwner } from "@/lib/api-auth"

/**
 * PATCH /api/jobs/[id]/cancel
 * Annuler une mission (changement de status vers CANCELLED)
 *
 * Restrictions:
 * - Role.COMPANY uniquement
 * - L'entreprise doit être propriétaire de la mission (job.companyId === user.company.id)
 * - Le statut actuel doit permettre l'annulation (DRAFT ou OPEN)
 *
 * Retourne: Mission mise à jour avec status CANCELLED
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Vérifier que l'utilisateur est une entreprise (Role.COMPANY)
    const authResult = await requireRole("COMPANY")
    if ("error" in authResult) {
      return authResult.error
    }

    const { user } = authResult

    // Vérifier que l'utilisateur a bien un profil Company
    if (!user.company) {
      return NextResponse.json(
        { error: "Profil entreprise non trouvé. Veuillez compléter votre profil." },
        { status: 400 }
      )
    }

    // Récupérer la mission avec les bookings
    const job = await db.job.findUnique({
      where: { id },
      include: {
        bookings: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json(
        { error: "Mission non trouvée" },
        { status: 404 }
      )
    }

    // Vérifier que l'entreprise est bien propriétaire de la mission
    if (!isCompanyOwner(user, job.companyId)) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à annuler cette mission" },
        { status: 403 }
      )
    }

    // Vérifier que le statut actuel permet l'annulation
    // On peut annuler une mission en DRAFT ou OPEN
    const cancellableStatuses = ["DRAFT", "OPEN"]

    if (!cancellableStatuses.includes(job.status)) {
      return NextResponse.json(
        {
          error: `Impossible d'annuler une mission avec le statut "${job.status}". Seules les missions en "DRAFT" ou "OPEN" peuvent être annulées.`,
          currentStatus: job.status,
          allowedStatuses: cancellableStatuses,
        },
        { status: 400 }
      )
    }

    // Mettre à jour le statut de la mission
    const updatedJob = await db.job.update({
      where: { id },
      data: {
        status: "CANCELLED",
        updatedAt: new Date(),
      },
      include: {
        company: { include: { user: true } },
        bookings: {
          include: {
            driver: { include: { user: true } },
          },
        },
      },
    })

    // Note: Si des bookings existent en status PENDING, on pourrait les notifier de l'annulation
    // Cela pourrait être géré via un webhook ou un système de notifications
    const pendingBookings = updatedJob.bookings.filter(b => b.status === "PENDING")

    return NextResponse.json({
      success: true,
      job: updatedJob,
      message: "Mission annulée avec succès",
      pendingBookingsCount: pendingBookings.length,
    })
  } catch (error) {
    console.error("Error cancelling job:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'annulation de la mission" },
      { status: 500 }
    )
  }
}
