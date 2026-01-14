"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrackingMap, ETADisplay, DriverTrackingControl } from "@/components/tracking"
import { MapPin, Navigation } from "lucide-react"

interface LiveTrackingSectionProps {
  bookingId: string
  jobStatus: string
  userRole: "owner" | "driver"
  driverName?: string
  deliverySector?: string
}

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number | null
  speed: number | null
  timestamp: string
}

interface TrackingData {
  latestLocation: LocationData | null
  booking: {
    pickupLatitude: number | null
    pickupLongitude: number | null
    deliveryLatitude: number | null
    deliveryLongitude: number | null
  }
  driver: {
    name: string
  }
}

export function LiveTrackingSection({
  bookingId,
  jobStatus,
  userRole,
  driverName = "Chauffeur",
  deliverySector,
}: LiveTrackingSectionProps) {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [eta, setEta] = useState<{ minutes: number; distance: string } | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Fetch initial tracking data
  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const response = await fetch(`/api/tracking/location/${bookingId}`)
        if (response.ok) {
          const data = await response.json()
          setTrackingData(data)
          if (data.latestLocation) {
            setLastUpdate(new Date(data.latestLocation.timestamp))
          }
        }
      } catch (error) {
        console.error("Error fetching tracking data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (jobStatus === "IN_PROGRESS") {
      fetchTracking()
      // Refresh every 30 seconds as backup to Pusher
      const interval = setInterval(fetchTracking, 30000)
      return () => clearInterval(interval)
    } else {
      setLoading(false)
    }
  }, [bookingId, jobStatus])

  // Only show tracking for IN_PROGRESS jobs
  if (jobStatus !== "IN_PROGRESS") {
    return null
  }

  // Company owner view - show map and ETA
  if (userRole === "owner") {
    return (
      <Card className="mb-6 bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <span className="relative flex h-3 w-3 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <Navigation className="h-5 w-5 text-emerald-400" />
            Suivi en temps reel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="h-[400px] bg-slate-700 rounded-lg animate-pulse flex items-center justify-center">
              <span className="text-gray-400">Chargement de la carte...</span>
            </div>
          ) : (
            <>
              <TrackingMap
                bookingId={bookingId}
                initialLocation={
                  trackingData?.latestLocation
                    ? {
                        lat: trackingData.latestLocation.latitude,
                        lng: trackingData.latestLocation.longitude,
                      }
                    : null
                }
                deliveryLocation={
                  trackingData?.booking.deliveryLatitude &&
                  trackingData?.booking.deliveryLongitude
                    ? {
                        lat: trackingData.booking.deliveryLatitude,
                        lng: trackingData.booking.deliveryLongitude,
                      }
                    : null
                }
                driverName={trackingData?.driver.name || driverName}
              />
              <ETADisplay
                etaMinutes={eta?.minutes ?? null}
                distance={eta?.distance}
                lastUpdate={lastUpdate}
                driverName={trackingData?.driver.name || driverName}
              />
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  // Driver view - show tracking control
  if (userRole === "driver") {
    return (
      <Card className="mb-6 bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <MapPin className="h-5 w-5 text-emerald-400" />
            Partage de position
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DriverTrackingControl
            bookingId={bookingId}
            isActive={jobStatus === "IN_PROGRESS"}
          />
          <p className="text-sm text-gray-400 mt-4">
            Votre position est partagee avec l&apos;entreprise pendant la mission.
            Cela permet un meilleur suivi et une communication plus efficace.
          </p>
        </CardContent>
      </Card>
    )
  }

  return null
}
