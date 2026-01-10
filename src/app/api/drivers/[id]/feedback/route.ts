import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { FeedbackTag, Role, JobStatus } from "@prisma/client"
import { updateDriverTagStats, updateDriverBadges } from "@/lib/utils/badges"

const feedbackSchema = z.object({
  bookingId: z.string().cuid(),
  rating: z.number().min(1).max(5),
  tags: z.array(z.nativeEnum(FeedbackTag)),
  comment: z.string().optional(),
})

/**
 * POST /api/drivers/[id]/feedback
 * Permet à une entreprise de noter un chauffeur après une mission terminée
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: driverId } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est une entreprise
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { company: true },
    })

    if (!user?.company || user.role !== Role.COMPANY) {
      return NextResponse.json(
        { error: "Seules les entreprises peuvent laisser des feedbacks" },
        { status: 403 }
      )
    }

    // Valider le body
    const body = await req.json()
    const data = feedbackSchema.parse(body)

    // Vérifier que le chauffeur existe
    const driver = await db.driverProfile.findUnique({
      where: { id: driverId },
    })

    if (!driver) {
      return NextResponse.json(
        { error: "Chauffeur non trouvé" },
        { status: 404 }
      )
    }

    // Vérifier que la mission existe et est terminée
    const booking = await db.booking.findUnique({
      where: { id: data.bookingId },
      include: {
        job: true,
        driverFeedback: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Mission non trouvée" },
        { status: 404 }
      )
    }

    // Vérifier que la mission appartient bien à l'entreprise
    if (booking.job.companyId !== user.company.id) {
      return NextResponse.json(
        { error: "Cette mission ne vous appartient pas" },
        { status: 403 }
      )
    }

    // Vérifier que la mission est bien assignée au bon chauffeur
    if (booking.driverId !== driverId) {
      return NextResponse.json(
        { error: "Ce chauffeur n'est pas assigné à cette mission" },
        { status: 400 }
      )
    }

    // Vérifier que la mission est terminée
    if (booking.status !== JobStatus.COMPLETED) {
      return NextResponse.json(
        { error: "Vous ne pouvez noter que les missions terminées" },
        { status: 400 }
      )
    }

    // Vérifier que l'entreprise n'a pas déjà voté pour cette mission
    if (booking.driverFeedback) {
      return NextResponse.json(
        { error: "Vous avez déjà laissé un feedback pour cette mission" },
        { status: 400 }
      )
    }

    // Créer le feedback
    const feedback = await db.driverFeedback.create({
      data: {
        bookingId: data.bookingId,
        driverId,
        companyId: user.company.id,
        rating: data.rating,
        tags: data.tags,
        comment: data.comment,
      },
    })

    // Mettre à jour les stats de tags
    await updateDriverTagStats(driverId, data.tags)

    // Recalculer la note moyenne du chauffeur
    const allFeedbacks = await db.driverFeedback.findMany({
      where: { driverId },
      select: { rating: true },
    })

    const avgRating =
      allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / allFeedbacks.length

    // Mettre à jour le profil du chauffeur
    await db.driverProfile.update({
      where: { id: driverId },
      data: {
        rating: avgRating,
        totalReviews: allFeedbacks.length,
      },
    })

    // Vérifier et attribuer les badges
    await updateDriverBadges(driverId)

    return NextResponse.json(feedback, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error creating feedback:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du feedback" },
      { status: 500 }
    )
  }
}
