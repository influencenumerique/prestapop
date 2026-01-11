import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Package, PlusCircle, LogIn, UserPlus, Building2, ArrowRight } from "lucide-react"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { formatPrice } from "@/lib/utils"
import { JobsFilters } from "@/components/jobs-filters"

const volumeLabels: Record<string, string> = {
  CUBE_6M: "6m³",
  CUBE_9M: "9m³",
  CUBE_12M: "12m³",
  CUBE_15M: "15m³",
  CUBE_20M: "20m³",
}

const missionTypeLabels: Record<string, string> = {
  DAY: "Journée",
  HALF_DAY: "Demi-journée",
  WEEK: "Semaine",
}

const zoneTypeLabels: Record<string, string> = {
  URBAN: "Urbain",
  CITY_TO_CITY: "Inter-urbain",
}

async function getJobs(filters: { secteur?: string; vehicleVolume?: string; missionZoneType?: string }) {
  const where: any = { status: "OPEN" }

  if (filters.secteur) {
    where.secteurLivraison = { contains: filters.secteur, mode: "insensitive" }
  }

  if (filters.vehicleVolume) {
    where.vehicleVolume = filters.vehicleVolume
  }

  if (filters.missionZoneType) {
    where.missionZoneType = filters.missionZoneType
  }

  const jobs = await db.job.findMany({
    where,
    include: {
      company: { include: { user: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: [{ startTime: "asc" }, { createdAt: "desc" }],
    take: 50,
  })
  return jobs
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ secteur?: string; vehicleVolume?: string; missionZoneType?: string }>
}) {
  const params = await searchParams
  const jobs = await getJobs(params)

  // Check user status
  const session = await auth()
  const isLoggedIn = !!session?.user
  let isCompany = false
  let isDriver = false

  if (session?.user) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { company: true, driverProfile: true },
    })
    isCompany = !!user?.company
    isDriver = !!user?.driverProfile
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        {isCompany ? (
          <>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2">Trouver un chauffeur</h1>
                <p className="text-muted-foreground">Consultez les missions ouvertes et gérez vos publications</p>
              </div>
              <Link href="/dashboard/create-job">
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Publier nouvelle mission
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-2">Missions de livraison disponibles</h1>
            <p className="text-muted-foreground mb-4">
              {isDriver
                ? "Consultez les missions et postulez en un clic"
                : "Découvrez les opportunités de livraison près de chez vous"}
            </p>
            {!isLoggedIn && (
              <div className="flex flex-wrap gap-3">
                <Link href="/register?type=driver">
                  <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Inscription chauffeur gratuite
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    Connexion
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {/* CTA Banner pour visiteurs */}
      {!isLoggedIn && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-primary">Vous êtes chauffeur-livreur ?</p>
              <p className="text-sm text-muted-foreground">Inscrivez-vous gratuitement pour postuler aux missions et voir les coordonnées des entreprises</p>
            </div>
            <Link href="/register?type=driver">
              <Button size="sm" className="gap-2 whitespace-nowrap">
                Commencer maintenant
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Filters */}
      <JobsFilters />

      {/* Quick Zone Type Filter */}
      <div className="flex gap-2 flex-wrap mb-8">
        <Link href="/jobs">
          <Badge variant={!params.missionZoneType ? "default" : "outline"} className="cursor-pointer">
            Toutes les zones
          </Badge>
        </Link>
        {Object.entries(zoneTypeLabels).map(([key, label]) => (
          <Link key={key} href={`/jobs?missionZoneType=${key}`}>
            <Badge
              variant={params.missionZoneType === key ? "default" : "outline"}
              className="cursor-pointer"
            >
              {label}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Results */}
      <div className="mb-4">
        <p className="text-muted-foreground">{jobs.length} missions disponibles</p>
      </div>

      {/* Jobs Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  {isLoggedIn ? (
                    <Badge variant="secondary">{job.company.companyName}</Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <Building2 className="h-3 w-3" />
                      Entreprise vérifiée
                    </Badge>
                  )}
                  <Badge variant={job.missionZoneType === "URBAN" ? "default" : "destructive"}>
                    {zoneTypeLabels[job.missionZoneType]}
                  </Badge>
                </div>

                <h3 className="font-semibold line-clamp-2 mb-3">{job.title}</h3>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">{job.secteurLivraison}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>{new Date(job.startTime).toLocaleDateString("fr-FR")}</span>
                    <span className="text-xs">
                      ({new Date(job.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="h-4 w-4 shrink-0" />
                    <span>{job.nombreColis} colis</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <div className="flex gap-2">
                    <Badge variant="outline">{volumeLabels[job.vehicleVolume]}</Badge>
                    <Badge variant="outline">{missionTypeLabels[job.typeMission]}</Badge>
                  </div>
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(job.dayRate)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* CTA Final pour visiteurs */}
      {!isLoggedIn && jobs.length > 0 && (
        <div className="mt-12 text-center bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-2">Prêt à décrocher votre prochaine mission ?</h2>
          <p className="mb-6 opacity-90">Rejoignez plus de 500 chauffeurs-livreurs déjà inscrits sur PrestaPop</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register?type=driver">
              <Button size="lg" variant="secondary" className="gap-2">
                <UserPlus className="h-5 w-5" />
                Créer mon compte gratuitement
              </Button>
            </Link>
          </div>
        </div>
      )}

      {jobs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Aucune mission disponible</p>
          <p className="text-sm text-muted-foreground">
            Revenez plus tard ou modifiez vos filtres
          </p>
        </div>
      )}
    </div>
  )
}
