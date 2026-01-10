import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, MapPin, Calendar, Truck, CheckCircle } from "lucide-react"
import { db } from "@/lib/db"

const vehicleLabels: Record<string, string> = {
  BIKE: "Vélo cargo",
  SCOOTER: "Scooter",
  CAR: "Voiture",
  VAN: "Utilitaire",
  TRUCK: "Camion",
}

async function getDriver(userId: string) {
  const profile = await db.driverProfile.findUnique({
    where: { userId },
    include: {
      user: true,
      bookings: {
        where: { status: "COMPLETED" },
        include: {
          job: { include: { company: true } },
          review: true,
        },
        orderBy: { deliveredAt: "desc" },
        take: 5,
      },
    },
  })
  return profile
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const driver = await getDriver(id)

  if (!driver) {
    notFound()
  }

  const recentReviews = driver.bookings
    .filter((b) => b.review)
    .map((b) => b.review!)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6 text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={driver.user.image || undefined} />
                <AvatarFallback className="text-2xl">
                  {driver.user.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-xl font-bold">{driver.user.name}</h1>
              <p className="text-muted-foreground mb-4">Chauffeur-livreur</p>

              <div className="flex items-center justify-center gap-2 mb-4">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{driver.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">
                  ({driver.totalReviews} avis)
                </span>
              </div>

              {driver.city && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4" />
                  <span>{driver.city}</span>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Membre depuis {driver.createdAt.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                </span>
              </div>

              <div className="flex justify-center gap-2 mt-4">
                {driver.isVerified && (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Vérifié
                  </Badge>
                )}
                {driver.isAvailable && (
                  <Badge className="bg-green-100 text-green-800">Disponible</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Livraisons effectuées</span>
                <span className="font-semibold">{driver.totalDeliveries}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Note moyenne</span>
                <span className="font-semibold">{driver.rating.toFixed(1)}/5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Avis reçus</span>
                <span className="font-semibold">{driver.totalReviews}</span>
              </div>
            </CardContent>
          </Card>

          {/* Vehicles */}
          {driver.vehicleTypes.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Véhicules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {driver.vehicleTypes.map((type) => (
                    <Badge key={type} variant="outline">{vehicleLabels[type]}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          <Card>
            <CardHeader>
              <CardTitle>À propos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">
                {driver.bio || "Pas de description disponible"}
              </p>
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Avis récents ({driver.totalReviews})</CardTitle>
            </CardHeader>
            <CardContent>
              {recentReviews.length > 0 ? (
                <div className="space-y-4">
                  {recentReviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {review.createdAt.toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Aucun avis pour le moment
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
