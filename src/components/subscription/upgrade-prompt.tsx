"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Rocket, TrendingUp, Zap } from "lucide-react"
import Link from "next/link"

interface UpgradePromptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: "mission_limit" | "application_limit" | "feature_locked"
  currentUsage?: number
  limit?: number
}

export function UpgradePrompt({
  open,
  onOpenChange,
  trigger,
  currentUsage,
  limit,
}: UpgradePromptProps) {
  const content = {
    mission_limit: {
      title: "Limite de missions atteinte",
      description: `Vous avez utilisé ${currentUsage}/${limit} missions ce mois-ci. Passez à un plan supérieur pour publier plus de missions.`,
      benefits: [
        "Publiez jusqu'à 10 missions/mois avec Pro",
        "Missions illimitées avec Enterprise",
        "Réduisez vos commissions jusqu'à 8%",
      ],
    },
    application_limit: {
      title: "Limite de candidatures atteinte",
      description: `Vous avez utilisé ${currentUsage}/${limit} candidatures ce mois-ci. Passez à Pro pour candidater sans limite.`,
      benefits: [
        "Candidatures illimitées",
        "Badge Pro visible sur votre profil",
        "Commission réduite à 10% (vs 15%)",
      ],
    },
    feature_locked: {
      title: "Fonctionnalité Premium",
      description: "Cette fonctionnalité est réservée aux abonnés Pro et Business.",
      benefits: [
        "Accès aux analytics avancées",
        "Support prioritaire",
        "Visibilité prioritaire dans les recherches",
      ],
    },
  }

  const { title, description, benefits } = content[trigger]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <p className="text-sm font-medium text-center">
            Avantages du plan Pro :
          </p>
          <ul className="space-y-2">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-primary shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button asChild className="w-full">
            <Link href="/pricing">
              <TrendingUp className="mr-2 h-4 w-4" />
              Voir les plans
            </Link>
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Plus tard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
