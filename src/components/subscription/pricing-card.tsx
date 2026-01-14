"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface PricingCardProps {
  plan: {
    id: string
    name: string
    slug: string
    description?: string | null
    tier: string
    targetRole: string
    priceMonthly: number
    priceYearly: number
    maxMissionsPerMonth: number | null
    maxApplicationsPerMonth: number | null
    commissionRate: number
    features: Record<string, boolean | string | number>
    isPopular?: boolean
  }
  isCurrentPlan?: boolean
  billingInterval: "MONTHLY" | "YEARLY"
  onSelect: () => void
  loading?: boolean
}

export function PricingCard({
  plan,
  isCurrentPlan,
  billingInterval,
  onSelect,
  loading,
}: PricingCardProps) {
  const price = billingInterval === "YEARLY" ? plan.priceYearly : plan.priceMonthly
  const priceDisplay = (price / 100).toFixed(2).replace(".", ",")
  const yearlyDiscount = plan.priceMonthly > 0
    ? Math.round((1 - plan.priceYearly / (plan.priceMonthly * 12)) * 100)
    : 0

  const isDriver = plan.targetRole === "DRIVER"
  const isFree = plan.tier === "FREE"

  // Couleur selon le rôle
  const accentColor = isDriver ? "emerald" : "blue"

  // Features à afficher
  const displayFeatures = [
    // Limite de missions/candidatures
    isDriver
      ? plan.maxApplicationsPerMonth
        ? `${plan.maxApplicationsPerMonth} candidatures/mois`
        : "Candidatures illimitées"
      : plan.maxMissionsPerMonth
        ? `${plan.maxMissionsPerMonth} mission${plan.maxMissionsPerMonth > 1 ? "s" : ""}/mois`
        : "Missions illimitées",
    // Commission
    `Commission ${(plan.commissionRate * 100).toFixed(0)}%`,
    // Features additionnelles du plan
    ...(plan.features?.badge ? ["Badge Pro visible"] : []),
    ...(plan.features?.priority ? ["Visibilité prioritaire"] : []),
    ...(plan.features?.analytics ? ["Analytics avancées"] : []),
    ...(plan.features?.support === "priority" ? ["Support prioritaire"] : []),
    ...(plan.features?.support === "dedicated" ? ["Support dédié"] : []),
    ...(plan.features?.alerts ? ["Alertes temps réel"] : []),
  ]

  return (
    <Card
      className={cn(
        "relative flex flex-col",
        plan.isPopular && "border-2 border-primary shadow-lg",
        isCurrentPlan && "ring-2 ring-green-500"
      )}
    >
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            <Sparkles className="mr-1 h-3 w-3" />
            Populaire
          </Badge>
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            Plan actuel
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        {plan.description && (
          <CardDescription>{plan.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">{priceDisplay}€</span>
            {!isFree && (
              <span className="text-muted-foreground">
                /{billingInterval === "YEARLY" ? "an" : "mois"}
              </span>
            )}
          </div>
          {billingInterval === "YEARLY" && yearlyDiscount > 0 && (
            <p className="text-sm text-green-600 mt-1">
              Économisez {yearlyDiscount}% vs mensuel
            </p>
          )}
        </div>

        <ul className="space-y-3">
          {displayFeatures.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className={cn(
                "h-5 w-5 shrink-0 mt-0.5",
                isDriver ? "text-emerald-500" : "text-blue-500"
              )} />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          onClick={onSelect}
          disabled={loading || isCurrentPlan}
          className={cn(
            "w-full",
            isCurrentPlan && "bg-green-600 hover:bg-green-600"
          )}
          variant={plan.isPopular ? "default" : "outline"}
        >
          {loading ? (
            "Chargement..."
          ) : isCurrentPlan ? (
            "Plan actuel"
          ) : isFree ? (
            "Plan gratuit"
          ) : (
            "Choisir ce plan"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
