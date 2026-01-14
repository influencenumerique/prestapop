import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Truck, MapPin, Package, Clock, ArrowRight, Users, Plus, Navigation, Zap, TrendingUp, Eye } from "lucide-react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { type FeedbackTag } from "@/components/driver-feedback-tags"
import { type BadgeType } from "@/components/driver-badges"
import { FeaturedDriversSection } from "@/components/featured-drivers-section"

const volumeLabels: Record<string, string> = {
  CUBE_6M: "6m³",
  CUBE_9M: "9m³",
  CUBE_12M: "12m³",
  CUBE_15M: "15m³",
  CUBE_20M: "20m³",
}

const vehicleTypes = [
  { name: "Vélo cargo", slug: "BIKE", icon: "🚲", description: "Petits colis urbains" },
  { name: "Scooter", slug: "SCOOTER", icon: "🛵", description: "Livraisons rapides" },
  { name: "Voiture", slug: "CAR", icon: "🚗", description: "Colis moyens" },
  { name: "Utilitaire", slug: "VAN", icon: "🚐", description: "Volumes importants" },
  { name: "Camion", slug: "TRUCK", icon: "🚚", description: "Gros volumes" },
]


// Missions fictives pour affichage
const featuredJobs = [
  {
    id: "demo-job-1",
    title: "Tournée express Paris 11e, 12e, 20e",
    secteurLivraison: "Paris 11e, 12e, 20e",
    nombreColis: 45,
    dayRate: 15000,
    vehicleVolume: "CUBE_6M",
    missionZoneType: "URBAN",
    typeMission: "DAY",
    company: "LogiExpress",
    startTime: new Date().toISOString(),
    isUrgent: true,
    urgentBonus: 50,
  },
  {
    id: "demo-job-2",
    title: "Livraison inter-urbain Nanterre - Versailles",
    secteurLivraison: "Nanterre - Versailles - Saint-Cloud",
    nombreColis: 28,
    dayRate: 18000,
    vehicleVolume: "CUBE_9M",
    missionZoneType: "CITY_TO_CITY",
    typeMission: "DAY",
    company: "TransportPro",
    startTime: new Date().toISOString(),
    isUrgent: false,
  },
  {
    id: "demo-job-3",
    title: "Tournée Rungis - Paris Sud",
    secteurLivraison: "Rungis - Ivry - Kremlin-Bicêtre",
    nombreColis: 72,
    dayRate: 20000,
    vehicleVolume: "CUBE_12M",
    missionZoneType: "URBAN",
    typeMission: "DAY",
    company: "FreshLog",
    startTime: new Date().toISOString(),
    isUrgent: false,
  },
]

