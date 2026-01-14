import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireRole, isCompanyOwner } from "@/lib/api-auth"

/**
 * GET /api/jobs/[id]/candidatures
 * Liste des candidatures (bookings) pour une mission spécifique
 *
 * Restrictions:
 * - Role.COMPANY uniquement
 * - L'entreprise doit être propriétaire de la mission (job.companyId === user.company.id)
 *
 * Retourne: Liste de candidatures avec infos du chauffeur
 */
export async function GET(
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

    // Récupérer la mission
    const job = await db.job.findUnique({
      where: { id },
      select: { id: true, companyId: true, title: true },
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
        { error: "Vous n'êtes pas autorisé à voir les candidatures de cette mission" },
        { status: 403 }
      )
    }

    // Récupérer toutes les candidatures (bookings) pour cette mission
    const candidatures = await db.booking.findMany({
      where: { jobId: id },
      include: {
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Formater la réponse
    const formattedCandidatures = candidatures.map((booking) => ({
      bookingId: booking.id,
      driverId: booking.driver.id,
      driverName: booking.driver.user.name,
      driverEmail: booking.driver.user.email,
      driverProfilePicture: booking.driver.user.image,
      vehicle: booking.driver.vehicleTypes,
      rating: booking.driver.rating,
      totalDeliveries: booking.driver.totalDeliveries,
      appliedAt: booking.createdAt,
      status: booking.status,
      agreedPrice: booking.agreedPrice,
      driverNotes: booking.driverNotes,
      stripePaymentStatus: booking.stripePaymentStatus,
      // Infos complémentaires du chauffeur
      driverCity: booking.driver.city,
      driverIsVerified: booking.driver.isVerified,
      driverIsAvailable: booking.driver.isAvailable,
    }))

    return NextResponse.json({
      jobId: id,
      jobTitle: job.title,
      candidatures: formattedCandidatures,
      total: formattedCandidatures.length,
    })
  } catch (error) {
    console.error("Error fetching candidatures:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des candidatures" },
      { status: 500 }
    )
  }
}
