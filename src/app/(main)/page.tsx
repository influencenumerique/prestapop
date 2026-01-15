import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, MapPin, Package, Clock, ArrowRight, Users, Plus, Lock, Zap, Building2 } from "lucide-react"
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
    }
  }

  // Vue ENTREPRISE (connectée)
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/dashboard">
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
          </div>
        </section>

        {/* Chauffeurs disponibles */}
        <FeaturedDriversSection drivers={featuredDrivers} />

        {/* CTA Final */}
        <section className="py-20 px-4 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Publiez votre première mission</h2>
            <p className="text-lg mb-10 max-w-2xl mx-auto opacity-90">
              Trouvez le chauffeur idéal pour vos livraisons en quelques minutes.
            </p>
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="gap-2 px-8">
                <Plus className="h-5 w-5" />
                Créer une mission
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </div>
    )
  }

  // Vue CHAUFFEUR (connecté)
  if (userRole === "driver") {
    return (
      <div className="flex flex-col">
        {/* Hero Section - Chauffeur */}
        <section className="relative py-20 px-4 bg-gradient-to-br from-emerald-500/10 via-background to-background">
          <div className="container mx-auto text-center">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-300">
              <Package className="h-3 w-3 mr-1" />
              Espace Chauffeur
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Trouvez vos missions
              <br />
              <span className="text-emerald-600">de livraison</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Consultez les missions disponibles et postulez en un clic. Gérez votre planning en toute liberté.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/jobs">
                <Button size="lg" className="rounded-full px-8 gap-2 w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
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
            </div>
          </div>
        </section>

        {/* Missions disponibles */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10">Missions du moment</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {featuredJobs.map((job) => (
                <Link key={job.id} href="/jobs">
                  <Card className="overflow-hidden hover:shadow-xl transition-all h-full group border-2 hover:border-emerald-500">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <Badge variant={job.missionZoneType === "URBAN" ? "default" : "destructive"}>
                          {job.missionZoneType === "URBAN" ? "URBAIN" : "INTER-URBAIN"}
                        </Badge>
                        {job.isUrgent && (
                          <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0">
                            <Zap className="h-3 w-3 mr-1" />
                            URGENT
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-lg mb-4 group-hover:text-emerald-600 transition-colors">
                        {job.title}
                      </h3>
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{job.secteurLivraison}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{job.nombreColis} colis</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t">
                        <Badge variant="outline">{volumeLabels[job.vehicleVolume]}</Badge>
                        <span className="text-xl font-bold text-emerald-600">
                          {(job.dayRate / 100 + (job.urgentBonus || 0)).toFixed(0)}€/jour
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="text-center">
              <Link href="/jobs">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  Voir toutes les missions
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    )
  }

  // =============================================
  // VUE VISITEUR (non connecté) - 4 SECTIONS
  // =============================================
  return (
    <div className="flex flex-col">
      {/* ========== SECTION 1: HERO ========== */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto text-center">
          <Badge className="mb-4" variant="secondary">
            <Truck className="h-3 w-3 mr-1" />
            Transport urbain B2B
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Vos livraisons urbaines
            <br />
            <span className="text-primary">en un clic</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            PrestaPop connecte les entreprises de transport et e-commerce avec des chauffeurs-livreurs indépendants qualifiés pour vos missions de livraison.
          </p>

          {/* 2 CTAs principaux */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register?type=company">
              <Button size="lg" className="rounded-full px-8 gap-2 w-full sm:w-auto min-w-[220px]">
                <Building2 className="h-5 w-5" />
                Je suis entreprise
              </Button>
            </Link>
            <Link href="/register?type=driver">
              <Button size="lg" variant="outline" className="rounded-full px-8 gap-2 w-full sm:w-auto min-w-[220px] border-emerald-500 text-emerald-600 hover:bg-emerald-50">
                <Truck className="h-5 w-5" />
                Je suis chauffeur
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========== SECTION 2: COMMENT ÇA MARCHE ========== */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Comment ça marche ?</h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Colonne Entreprises */}
            <Card className="border-2 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-blue-700 dark:text-blue-400">Entreprises</h3>
                </div>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">1</div>
                    <div>
                      <p className="font-semibold">Postez votre mission</p>
                      <p className="text-sm text-muted-foreground">Décrivez vos besoins de livraison</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">2</div>
                    <div>
                      <p className="font-semibold">Sélectionnez un chauffeur qualifié</p>
                      <p className="text-sm text-muted-foreground">Comparez les profils et les notes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">3</div>
                    <div>
                      <p className="font-semibold">Suivez la livraison en temps réel</p>
                      <p className="text-sm text-muted-foreground">GPS tracking et notifications</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Colonne Chauffeurs */}
            <Card className="border-2 border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center">
                    <Truck className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">Chauffeurs</h3>
                </div>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">1</div>
                    <div>
                      <p className="font-semibold">Consultez les missions disponibles</p>
                      <p className="text-sm text-muted-foreground">Missions près de chez vous</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">2</div>
                    <div>
                      <p className="font-semibold">Postulez en 1 clic</p>
                      <p className="text-sm text-muted-foreground">Candidature rapide et simple</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">3</div>
                    <div>
                      <p className="font-semibold">Livrez et encaissez rapidement</p>
                      <p className="text-sm text-muted-foreground">Paiement sécurisé sous 24h</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ========== SECTION 3: MISSIONS EN APERÇU (VERROUILLÉES) ========== */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-300">
              <Package className="h-3 w-3 mr-1" />
              Missions disponibles
            </Badge>
            <h2 className="text-3xl font-bold mb-2">Des missions vous attendent</h2>
            <p className="text-muted-foreground">Inscrivez-vous pour accéder aux détails et postuler</p>
          </div>

          {/* Grille des 3 missions verrouillées */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {featuredJobs.map((job) => (
              <div key={job.id} className="relative group">
                <Card className="overflow-hidden h-full border-2 border-slate-200 dark:border-slate-700">
                  <CardContent className="p-6 relative">
                    {/* Overlay flou + cadenas */}
                    <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                      <div className="w-14 h-14 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3">
                        <Lock className="h-7 w-7 text-slate-500" />
                      </div>
                      <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 px-4 py-2">
                        Inscrivez-vous pour postuler
                      </Badge>
                    </div>

                    {/* Contenu flouté (visible mais non cliquable) */}
                    <div className="opacity-60">
                      <div className="flex items-start justify-between mb-4">
                        <Badge variant={job.missionZoneType === "URBAN" ? "default" : "destructive"}>
                          {job.missionZoneType === "URBAN" ? "URBAIN" : "INTER-URBAIN"}
                        </Badge>
                        {job.isUrgent && (
                          <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0">
                            <Zap className="h-3 w-3 mr-1" />
                            URGENT
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-lg mb-4">{job.title}</h3>
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{job.secteurLivraison}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{job.nombreColis} colis</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Mission journée</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t">
                        <Badge variant="outline">{volumeLabels[job.vehicleVolume]}</Badge>
                        <span className="text-xl font-bold text-emerald-600">
                          {(job.dayRate / 100 + (job.urgentBonus || 0)).toFixed(0)}€/jour
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link href="/register?type=driver">
              <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700 font-bold px-10">
                <Package className="h-5 w-5" />
                Voir toutes les missions
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========== SECTION 4: CTA FINAL ========== */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Prêt à démarrer ?</h2>
          <p className="text-lg mb-10 max-w-xl mx-auto opacity-90">
            Inscription gratuite - Aucune carte bancaire requise
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register?type=company">
              <Button size="lg" variant="secondary" className="gap-2 px-8 min-w-[220px]">
                <Building2 className="h-5 w-5" />
                Inscription entreprise
              </Button>
            </Link>
            <Link href="/register?type=driver">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 px-8 min-w-[220px] bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary"
              >
                <Truck className="h-5 w-5" />
                Inscription chauffeur
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
