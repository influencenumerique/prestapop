"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { HandCoins, Loader2, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { formatPrice } from "@/lib/utils"

interface ApplyMissionButtonProps {
  jobId: string
  dayRate: number
  jobStartDate: string
  jobEndDate: string
  className?: string
  hasAlreadyApplied?: boolean
}

interface DriverData {
  hasActiveMission: boolean
  activeBookings: Array<{
    job: {
      title: string
      startTime: string
      estimatedEndTime: string
    }
  }>
}

export function ApplyMissionButton({
  jobId,
  dayRate,
  jobStartDate,
  jobEndDate,
  className,
  hasAlreadyApplied = false,
}: ApplyMissionButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [applied, setApplied] = useState(hasAlreadyApplied)

  const checkDriverAvailability = async (): Promise<{ available: boolean; message?: string }> => {
    try {
      const response = await fetch("/api/drivers/me")
      if (!response.ok) {
        return { available: false, message: "Erreur lors de la verification" }
      }

      const driver: DriverData = await response.json()

      // Check for active missions
      if (driver.hasActiveMission) {
        const jobStart = new Date(jobStartDate)
        const jobEnd = new Date(jobEndDate)

        for (const booking of driver.activeBookings) {
          const existingStart = new Date(booking.job.startTime)
          const existingEnd = new Date(booking.job.estimatedEndTime)

          // Check for date overlap
          if (jobStart <= existingEnd && jobEnd >= existingStart) {
            return {
              available: false,
              message: `Vous avez deja une mission (${booking.job.title}) du ${existingStart.toLocaleDateString("fr-FR")} au ${existingEnd.toLocaleDateString("fr-FR")}`,
            }
          }
        }
      }

      return { available: true }
    } catch {
      return { available: false, message: "Erreur de connexion" }
    }
  }

  const handleApply = async () => {
    setIsLoading(true)
    toast.loading("Verification de votre disponibilite...", { id: "apply-mission" })

    try {
      // First check availability
      const availability = await checkDriverAvailability()

      if (!availability.available) {
        toast.error(availability.message || "Vous n'etes pas disponible", {
          id: "apply-mission",
        })
        setIsLoading(false)
        return
      }

      // Then apply to the mission
      toast.loading("Envoi de votre candidature...", { id: "apply-mission" })

      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la candidature")
      }

      toast.success("Candidature envoyee avec succes !", { id: "apply-mission" })
      setApplied(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la candidature", {
        id: "apply-mission",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (applied) {
    return (
      <div className="text-center">
        <Button
          disabled
          className="bg-blue-100 text-blue-800 hover:bg-blue-100 gap-2 w-full"
          size="lg"
        >
          <CheckCircle className="h-4 w-4" />
          Candidature envoyee
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          En attente de reponse de l&apos;entreprise
        </p>
      </div>
    )
  }

  return (
    <Button
      onClick={handleApply}
      disabled={isLoading}
      className={`bg-blue-500 hover:bg-blue-600 hover:scale-105 transition-all gap-2 ${className}`}
      size="lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Verification...
        </>
      ) : (
        <>
          <HandCoins className="h-4 w-4" />
          Choisir cette mission {formatPrice(dayRate)}
        </>
      )}
    </Button>
  )
}
