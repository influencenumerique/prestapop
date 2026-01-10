import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Truck, MapPin, Package, Clock, ArrowRight, Users, Plus } from "lucide-react"
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

// Fonction pour formater le nom (prénom + initiale du nom)
function formatDriverName(fullName: string): string {
  const parts = fullName.trim().split(" ")
  if (parts.length === 1) return parts[0]
  const firstName = parts[0]
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase()
  return `${firstName} ${lastInitial}.`
}

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
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { company: true, driverProfile: true },
    })
    if (user?.company) {
      userRole = "company"
    } else if (user?.driverProfile) {
      userRole = "driver"
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
            <p className="text-center text-green-100 text-sm mt-2">Trouvez des missions et gagnez de l'argent</p>
          </div>
        </section>
      )}

      {/* Featured Jobs - pour chauffeurs */}
      <section className="py-16 px-4 bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-background">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
            <div>
              <Badge className="mb-2 bg-green-100 text-green-700 border-green-300">
                <Package className="h-3 w-3 mr-1" />
                Pour les chauffeurs
              </Badge>
              <h2 className="text-3xl font-bold">Missions disponibles</h2>
              <p className="text-muted-foreground">Postulez et gagnez de l'argent</p>
            </div>
            <Link href="/jobs">
              <Button variant="default" className="gap-2 bg-green-600 hover:bg-green-700">
                Voir toutes les missions
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-all h-full group border hover:border-primary">
                  <CardContent className="p-6">
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
                      <Badge variant="secondary" className="text-xs">Entreprise verifiee</Badge>
                    </div>

                    <h3 className="font-bold text-lg line-clamp-2 mb-4 group-hover:text-primary transition-colors">
                      {job.title}
                    </h3>

                    <div className="space-y-2.5 text-sm mb-5">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
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
                      <div className="text-right bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg">
                        <div className="text-[10px] uppercase tracking-wide opacity-90">Gagnez</div>
                        <span className="text-2xl font-black">
                          {(job.dayRate / 100).toFixed(0)}€
                        </span>
                        <div className="text-[10px] opacity-90">/jour</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {userRole === "guest" && (
        <section className="py-20 px-4 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground">
          <div className="container mx-auto text-center">
            <Badge className="mb-4 bg-white/20 border-white/30 text-white" variant="outline">
              <Truck className="h-3 w-3 mr-1" />
              Rejoignez la communauté PrestaPop
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Prêt à démarrer ?</h2>
            <p className="text-lg mb-10 max-w-2xl mx-auto opacity-90">
              Que vous soyez entreprise ou chauffeur-livreur indépendant,
              <br />
              optimisez vos livraisons urbaines et inter-urbaines dès maintenant.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register?type=company">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto gap-2 px-8">
                  <Truck className="h-5 w-5" />
                  Je suis une entreprise
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/register?type=driver">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary gap-2 px-8"
                >
                  <Package className="h-5 w-5" />
                  Je suis chauffeur-livreur
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <p className="mt-8 text-sm opacity-75">
              Inscription gratuite - Aucune carte bancaire requise
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