// Chauffeurs fictifs pour l'affichage entreprise (style Airbnb)
const featuredDrivers = [
  {
    id: "1",
    name: "Marc D.",
    city: "Paris 11e",
    rating: 4.9,
    reviewCount: 47,
    totalDeliveries: 156,
    yearsExperience: 5,
    vehicleTypes: ["VAN", "TRUCK"],
    vehicleDetails: "Renault Master 12m³",
    bio: "Chauffeur-livreur expérimenté. Ponctuel, soigneux et professionnel. Spécialisé e-commerce et produits fragiles.",
    availability: "immediate",
    verified: true,
    superDriver: true,
    topTags: [
      { tag: "PUNCTUAL" as FeedbackTag, percentage: 89 },
      { tag: "CAREFUL" as FeedbackTag, percentage: 85 },
      { tag: "PROFESSIONAL" as FeedbackTag, percentage: 82 },
    ],
    badges: ["PUNCTUALITY_CHAMPION", "FIRST_100_DELIVERIES", "TOP_3_REGION"] as BadgeType[],
    regionalRanking: { position: 3, region: "Paris" },
  },
  {
    id: "2",
    name: "Sophie M.",
    city: "Lyon 3e",
    rating: 4.8,
    reviewCount: 89,
    totalDeliveries: 243,
    yearsExperience: 7,
    vehicleTypes: ["CAR", "VAN"],
    vehicleDetails: "Peugeot Partner 6m³",
    bio: "Spécialisée livraison fragile et produits frais. Permis transport frigorifique. Très organisée.",
    availability: "tomorrow",
    verified: true,
    superDriver: true,
    topTags: [
      { tag: "CAREFUL" as FeedbackTag, percentage: 94 },
      { tag: "COMMUNICATIVE" as FeedbackTag, percentage: 88 },
      { tag: "RELIABLE" as FeedbackTag, percentage: 86 },
    ],
    badges: ["CAREFUL_EXPERT", "COMMUNICATION_STAR", "FIRST_100_DELIVERIES", "FIRST_500_DELIVERIES"] as BadgeType[],
    regionalRanking: { position: 1, region: "Lyon" },
  },
  {
    id: "3",
    name: "Ahmed B.",
    city: "Paris 20e",
    rating: 4.7,
    reviewCount: 32,
    totalDeliveries: 189,
    yearsExperience: 3,
    vehicleTypes: ["BIKE", "SCOOTER"],
    vehicleDetails: "Vélo cargo électrique",
    bio: "Expert livraison urbaine rapide et écologique. Idéal centre-ville et zones piétonnes.",
    availability: "immediate",
    verified: true,
    superDriver: false,
    topTags: [
      { tag: "FAST" as FeedbackTag, percentage: 92 },
      { tag: "RESPONSIVE" as FeedbackTag, percentage: 87 },
      { tag: "FRIENDLY" as FeedbackTag, percentage: 84 },
    ],
    badges: ["SPEED_DEMON", "FIRST_100_DELIVERIES", "RISING_STAR"] as BadgeType[],
    regionalRanking: { position: 7, region: "Paris" },
  },
  {
    id: "4",
    name: "Fatou D.",
    city: "Nanterre",
    rating: 5.0,
    reviewCount: 28,
    totalDeliveries: 98,
    yearsExperience: 4,
    vehicleTypes: ["VAN"],
    vehicleDetails: "Citroën Jumpy 9m³",
    bio: "Chauffeure professionnelle et souriante. Excellente relation client. Livraison soignée garantie.",
    availability: "in_3_days",
    verified: true,
    superDriver: true,
    topTags: [
      { tag: "FRIENDLY" as FeedbackTag, percentage: 96 },
      { tag: "PROFESSIONAL" as FeedbackTag, percentage: 93 },
      { tag: "PUNCTUAL" as FeedbackTag, percentage: 90 },
    ],
    badges: ["PERFECT_RATING", "COMMUNICATION_STAR", "RISING_STAR"] as BadgeType[],
    regionalRanking: { position: 2, region: "Île-de-France Ouest" },
  },
]

