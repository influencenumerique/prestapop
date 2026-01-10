import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { z } from "zod"

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
})

// POST /api/bookings/[id]/review - Laisser un avis après livraison
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const booking = await db.booking.findUnique({
      where: { id },
      include: { review: true, driver: true, job: true },
    })

    if (!booking) {
      return NextResponse.json({ error: "Mission non trouvée" }, { status: 404 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { company: true },
    })

    // Seule la company peut laisser un avis sur le driver
    if (user?.company?.id !== booking.job.companyId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // Vérifier si la mission est terminée
    if (booking.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Vous ne pouvez noter que les missions terminées" },
        { status: 400 }
      )
    }

    // Vérifier si déjà noté
    if (booking.review) {
      return NextResponse.json(
        { error: "Vous avez déjà noté cette mission" },
        { status: 400 }
      )
    }

    const body = await req.json()
    const data = reviewSchema.parse(body)

    // Calculer nouvelle note du driver
    const newRating = await calculateNewRating(booking.driverId, data.rating)

    // Créer review et mettre à jour la note du driver
    const [review] = await db.$transaction([
      db.review.create({
        data: {
          bookingId: booking.id,
          userId: session.user.id!,
          rating: data.rating,
          comment: data.comment,
        },
      }),
      db.driverProfile.update({
        where: { id: booking.driverId },
        data: {
          totalReviews: { increment: 1 },
          rating: newRating,
        },
      }),
    ])

    return NextResponse.json(review)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error creating review:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de l'avis" },
      { status: 500 }
    )
  }
}

async function calculateNewRating(driverId: string, newRating: number): Promise<number> {
  const driver = await db.driverProfile.findUnique({
    where: { id: driverId },
  })

  if (!driver) return newRating

  const totalRatings = driver.rating * driver.totalReviews
  return (totalRatings + newRating) / (driver.totalReviews + 1)
}
