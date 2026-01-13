import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"
import {
  Truck, Clock, CheckCircle, MapPin, FileText, AlertTriangle,
  Package, Calendar, XCircle, Hourglass, Star, TrendingUp
} from "lucide-react"

const statusConfig: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Disponible", color: "bg-emerald-100 text-emerald-800" },
  ASSIGNED: { label: "Attribuée", color: "bg-emerald-100 text-emerald-800" },
  IN_PROGRESS: { label: "En cours", color: "bg-yellow-100 text-yellow-800" },
  DELIVERED: { label: "Livrée", color: "bg-purple-100 text-purple-800" },
  COMPLETED: { label: "Terminée", color: "bg-gray-100 text-gray-800" },
  CANCELLED: { label: "Annulée", color: "bg-red-100 text-red-800" },
}

const volumeLabels: Record<string, string> = {
  CUBE_6M: "6m³",
  CUBE_9M: "9m³",
  CUBE_12M: "12m³",
  CUBE_15M: "15m³",
  CUBE_20M: "20m³",
}

const verificationStatusConfig: Record<string, { label: string; icon: React.ReactNode; bgColor: string; textColor: string; borderColor: string }> = {
  PENDING_VERIF: {
    label: "En attente de validation",
    icon: <Hourglass className="h-5 w-5" />,
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-800",
    borderColor: "border-yellow-200",
  },
  VERIFIED: {
    label: "Compte validé",
    icon: <CheckCircle className="h-5 w-5" />,
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-800",
    borderColor: "border-emerald-200",
  },
  REJECTED: {
    label: "Compte refusé",
    icon: <XCircle className="h-5 w-5" />,
    bgColor: "bg-red-50",
    textColor: "text-red-800",
    borderColor: "border-red-200",
  },
}

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

async function getAvailableJobs() {
  return db.job.findMany({
    where: { status: "OPEN" },
    include: {
      company: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  })
}

export default async function DriverDashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { driverProfile: true },
  })

  if (!user) {
    redirect("/login")
  }

  // Only drivers can access this page
  if (!user.driverProfile) {
    redirect("/dashboard")
  }

  const bookings = await getDriverBookings(user.driverProfile.id)
  const availableJobs = await getAvailableJobs()

  const activeBookings = bookings.filter(
    b => b.status === "ASSIGNED" || b.status === "IN_PROGRESS"
  )

  const isActiveDriver = user.status === "VERIFIED" || user.driverProfile.isVerified ||
    user.driverProfile.rating > 0 || user.driverProfile.totalDeliveries > 0

  return (
    <div className="min-h-screen">
      {/* Header avec dégradé vert */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Bonjour, {user.name || "chauffeur"}
              </h1>
              <p className="text-emerald-100">
                Tableau de bord chauffeur-livreur
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
              <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
              <span className="text-xl font-bold">{user.driverProfile.rating.toFixed(1)}</span>
              <span className="text-emerald-100">/5</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8 -mt-12">
          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <Truck className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{user.driverProfile.totalDeliveries}</p>
                  <p className="text-sm text-muted-foreground">Livraisons effectuées</p>
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
                  <p className="text-2xl font-bold">{activeBookings.length}</p>
                  <p className="text-sm text-muted-foreground">Missions en cours</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{user.driverProfile.rating.toFixed(1)}/5</p>
                  <p className="text-sm text-muted-foreground">Note moyenne</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Verification Status */}
        {!isActiveDriver && verificationStatusConfig[user.status] && (
          <Card className={`mb-8 ${verificationStatusConfig[user.status].borderColor} ${verificationStatusConfig[user.status].bgColor}`}>
            <CardContent className="p-4">
              <div className={`flex items-center gap-3 ${verificationStatusConfig[user.status].textColor}`}>
                {verificationStatusConfig[user.status].icon}
                <span className="font-medium">{verificationStatusConfig[user.status].label}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents Alert */}
        {!isActiveDriver && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-100 rounded-lg shrink-0">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 mb-1">
                    Documents requis pour postuler
                  </h3>
                  <p className="text-sm text-orange-800 mb-2">
                    Pour commencer à postuler aux missions, vous devez fournir vos documents.
                  </p>
                  <ul className="text-sm text-orange-800 mb-4 space-y-1">
                    <li className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      KBIS, Pièce d&apos;identité, Permis, Assurance véhicule
                    </li>
                  </ul>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm">
                    Envoyer mes documents
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mes Missions */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Mes missions</CardTitle>
              <CardDescription>Vos missions de livraison</CardDescription>
            </div>
            <Link href="/jobs">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Trouver une mission
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const status = statusConfig[booking.status]
                  return (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{booking.job.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {booking.job.company.companyName}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          {booking.job.secteurLivraison}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={status?.color || "bg-gray-100 text-gray-800"}>
                          {status?.label || booking.status}
                        </Badge>
                        <span className="font-semibold text-emerald-600">{formatPrice(booking.agreedPrice)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-2">Pas encore de mission attribuée</p>
                <p className="text-sm text-muted-foreground">Découvrez les missions disponibles ci-dessous</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Missions Disponibles */}
        {availableJobs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-600" />
                Missions disponibles
              </CardTitle>
              <CardDescription>{availableJobs.length} missions ouvertes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availableJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium truncate">{job.title}</h5>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.secteurLivraison}
                        </span>
                        <span className="flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          {volumeLabels[job.vehicleVolume] || job.vehicleVolume}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(job.startTime).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <span className="text-lg font-bold text-emerald-600 whitespace-nowrap">
                        {formatPrice(job.dayRate)}
                      </span>
                      <Link href={`/jobs/${job.id}`}>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                          Voir
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link href="/jobs">
                  <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                    Voir toutes les missions
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
