"use client"

import { useEffect, useState } from "react"
import { useLocationSender } from "@/hooks/use-location-sender"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  Navigation,
  AlertCircle,
  RefreshCw,
  Signal,
  SignalLow,
  SignalMedium,
  SignalHigh,
} from "lucide-react"

interface DriverTrackingControlProps {
  bookingId: string
  isActive: boolean
  className?: string
}

export function DriverTrackingControl({
  bookingId,
  isActive,
  className = "",
}: DriverTrackingControlProps) {
  const {
    isTracking,
    isSending,
    lastSentAt,
    error,
    sendCount,
    geoLoading,
    geoError,
    currentPosition,
    startTracking,
    stopTracking,
    sendNow,
  } = useLocationSender(bookingId, {
    intervalMs: 15000, // Send every 15 seconds
    enabled: isActive,
  })

  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>("")

  // Update time since last update every second
  useEffect(() => {
    if (!lastSentAt) return

    const updateTime = () => {
      const seconds = Math.floor((Date.now() - lastSentAt.getTime()) / 1000)
      if (seconds < 60) {
        setTimeSinceUpdate(`il y a ${seconds}s`)
      } else {
        const minutes = Math.floor(seconds / 60)
        setTimeSinceUpdate(`il y a ${minutes}min`)
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [lastSentAt])

  // Get accuracy indicator
  const getAccuracyIcon = (accuracy: number | null) => {
    if (accuracy === null) return <Signal className="h-4 w-4 text-gray-500" />
    if (accuracy <= 10) return <SignalHigh className="h-4 w-4 text-emerald-400" />
    if (accuracy <= 30) return <SignalMedium className="h-4 w-4 text-yellow-400" />
    return <SignalLow className="h-4 w-4 text-red-400" />
  }

  const getAccuracyText = (accuracy: number | null) => {
    if (accuracy === null) return "Precision inconnue"
    if (accuracy <= 10) return "Excellente precision"
    if (accuracy <= 30) return "Bonne precision"
    if (accuracy <= 100) return "Precision moyenne"
    return "Faible precision"
  }

  // If not active, show inactive state
  if (!isActive) {
    return (
      <Card className={`bg-slate-800 border-slate-700 p-4 ${className}`}>
        <div className="flex items-center gap-3 text-gray-500">
          <MapPin className="h-5 w-5" />
          <div>
            <p className="font-medium">Partage de position inactif</p>
            <p className="text-sm">
              Le tracking demarre automatiquement quand la mission est en cours
            </p>
          </div>
        </div>
      </Card>
    )
  }

  // If there's a geolocation error
  if (geoError) {
    return (
      <Card className={`bg-slate-800 border-red-700/50 p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-red-400">Erreur de localisation</p>
            <p className="text-sm text-gray-400 mt-1">{geoError}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 border-red-700/50 text-red-400 hover:bg-red-500/10"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reessayer
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  // Loading state
  if (geoLoading && !currentPosition.latitude) {
    return (
      <Card className={`bg-slate-800 border-slate-700 p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg animate-pulse">
            <Navigation className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="font-medium text-white">Acquisition GPS en cours...</p>
            <p className="text-sm text-gray-400">
              Veuillez patienter quelques secondes
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`bg-slate-800 border-emerald-700/50 p-4 ${className}`}>
      <div className="flex items-start justify-between">
        {/* Status */}
        <div className="flex items-start gap-3">
          <div className="relative">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Navigation className="h-5 w-5 text-emerald-400" />
            </div>
            {/* Pulsing indicator */}
            {isTracking && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div>
            <p className="font-medium text-white flex items-center gap-2">
              Position partagee
              {isSending && (
                <RefreshCw className="h-3 w-3 animate-spin text-emerald-400" />
              )}
            </p>
            <p className="text-sm text-gray-400">
              {lastSentAt ? (
                <>Derniere mise a jour {timeSinceUpdate}</>
              ) : (
                <>En attente de la premiere position...</>
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
        <Button
          size="sm"
          variant="ghost"
          className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
          onClick={sendNow}
          disabled={isSending}
        >
          <RefreshCw className={`h-4 w-4 ${isSending ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Accuracy and stats */}
      <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-400">
          {getAccuracyIcon(currentPosition.accuracy)}
          <span>{getAccuracyText(currentPosition.accuracy)}</span>
          {currentPosition.accuracy && (
            <span className="text-gray-600">
              ({Math.round(currentPosition.accuracy)}m)
            </span>
          )}
        </div>
        <div className="text-gray-500">
          {sendCount} mise{sendCount !== 1 ? "s" : ""} a jour
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-3 p-2 bg-red-500/10 rounded-lg flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Current position (debug) */}
      {currentPosition.latitude && currentPosition.longitude && (
        <div className="mt-3 p-2 bg-slate-700/50 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin className="h-3 w-3" />
            <span>
              {currentPosition.latitude.toFixed(6)}, {currentPosition.longitude.toFixed(6)}
            </span>
            {currentPosition.speed !== null && currentPosition.speed > 0 && (
              <span className="ml-2">
                {Math.round(currentPosition.speed * 3.6)} km/h
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