export default async function HomePage() {
  // Déterminer le rôle de l'utilisateur connecté
  const session = await auth()
  let userRole: "company" | "driver" | "guest" = "guest"

  if (session?.user) {
    try {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { company: true, driverProfile: true },
      })
      if (user?.company) {
        userRole = "company"
      } else if (user?.driverProfile) {
        userRole = "driver"
      }
    } catch (error) {
      console.error("Error fetching user role:", error)
      // Continue with guest role if DB query fails
    }
  }

  // Vue ENTREPRISE
  if (userRole === "company") {
    return (
      <div className="flex flex-col">
        {/* Hero Section - Entreprise */}
        <section className="relative py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container mx-auto text-center">
            <Badge className="mb-4" variant="secondary">
              <Truck className="h-3 w-3 mr-1" />
              Espace Entreprise
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Trouvez des chauffeurs
              <br />
              <span className="text-primary">près de chez vous</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Des chauffeurs-livreurs vérifiés, notés par d&apos;autres entreprises,
              disponibles immédiatement pour vos livraisons.
            </p>

            {/* CTA Entreprise */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link href="/drivers">
                <Button size="lg" className="rounded-full px-8 gap-2 w-full sm:w-auto">
                  <Users className="h-5 w-5" />
                  Trouver des chauffeurs
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="rounded-full px-8 gap-2 w-full sm:w-auto">
                  <Plus className="h-5 w-5" />
                  Publier une mission
                </Button>
              </Link>
            </div>

            {/* Barre de recherche */}
            <div className="relative w-full max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Rechercher un chauffeur (ville, véhicule...)"
                className="h-12 w-full rounded-full border bg-background pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </section>

        {/* Stats Entreprise */}
        <section className="py-12 border-y bg-muted/30">
          <div className="container mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Chauffeurs vérifiés</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">24h</div>
                <div className="text-sm text-muted-foreground">Délai moyen de réponse</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">98%</div>
                <div className="text-sm text-muted-foreground">Taux de satisfaction</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">4.8/5</div>
                <div className="text-sm text-muted-foreground">Note moyenne</div>
              </div>
            </div>
          </div>
        </section>

        {/* Types de véhicules disponibles */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">Chauffeurs par type de véhicule</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
              Trouvez le chauffeur avec le véhicule adapté à votre besoin
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {vehicleTypes.map((vehicle) => (
                <div key={vehicle.slug} className="w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] lg:w-[calc(20%-13px)]">
                  <Card className="h-full">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-3">{vehicle.icon}</div>
                      <h3 className="font-medium">{vehicle.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{vehicle.description}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Chauffeurs disponibles - Style Airbnb */}
        <FeaturedDriversSection drivers={featuredDrivers} />

        {/* Comment ça marche - Entreprise */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Comment recruter un chauffeur ?</h2>
            <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">1</div>
                <h3 className="font-semibold mb-2">Publiez une mission</h3>
                <p className="text-sm text-muted-foreground">Décrivez votre besoin de livraison</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">2</div>
                <h3 className="font-semibold mb-2">Recevez des candidatures</h3>
                <p className="text-sm text-muted-foreground">Chauffeurs qualifiés postulent</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">3</div>
                <h3 className="font-semibold mb-2">Choisissez le meilleur</h3>
                <p className="text-sm text-muted-foreground">Comparez profils et notes</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">4</div>
                <h3 className="font-semibold mb-2">Mission réalisée</h3>
                <p className="text-sm text-muted-foreground">Paiement sécurisé</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 px-4 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Publiez votre première mission</h2>
            <p className="text-lg mb-10 max-w-2xl mx-auto opacity-90">
              Trouvez le chauffeur idéal pour vos livraisons en quelques minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto gap-2 px-8">
                  <Plus className="h-5 w-5" />
                  Créer une mission
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/drivers">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary gap-2 px-8"
                >
                  <Users className="h-5 w-5" />
                  Parcourir les chauffeurs
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    )
  }

  // Vue CHAUFFEUR ou VISITEUR (par défaut)
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto text-center">
          <Badge className="mb-4" variant="secondary">
            <Truck className="h-3 w-3 mr-1" />
            {userRole === "driver" ? "Espace Chauffeur" : "Transport urbain B2B"}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            {userRole === "driver" ? (
              <>
                Trouvez vos missions
                <br />
                <span className="text-primary">de livraison</span>
              </>
            ) : (
              <>
                Vos livraisons urbaines
                <br />
                <span className="text-primary">en un clic</span>
              </>
            )}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {userRole === "driver"
              ? "Consultez les missions disponibles et postulez en un clic. Gérez votre planning en toute liberté."
              : "PrestaPop connecte les entreprises de transport et e-commerce avec des chauffeurs-livreurs indépendants qualifiés pour vos missions de livraison."}
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            {userRole === "driver" ? (
              <>
                <Link href="/jobs">
                  <Button size="lg" className="rounded-full px-8 gap-2 w-full sm:w-auto">
                    <Package className="h-5 w-5" />
                    Voir les missions disponibles
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="rounded-full px-8 gap-2 w-full sm:w-auto">
                    Mon tableau de bord
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/jobs">
                  <Button size="lg" className="rounded-full px-8 gap-2 w-full sm:w-auto">
                    <Package className="h-5 w-5" />
                    Voir les missions disponibles
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/register?type=company">
                  <Button size="lg" variant="outline" className="rounded-full px-8 gap-2 w-full sm:w-auto">
                    <Truck className="h-5 w-5" />
                    Publier une mission
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Barre de recherche */}
          <div className="relative w-full max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Rechercher une mission (ville, type...)"
              className="h-12 w-full rounded-full border bg-background pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Chauffeurs actifs</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">10K+</div>
              <div className="text-sm text-muted-foreground">Livraisons/mois</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">98%</div>
              <div className="text-sm text-muted-foreground">Livraisons à l&apos;heure</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">4.8/5</div>
              <div className="text-sm text-muted-foreground">Note moyenne</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================= */}
      {/* SECTION MISSIONS DISPONIBLES - En premier */}
      {/* ============================================= */}
      <section className="py-16 px-4 bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/30 dark:to-background">
        <div className="container mx-auto">
          {/* Header centré */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700">
                <Package className="h-3 w-3 mr-1" />
                Missions disponibles
              </Badge>
              {/* Indicateur temps réel */}
              <div className="flex items-center gap-2 bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                3 missions urgentes
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-2">Gagnez de l&apos;argent dès aujourd&apos;hui</h2>
            <p className="text-muted-foreground">Postulez maintenant - places limitées</p>
          </div>

          {/* Grille des 3 missions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {featuredJobs.map((job, index) => (
              <Link key={job.id} href={userRole === "guest" ? "/register?type=driver" : `/jobs/${job.id}`}>
                <Card className={`overflow-hidden hover:shadow-xl transition-all h-full group border-2 relative ${
                  job.isUrgent ? 'border-red-500/50 hover:border-red-500' : 'border-transparent hover:border-emerald-500'
                }`}>
                  {/* Badge URGENT */}
                  {job.isUrgent && (
                    <div className="absolute top-3 right-3 z-10 animate-urgent-pulse">
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 px-3 py-1.5 font-bold shadow-lg shadow-red-500/50">
                        <Zap className="h-3 w-3 mr-1" />
                        URGENT +{job.urgentBonus}€
                      </Badge>
                    </div>
                  )}

                  {/* Badge position */}
                  <div className="absolute top-3 left-3 z-10">
                    <Badge variant="secondary" className="bg-white/90 dark:bg-slate-800/90 font-bold">
                      #{index + 1}
                    </Badge>
                  </div>

                  <CardContent className="p-6 pt-12">
                    <div className="flex items-start justify-between mb-4">
                      <Badge
                        className="text-sm px-3 py-1.5 font-semibold"
                        variant={job.missionZoneType === "URBAN" ? "default" : "destructive"}
                      >
                        {job.missionZoneType === "URBAN" ? (
                          <>
                            <MapPin className="h-3.5 w-3.5 mr-1" />
                            URBAIN
                          </>
                        ) : (
                          <>
                            <Truck className="h-3.5 w-3.5 mr-1" />
                            INTER-URBAIN
                          </>
                        )}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-lg line-clamp-2 mb-4 group-hover:text-emerald-600 transition-colors">
                      {job.title}
                    </h3>

                    <div className="space-y-2.5 text-sm mb-5">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{job.secteurLivraison}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{job.nombreColis} colis</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>Départ: {new Date(job.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-end pt-4 border-t">
                      <Badge variant="outline" className="font-medium">
                        {volumeLabels[job.vehicleVolume]}
                      </Badge>
                      <div className={`text-right px-4 py-2 rounded-lg shadow-lg transition-all ${
                        job.isUrgent
                          ? 'bg-gradient-to-r from-orange-500 to-red-600 shadow-red-500/30 scale-105'
                          : 'bg-gradient-to-r from-emerald-500 to-green-600'
                      } text-white`}>
                        <div className="text-[10px] uppercase tracking-wide opacity-90">Gagnez</div>
                        <span className="text-2xl font-black">
                          {(job.dayRate / 100 + (job.urgentBonus || 0)).toFixed(0)}€
                        </span>
                        <div className="text-[10px] opacity-90">/jour</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* CTA unique - Uniquement pour les visiteurs */}
          {userRole === "guest" && (
            <div className="text-center">
              <Link href="/register?type=driver">
                <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700 font-bold px-10 py-6 text-lg">
                  <Navigation className="h-5 w-5" />
                  Voir les missions autour de moi
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground mt-3">
                Inscription gratuite - Commencez à gagner aujourd&apos;hui
              </p>
            </div>
          )}

          {/* Pour les chauffeurs connectés */}
          {userRole === "driver" && (
            <div className="text-center">
              <Link href="/jobs">
                <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700 font-bold px-10">
                  Voir toutes les missions
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Social Proof - Témoignages */}
      <section className="py-16 px-4 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-yellow-500/20 border-yellow-500/30 text-yellow-300" variant="outline">
              <span className="mr-1">🚀</span>
              RÉSULTATS RÉELS
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Ils ont optimisé leurs livraisons
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Découvrez comment nos clients ont amélioré leur logistique avec PrestaPop
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Témoignage 1 - Économies */}
            <Card className="bg-slate-800/50 border-slate-700 hover:border-yellow-500/50 transition-all hover:shadow-xl hover:shadow-yellow-500/10 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400 text-lg">★</span>
                    ))}
                  </div>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                    -35%
                  </Badge>
                </div>
                <blockquote className="text-slate-200 mb-4 text-sm leading-relaxed">
                  &quot;PrestaPop nous a fait économiser <span className="text-yellow-400 font-bold">35% sur nos livraisons urgentes</span>.
                  La flexibilité des chauffeurs indépendants est un vrai plus.&quot;
                </blockquote>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                    EC
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">ExpressColis</div>
                    <div className="text-xs text-slate-400">E-commerce • 1 semaine</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Témoignage 2 - Missions complétées */}
            <Card className="bg-slate-800/50 border-slate-700 hover:border-yellow-500/50 transition-all hover:shadow-xl hover:shadow-yellow-500/10 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400 text-lg">★</span>
                    ))}
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                    150 missions
                  </Badge>
                </div>
                <blockquote className="text-slate-200 mb-4 text-sm leading-relaxed">
                  &quot;<span className="text-yellow-400 font-bold">150 missions complétées en 7 jours</span>.
                  Interface simple, paiements rapides. Exactement ce qu&apos;il nous fallait.&quot;
                </blockquote>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                    TP
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">Transporteur Pro</div>
                    <div className="text-xs text-slate-400">Transport • 1 semaine</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Témoignage 3 - CA Commissions */}
            <Card className="bg-slate-800/50 border-slate-700 hover:border-yellow-500/50 transition-all hover:shadow-xl hover:shadow-yellow-500/10 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400 text-lg">★</span>
                    ))}
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                    +12K€
                  </Badge>
                </div>
                <blockquote className="text-slate-200 mb-4 text-sm leading-relaxed">
                  &quot;<span className="text-yellow-400 font-bold">CA +12K€ en commissions</span> en une semaine.
                  Les chauffeurs sont réactifs et les clients satisfaits.&quot;
                </blockquote>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    LT
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">LogiTrans</div>
                    <div className="text-xs text-slate-400">Logistique • 1 semaine</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trust badge */}
          <div className="text-center mt-12">
            <p className="text-slate-400 text-sm">
              <span className="text-yellow-400 font-semibold">+200 entreprises</span> nous font confiance
            </p>
          </div>
        </div>
      </section>

      {/* Types de zones de mission */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Choisissez votre type de mission</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Missions urbaines ou inter-urbaines, adaptées à vos besoins de livraison
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* URBAN */}
            <Card className="overflow-hidden hover:shadow-xl transition-all group border-2 hover:border-primary h-full">
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-4">
                  <Badge className="text-sm px-3 py-1" variant="default">
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    URBAIN
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold mb-3">Livraisons urbaines</h3>
                <p className="text-muted-foreground mb-6">
                  Tournées intra-ville pour livraisons rapides et nombreuses dans un même secteur
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    <span>Livraisons dans un même secteur</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    <span>Nombreux points de livraison</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    <span>Circuits optimisés</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CITY_TO_CITY */}
            <Card className="overflow-hidden hover:shadow-xl transition-all group border-2 hover:border-destructive h-full">
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-4">
                  <Badge className="text-sm px-3 py-1" variant="destructive">
                    <Truck className="h-3.5 w-3.5 mr-1" />
                    INTER-URBAIN
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold mb-3">Livraisons inter-urbaines</h3>
                <p className="text-muted-foreground mb-6">
                  Liaisons entre villes pour livraisons longue distance et volumes importants
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-destructive">✓</span>
                    <span>Liaisons entre villes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-destructive">✓</span>
                    <span>Volumes importants</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-destructive">✓</span>
                    <span>Trajets optimisés</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Vehicle Types */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Tous types de véhicules</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Du vélo cargo au camion, trouvez la mission adaptée à votre véhicule
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {vehicleTypes.map((vehicle) => (
              <div key={vehicle.slug} className="w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] lg:w-[calc(20%-13px)]">
                <Card className="h-full">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{vehicle.icon}</div>
                    <h3 className="font-medium">{vehicle.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{vehicle.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================= */}
      {/* SECTION ENTREPRISES - Fond bleu foncé */}
      {/* ============================================= */}
      {userRole === "guest" && (
        <section className="py-6 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 border-y-4 border-blue-600 shadow-lg">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-4">
              <div className="hidden md:block h-[2px] w-16 bg-gradient-to-r from-transparent to-blue-400"></div>
              <Users className="h-7 w-7 text-blue-300" />
              <h2 className="text-2xl font-black text-white tracking-wider uppercase">Espace Entreprises</h2>
              <Users className="h-7 w-7 text-blue-300" />
              <div className="hidden md:block h-[2px] w-16 bg-gradient-to-l from-transparent to-blue-400"></div>
            </div>
            <p className="text-center text-blue-200 text-sm mt-2">Recrutez des chauffeurs qualifiés pour vos livraisons</p>
          </div>
        </section>
      )}

      {/* Chauffeurs disponibles - pour entreprises */}
      {userRole === "guest" && (
        <FeaturedDriversSection drivers={featuredDrivers} />
      )}

      {/* ============================================= */}
      {/* SEPARATEUR VISUEL */}
      {/* ============================================= */}
      {userRole === "guest" && (
        <div className="py-8 bg-gradient-to-b from-slate-800 to-slate-100">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-4">
              <div className="h-[1px] flex-1 max-w-[100px] bg-gradient-to-r from-transparent to-slate-400"></div>
              <span className="text-slate-500 text-sm font-medium">OU</span>
              <div className="h-[1px] flex-1 max-w-[100px] bg-gradient-to-l from-transparent to-slate-400"></div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================= */}
      {/* SECTION CHAUFFEURS - Fond vert */}
      {/* ============================================= */}
      {userRole === "guest" && (
        <section className="py-6 bg-gradient-to-r from-green-700 via-emerald-600 to-green-700 border-y-4 border-green-500 shadow-lg">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-4">
              <div className="hidden md:block h-[2px] w-16 bg-gradient-to-r from-transparent to-green-300"></div>
              <Package className="h-7 w-7 text-green-200" />
              <h2 className="text-2xl font-black text-white tracking-wider uppercase">Espace Chauffeurs</h2>
              <Package className="h-7 w-7 text-green-200" />
              <div className="hidden md:block h-[2px] w-16 bg-gradient-to-l from-transparent to-green-300"></div>
            </div>
            <p className="text-center text-green-100 text-sm mt-2">Trouvez des missions et gagnez de l&apos;argent</p>
          </div>
        </section>
      )}

      {/* Comment ça marche - Pour chauffeurs */}
      <section className="py-16 px-4 bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700">
              <Package className="h-3 w-3 mr-1" />
              Pour les chauffeurs
            </Badge>
            <h2 className="text-3xl font-bold mb-2">Comment devenir chauffeur PrestaPop ?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Inscription gratuite en 2 minutes, commencez à gagner de l&apos;argent dès aujourd&apos;hui
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">1</div>
              <h3 className="font-semibold mb-2">Inscrivez-vous</h3>
              <p className="text-sm text-muted-foreground">Créez votre profil gratuitement</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">2</div>
              <h3 className="font-semibold mb-2">Trouvez des missions</h3>
              <p className="text-sm text-muted-foreground">Parcourez les offres près de vous</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">3</div>
              <h3 className="font-semibold mb-2">Postulez</h3>
              <p className="text-sm text-muted-foreground">Candidatez en un clic</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">4</div>
              <h3 className="font-semibold mb-2">Soyez payé</h3>
              <p className="text-sm text-muted-foreground">Paiement rapide sous 24h</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      {userRole === "guest" && (
        <section className="py-16 px-4 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Prêt à démarrer ?</h2>
            <p className="text-lg mb-8 max-w-xl mx-auto opacity-90">
              Inscription gratuite en 2 minutes
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="gap-2 px-10 font-bold">
                Créer mon compte
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
