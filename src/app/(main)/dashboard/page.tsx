import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DriverDashboard } from "@/components/dashboard-driver"
import { CompanyDashboard } from "@/components/dashboard-company"

async function getDriverBookings(driverId: string) {
  return db.booking.findMany({
    where: { driverId },
    include: {
      job: { include: { company: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  })
}

async function getCompanyJobs(companyId: string) {
  return db.job.findMany({
    where: { companyId },
    include: {
      _count: { select: { bookings: true } },
      bookings: {
        where: { status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
        include: { driver: { include: { user: true } } },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  })
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { driverProfile: true, company: true },
  })

  if (!user) {
    redirect("/login")
  }

  // Redirect ADMIN users to admin dashboard
  if (user.role === "ADMIN") {
    redirect("/admin/dashboard")
  }

  const isDriver = !!user.driverProfile
  const isCompany = !!user.company

  // Fetch data based on role
  const driverBookings = isDriver ? await getDriverBookings(user.driverProfile!.id) : []
  const companyJobs = isCompany ? await getCompanyJobs(user.company!.id) : []

  // TODO: Replace with actual KBIS fields from database when schema is updated
  // For now, we simulate the KBIS status (always false until schema is migrated)
  const hasKbis = false
  const kbisVerified = false

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Bonjour, {user.name || "utilisateur"}
        </h1>
        <p className="text-muted-foreground">
          {isDriver && "Tableau de bord chauffeur-livreur"}
          {isCompany && "Tableau de bord entreprise"}
          {!isDriver && !isCompany && "Complétez votre profil pour commencer"}
        </p>
      </div>

      {/* No profile yet */}
      {!isDriver && !isCompany && (
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Bienvenue sur PrestaPop !</h2>
            <p className="text-muted-foreground mb-6">
              Choisissez votre profil pour commencer
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/register?type=company">
                <Button size="lg">Je suis une entreprise</Button>
              </Link>
              <Link href="/register?type=driver">
                <Button size="lg" variant="outline">Je suis chauffeur-livreur</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Driver Dashboard */}
      {isDriver && (
        <DriverDashboard
          profile={{
            totalDeliveries: user.driverProfile!.totalDeliveries,
            rating: user.driverProfile!.rating,
          }}
          bookings={driverBookings}
          hasKbis={hasKbis}
          kbisVerified={kbisVerified}
          userStatus={user.status}
          isVerified={user.driverProfile!.isVerified}
        />
      )}

      {/* Company Dashboard */}
      {isCompany && (
        <CompanyDashboard
          jobs={companyJobs}
          hasKbis={hasKbis}
          kbisVerified={kbisVerified}
        />
      )}
    </div>
  )
}
