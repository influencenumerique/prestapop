import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"
import {
  Clock, CheckCircle, MapPin, Plus, FileText, AlertTriangle,
  Building2, Users, Briefcase
} from "lucide-react"

const statusConfig: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Disponible", color: "bg-blue-100 text-blue-800" },
  ASSIGNED: { label: "Attribuée", color: "bg-blue-100 text-blue-800" },
  IN_PROGRESS: { label: "En cours", color: "bg-yellow-100 text-yellow-800" },
  DELIVERED: { label: "Livrée", color: "bg-purple-100 text-purple-800" },
  COMPLETED: { label: "Terminée", color: "bg-gray-100 text-gray-800" },
  CANCELLED: { label: "Annulée", color: "bg-red-100 text-red-800" },
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

async function getCompanyStats(companyId: string) {
  const [totalJobs, completedJobs, totalBookings] = await Promise.all([
    db.job.count({ where: { companyId } }),
    db.job.count({ where: { companyId, status: "COMPLETED" } }),
    db.booking.count({
      where: {
        job: { companyId },
        status: { in: ["ASSIGNED", "IN_PROGRESS", "COMPLETED"] }
      }
    }),
  ])
  return { totalJobs, completedJobs, totalBookings }
}

export default async function CompanyDashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { company: true },
  })

  if (!user) {
    redirect("/login")
  }

  // Only companies can access this page
  if (!user.company) {
    redirect("/dashboard")
  }

  const jobs = await getCompanyJobs(user.company.id)
  const stats = await getCompanyStats(user.company.id)

  const openJobs = jobs.filter(j => j.status === "OPEN")
  const inProgressJobs = jobs.filter(j => j.status === "IN_PROGRESS" || j.status === "ASSIGNED")

  return (
    <div className="min-h-screen">
      {/* Header avec dégradé bleu */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {user.company.companyName}
              </h1>
              <p className="text-blue-100">
                Tableau de bord entreprise
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
              <Building2 className="h-5 w-5" />
              <span className="text-blue-100">
                {user.company.isVerified ? "Entreprise vérifiée" : "En attente de vérification"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8 -mt-12">
          <Link href="/dashboard/create-job">
            <Card className="shadow-lg border-0 cursor-pointer hover:shadow-xl transition-shadow bg-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Plus className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">Publier</p>
                    <p className="text-sm text-blue-100">Nouvelle mission</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalJobs}</p>
                  <p className="text-sm text-muted-foreground">Missions publiées</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{openJobs.length}</p>
                  <p className="text-sm text-muted-foreground">Missions ouvertes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{inProgressJobs.length}</p>
                  <p className="text-sm text-muted-foreground">En cours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA si aucune mission */}
        {jobs.length === 0 && (
          <Card className="mb-8 bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0">
            <CardContent className="p-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Trouvez le chauffeur parfait en quelques clics</h2>
                <p className="text-blue-100 mb-6">
                  Publiez votre mission de livraison et recevez des candidatures de chauffeurs qualifiés
                </p>
                <Link href="/dashboard/create-job">
                  <Button size="lg" variant="secondary" className="gap-2">
                    <Plus className="h-5 w-5" />
                    Publier ma première mission
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents Alert */}
        {!user.company.isVerified && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-100 rounded-lg shrink-0">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 mb-1">
                    Documents requis pour publier
                  </h3>
                  <p className="text-sm text-orange-800 mb-2">
                    Pour publier vos missions, vous devez fournir les documents suivants :
                  </p>
                  <ul className="text-sm text-orange-800 mb-4 space-y-1">
                    <li className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      KBIS (moins de 3 mois)
                    </li>
                    <li className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Pièce d&apos;identité du gérant
                    </li>
                  </ul>
                  <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
                    Envoyer mes documents
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mes Missions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Mes missions</CardTitle>
              <CardDescription>Gérez vos missions de livraison</CardDescription>
            </div>
            <Link href="/dashboard/create-job">
              <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Plus className="h-4 w-4" />
                Publier nouvelle mission
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.map((job) => {
                  const status = statusConfig[job.status]
                  const acceptedBooking = job.bookings[0]
                  return (
                    <Link key={job.id} href={`/jobs/${job.id}`}>
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-300 transition-colors cursor-pointer">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{job.title}</h3>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {job.secteurLivraison}
                          </div>
                          {acceptedBooking && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Chauffeur: {acceptedBooking.driver.user.name}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <Badge className={status.color}>{status.label}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {job._count.bookings} candidature(s)
                            </p>
                          </div>
                          <span className="font-semibold text-blue-600">{formatPrice(job.dayRate)}</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Aucune mission publiée</p>
                <Link href="/dashboard/create-job">
                  <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                    <Plus className="h-4 w-4" />
                    Publier ma première mission
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
