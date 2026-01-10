import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-auth"

// GET /api/bookings - Liste des missions du driver ou de la company
// Accessible aux utilisateurs authentifiés (DRIVER et COMPANY)
export async function GET(req: Request) {
  try {
    // Vérifier l'authentification
    const authResult = await requireAuth()
    if ("error" in authResult) {
      return authResult.error
    }

    const { user } = authResult

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    let bookings

    // Selon le rôle de l'utilisateur, on filtre différemment
    if (user.role === "DRIVER" && user.driverProfile) {
      // Missions du chauffeur
      const where: any = { driverId: user.driverProfile.id }
      if (status) where.status = status

      bookings = await db.booking.findMany({
        where,
        include: {
          job: { include: { company: { include: { user: true } } } },
          review: true,
        },
        orderBy: { createdAt: "desc" },
      })
    } else if (user.role === "COMPANY" && user.company) {
      // Missions de l'entreprise (via les jobs)
      const where: any = { job: { companyId: user.company.id } }
      if (status) where.status = status

      bookings = await db.booking.findMany({
        where,
        include: {
          job: true,
          driver: { include: { user: true } },
          review: true,
        },
        orderBy: { createdAt: "desc" },
      })
    } else {
      // Si l'utilisateur n'a ni profil driver ni company
      return NextResponse.json({ bookings: [] })
    }

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des missions" },
      { status: 500 }
    )
  }
}
