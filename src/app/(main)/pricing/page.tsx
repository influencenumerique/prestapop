"use client"

import { useState, useEffect, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { PricingCard } from "@/components/subscription/pricing-card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Truck, Building2 } from "lucide-react"
import { toast } from "sonner"

interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  description: string | null
  tier: string
  targetRole: string
  priceMonthly: number
  priceYearly: number
  maxMissionsPerMonth: number | null
  maxApplicationsPerMonth: number | null
  commissionRate: number
  features: Record<string, boolean | string | number>
  isPopular: boolean
}

function SubscriptionMessage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const subscription = searchParams.get("subscription")
    if (subscription === "success") {
      toast.success("Félicitations ! Votre abonnement est maintenant actif.")
      router.replace("/pricing")
    } else if (subscription === "cancelled") {
      toast.info("Vous avez annulé le processus d'abonnement.")
      router.replace("/pricing")
    }
  }, [searchParams, router])

  return null
}

function PricingContent() {
  const { data: session } = useSession()
  const router = useRouter()

  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [billingInterval, setBillingInterval] = useState<"MONTHLY" | "YEARLY">("MONTHLY")
  const [currentSubscription, setCurrentSubscription] = useState<{
    planId: string
    tier: string
  } | null>(null)

  // Charger les plans
  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch("/api/subscriptions/plans")
        const data = await response.json()
        setPlans(data.plans || [])
      } catch (error) {
        console.error("Error fetching plans:", error)
        toast.error("Erreur lors du chargement des plans")
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [])

  // Charger l'abonnement actuel
  useEffect(() => {
    async function fetchCurrentSubscription() {
      if (!session?.user) return

      try {
        const response = await fetch("/api/subscriptions/current")
        const data = await response.json()
        if (data.subscription) {
          setCurrentSubscription({
            planId: data.plan.id,
            tier: data.tier,
          })
        }
      } catch (error) {
        console.error("Error fetching subscription:", error)
      }
    }

    fetchCurrentSubscription()
  }, [session])

  const handleSelectPlan = async (planId: string) => {
    if (!session?.user) {
      toast.error("Veuillez vous connecter pour souscrire à un abonnement")
      router.push("/login?redirect=/pricing")
      return
    }

    const plan = plans.find((p) => p.id === planId)
    if (!plan || plan.tier === "FREE") return

    setSelectedPlanId(planId)

    try {
      const response = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingInterval }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création du checkout")
      }

      // Rediriger vers Stripe Checkout
      window.location.href = data.checkoutUrl
    } catch (error) {
      console.error("Error creating checkout:", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors du paiement")
    } finally {
      setSelectedPlanId(null)
    }
  }

  const driverPlans = plans.filter((p) => p.targetRole === "DRIVER")
  const companyPlans = plans.filter((p) => p.targetRole === "COMPANY")

  // Déterminer l'onglet par défaut selon le rôle
  const defaultTab = session?.user?.role === "COMPANY" ? "company" : "driver"

  if (loading) {
    return (
      <div className="container max-w-6xl py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Chargement des plans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Choisissez votre plan
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Des tarifs simples et transparents. Commencez gratuitement et évoluez selon vos besoins.
        </p>
      </div>

      {/* Toggle Mensuel/Annuel */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <Label
          htmlFor="billing-toggle"
          className={billingInterval === "MONTHLY" ? "font-semibold" : "text-muted-foreground"}
        >
          Mensuel
        </Label>
        <Switch
          id="billing-toggle"
          checked={billingInterval === "YEARLY"}
          onCheckedChange={(checked: boolean) =>
            setBillingInterval(checked ? "YEARLY" : "MONTHLY")
          }
        />
        <Label
          htmlFor="billing-toggle"
          className={billingInterval === "YEARLY" ? "font-semibold" : "text-muted-foreground"}
        >
          Annuel
          <span className="ml-2 text-xs text-green-600 font-medium">
            -17%
          </span>
        </Label>
      </div>

      {/* Tabs Chauffeurs / Entreprises */}
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
          <TabsTrigger value="driver" className="gap-2">
            <Truck className="h-4 w-4" />
            Chauffeurs
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" />
            Entreprises
          </TabsTrigger>
        </TabsList>

        <TabsContent value="driver">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Plan Gratuit Chauffeur */}
            <PricingCard
              plan={{
                id: "free-driver",
                name: "Gratuit",
                slug: "driver-free",
                description: "Pour commencer",
                tier: "FREE",
                targetRole: "DRIVER",
                priceMonthly: 0,
                priceYearly: 0,
                maxMissionsPerMonth: null,
                maxApplicationsPerMonth: 3,
                commissionRate: 0.15,
                features: {},
                isPopular: false,
              }}
              isCurrentPlan={!currentSubscription || currentSubscription.tier === "FREE"}
              billingInterval={billingInterval}
              onSelect={() => {}}
              loading={false}
            />

            {driverPlans
              .filter((p) => p.tier !== "FREE")
              .map((plan) => (
                <PricingCard
                  key={plan.id}
                  plan={plan}
                  isCurrentPlan={currentSubscription?.planId === plan.id}
                  billingInterval={billingInterval}
                  onSelect={() => handleSelectPlan(plan.id)}
                  loading={selectedPlanId === plan.id}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="company">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Plan Gratuit Entreprise */}
            <PricingCard
              plan={{
                id: "free-company",
                name: "Gratuit",
                slug: "company-free",
                description: "Pour essayer",
                tier: "FREE",
                targetRole: "COMPANY",
                priceMonthly: 0,
                priceYearly: 0,
                maxMissionsPerMonth: 1,
                maxApplicationsPerMonth: null,
                commissionRate: 0.15,
                features: {},
                isPopular: false,
              }}
              isCurrentPlan={!currentSubscription || currentSubscription.tier === "FREE"}
              billingInterval={billingInterval}
              onSelect={() => {}}
              loading={false}
            />

            {companyPlans
              .filter((p) => p.tier !== "FREE")
              .map((plan) => (
                <PricingCard
                  key={plan.id}
                  plan={plan}
                  isCurrentPlan={currentSubscription?.planId === plan.id}
                  billingInterval={billingInterval}
                  onSelect={() => handleSelectPlan(plan.id)}
                  loading={selectedPlanId === plan.id}
                />
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* FAQ */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Questions fréquentes</h2>
        <div className="max-w-2xl mx-auto text-left space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Puis-je changer de plan à tout moment ?</h3>
            <p className="text-muted-foreground">
              Oui, vous pouvez upgrader ou downgrader votre plan à tout moment.
              Les changements prennent effet immédiatement avec un prorata.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Comment fonctionne la commission ?</h3>
            <p className="text-muted-foreground">
              La commission est prélevée sur chaque mission terminée.
              Avec un plan Pro ou Business, vous bénéficiez d&apos;une commission réduite.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Puis-je annuler mon abonnement ?</h3>
            <p className="text-muted-foreground">
              Oui, vous pouvez annuler à tout moment. Votre abonnement restera actif
              jusqu&apos;à la fin de la période en cours.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <>
      <Suspense fallback={null}>
        <SubscriptionMessage />
      </Suspense>
      <PricingContent />
    </>
  )
}
