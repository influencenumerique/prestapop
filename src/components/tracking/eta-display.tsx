"use client"

import { Clock, MapPin, Navigation } from "lucide-react"
import { Card } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

interface ETADisplayProps {
  etaMinutes: number | null
  distance?: string | null
  lastUpdate: Date | null
  driverName?: string
  className?: string
}

export function ETADisplay({
  etaMinutes,
  distance,
  lastUpdate,
  driverName = "Le chauffeur",
  className = "",
}: ETADisplayProps) {
  const formatETA = (minutes: number): string => {
    if (minutes < 1) {
      return "Moins d'1 min"
    }
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) {
      return `${hours}h`
    }
    return `${hours}h ${remainingMinutes}min`
  }

  const getArrivalTime = (minutes: number): string => {
    const arrival = new Date()
    arrival.setMinutes(arrival.getMinutes() + minutes)
    return arrival.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className={`bg-slate-800 border-slate-700 p-4 ${className}`}>
      <div className="flex items-start justify-between">
        {/* ETA Info */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Navigation className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            {etaMinutes !== null ? (
              <>
                <p className="text-2xl font-bold text-white">
                  {formatETA(etaMinutes)}
                </p>
                <p className="text-sm text-gray-400">
                  Arrivee estimee a {getArrivalTime(etaMinutes)}
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium text-white">
                  Calcul en cours...
                </p>
                <p className="text-sm text-gray-400">
                  En attente des donnees GPS
                </p>
              </>
            )}
          </div>
        </div>

        {/* Distance */}
        {distance && (
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{distance}</span>
          </div>
        )}
      </div>

      {/* Last update indicator */}
      {lastUpdate && (
        <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Pulsing live indicator */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-gray-500">
              Position mise a jour{" "}
              {formatDistanceToNow(lastUpdate, {
                addSuffix: true,
                locale: fr,
              })}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>
              {lastUpdate.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}
