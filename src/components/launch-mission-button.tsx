"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Rocket, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { formatPrice } from "@/lib/utils"

interface LaunchMissionButtonProps {
  bookingId: string
  dayRate: number
  className?: string
}

export function LaunchMissionButton({ bookingId, dayRate, className }: LaunchMissionButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleLaunchMission = async () => {
    setIsLoading(true)
    toast.loading("Redirection vers Stripe...", { id: "launch-mission" })

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du paiement")
      }

      if (data.url) {
        toast.success("Redirection en cours...", { id: "launch-mission" })
        window.location.href = data.url
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors du paiement", {
        id: "launch-mission",
      })
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleLaunchMission}
      disabled={isLoading}
      className={`bg-green-500 hover:bg-green-600 hover:scale-105 transition-all gap-2 ${className}`}
      size="lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement...
        </>
      ) : (
        <>
          <Rocket className="h-4 w-4" />
          Lancer mission {formatPrice(dayRate)}
        </>
      )}
    </Button>
  )
}
