import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Calendar, Clock, Package, Truck, Building2, ArrowRight, XCircle, LogIn } from "lucide-react"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { formatPrice } from "@/lib/utils"
import { LaunchMissionButton } from "@/components/launch-mission-button"
import { ApplyMissionButton } from "@/components/apply-mission-button"

const volumeLabels: Record<string, string> = {
  CUBE_6M: "6m³",
  CUBE_9M: "9m³",
  CUBE_12M: "12m³",
  CUBE_15M: "15m³",
  CUBE_20M: "20m³",
}

const missionTypeLabels: Record<string, string> = {
  DAY: "Journée complète",
  HALF_DAY: "Demi-journée",
  WEEK: "Semaine",
}

const zoneTypeLabels: Record<string, string> = {
  URBAN: "Urbain",
  CITY_TO_CITY: "Inter-urbain",
}

const packageSizeLabels: Record<string, string> = {
  SMALL: "Petits colis",
  MEDIUM: "Colis moyens",
  LARGE: "Gros colis",
  MIXED: "Mixte",
}

const statusLabels: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Disponible", color: "bg-green-100 text-green-800" },
  ASSIGNED: { label: "Attribuée", color: "bg-blue-100 text-blue-800" },
  IN_PROGRESS: { label: "En cours", color: "bg-yellow-100 text-yellow-800" },
  DELIVERED: { label: "Livrée", color: "bg-purple-100 text-purple-800" },
  COMPLETED: { label: "Terminée", color: "bg-gray-100 text-gray-800" },
  CANCELLED: { label: "Annulée", color: "bg-red-100 text-red-800" },
}

async function getJob(id: string) {
  const job = await db.job.findUnique({
    where: { id },
    include: {
      company: { include: { user: true } },
      bookings: {
        include: {
          driver: { include: { user: true } },
        },
      },
    },
  })
  return job
}

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await getJob(id)

  if (!job) {
    notFound()
  }

  // Get current user session and profile
  const session = await auth()
  let userRole: "owner" | "driver" | "guest" = "guest"
  let hasAlreadyApplied = false

  if (session?.user) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { company: true, driverProfile: true },
    })

    if (user?.company?.id === job.companyId) {
      userRole = "owner"
    } else if (user?.driverProfile) {
      userRole = "driver"
      // Check if driver has already applied
      hasAlreadyApplied = job.bookings.some(b => b.driverId === user.driverProfile!.id)
    }
  }

  const status = statusLabels[job.status] || statusLabels.OPEN

  // Get accepted booking for ASSIGNED jobs (for Stripe checkout)
  const acceptedBooking = job.bookings.find(b => b.status === "ASSIGNED" || b.status === "IN_PROGRESS")

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Badge className={status.color}>{status.label}</Badge>
              <Badge variant={job.missionZoneType === "URBAN" ? "default" : "destructive"}>
                {zoneTypeLabels[job.missionZoneType]}
              </Badge>
              <Badge variant="outline">{missionTypeLabels[job.typeMission]}</Badge>
              <Badge variant="outline">{volumeLabels[job.vehicleVolume]}</Badge>
              {job.needsTailLift && (
                <Badge variant="secondary">Hayon requis</Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-4">{job.title}</h1>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={job.company.logo || undefined} />
                <AvatarFallback>
                  <Building2 className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{job.company.companyName}</p>
                <p className="text-sm text-muted-foreground">{job.company.city}</p>
              </div>
            </div>
          </div>

          {/* Secteur */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Secteur de livraison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium">{job.secteurLivraison}</p>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Détails de la mission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {new Date(job.startTime).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Horaires</p>
                    <p className="font-medium">
                      {new Date(job.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      {" "}<ArrowRight className="inline h-3 w-3" />{" "}
                      {new Date(job.estimatedEndTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Volume requis</p>
                    <p className="font-medium">{volumeLabels[job.vehicleVolume]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Colis</p>
                    <p className="font-medium">{job.nombreColis} colis ({packageSizeLabels[job.packageSize]})</p>
                  </div>
                </div>
              </div>

              {job.needsTailLift && (
                <div className="pt-4 border-t">
                  <Badge variant="secondary" className="gap-1">
                    <Truck className="h-3 w-3" />
                    Hayon élévateur requis
                  </Badge>
                </div>
              )}

              {job.description && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Instructions</p>
                  <p className="whitespace-pre-wrap">{job.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle>À propos de l&apos;entreprise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={job.company.logo || undefined} />
                  <AvatarFallback>
                    <Building2 className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{job.company.companyName}</h3>
                  {job.company.city && (
                    <p className="text-muted-foreground">{job.company.city}</p>
                  )}
                  {job.company.description && (
                    <p className="text-sm mt-2">{job.company.description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground">Tarif {missionTypeLabels[job.typeMission].toLowerCase()}</p>
                <p className="text-3xl font-bold text-primary">{formatPrice(job.dayRate)}</p>
              </div>

              {/* Actions based on user role */}
              {job.status === "OPEN" ? (
                <>
                  {userRole === "owner" ? (
                    // Company owner - can cancel
                    <div className="space-y-3">
                      <Button variant="destructive" className="w-full gap-2" size="lg">
                        <XCircle className="h-4 w-4" />
                        Annuler cette mission
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        {job.bookings.length} candidature(s) reçue(s)
                      </p>
                      {job.bookings.length > 0 && (
                        <Button variant="outline" className="w-full" size="sm">
                          Voir les candidatures
                        </Button>
                      )}
                    </div>
                  ) : userRole === "driver" ? (
                    // Driver - can apply with availability check
                    <ApplyMissionButton
                      jobId={job.id}
                      dayRate={job.dayRate}
                      jobStartDate={job.startTime.toISOString()}
                      jobEndDate={job.estimatedEndTime.toISOString()}
                      hasAlreadyApplied={hasAlreadyApplied}
                      className="w-full"
                    />
                  ) : (
                    // Guest - must login
                    <div className="space-y-3">
                      <Link href="/login">
                        <Button className="w-full gap-2" size="lg">
                          <LogIn className="h-4 w-4" />
                          Connectez-vous pour postuler
                        </Button>
                      </Link>
                      <p className="text-xs text-center text-muted-foreground">
                        Vous devez etre chauffeur-livreur inscrit
                      </p>
                    </div>
                  )}
                </>
              ) : job.status === "ASSIGNED" && userRole === "owner" && acceptedBooking ? (
                // Company owner - can launch mission (pay via Stripe)
                <div className="space-y-3">
                  <LaunchMissionButton
                    bookingId={acceptedBooking.id}
                    dayRate={job.dayRate}
                    className="w-full"
                  />
                  <p className="text-xs text-center text-muted-foreground">
                    Chauffeur: {acceptedBooking.driver.user.name}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Badge className={status.color + " text-sm py-1 px-3"}>
                    {status.label}
                  </Badge>
                </div>
              )}

              <div className="mt-6 pt-6 border-t space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Publiée le</span>
                  <span>{new Date(job.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Mission</span>
                  <span className="font-mono text-xs">{job.id.slice(0, 8)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
