"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { usePusherEvent } from "@/hooks/use-pusher"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, Navigation, Truck, Clock, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface DriverLocation {
  latitude: number
  longitude: number
  accuracy?: number
  speed?: number
  heading?: number
  timestamp: string
}

interface ActiveDriver {
  bookingId: string
  job: {
    id: string
    title: string
    secteurLivraison: string
    startTime: string
    estimatedEndTime: string
  }
  driver: {
    id: string
    name: string
    image: string | null
    phone: string | null
  }
  location: DriverLocation | null
  pickedUpAt: string | null
}

// Load Google Maps script
function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.google !== "undefined" && window.google.maps) {
      resolve()
      return
    }

    const existingScript = document.getElementById("google-maps-script")
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve())
      return
    }

    const script = document.createElement("script")
    script.id = "google-maps-script"
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Google Maps"))
    document.head.appendChild(script)
  })
}

// Generate a color for each driver based on their ID
function getDriverColor(index: number): string {
  const colors = [
    "#10B981", // emerald
    "#3B82F6", // blue
    "#F59E0B", // amber
    "#EF4444", // red
    "#8B5CF6", // purple
    "#EC4899", // pink
    "#06B6D4", // cyan
    "#84CC16", // lime
  ]
  return colors[index % colors.length]
}

export function MultiDriverMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map())

  const [isLoaded, setIsLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeDrivers, setActiveDrivers] = useState<ActiveDriver[]>([])
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)

  // Fetch active drivers
  const fetchActiveDrivers = useCallback(async () => {
    try {
      const response = await fetch("/api/company/active-drivers")
      if (response.ok) {
        const data = await response.json()
        setActiveDrivers(data.drivers)

        // Update markers on map
        if (googleMapRef.current) {
          updateMarkers(data.drivers)
        }
      }
    } catch (error) {
      console.error("Error fetching active drivers:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Update markers on map
  const updateMarkers = useCallback((drivers: ActiveDriver[]) => {
    if (!googleMapRef.current) return

    const map = googleMapRef.current
    const bounds = new google.maps.LatLngBounds()
    let hasLocation = false

    drivers.forEach((driver, index) => {
      if (!driver.location) return

      hasLocation = true
      const position = {
        lat: driver.location.latitude,
        lng: driver.location.longitude,
      }
      bounds.extend(position)

      const existingMarker = markersRef.current.get(driver.bookingId)
      const color = getDriverColor(index)

      if (existingMarker) {
        // Update existing marker
        existingMarker.setPosition(position)
        if (driver.location.heading) {
          const icon = existingMarker.getIcon() as google.maps.Symbol
          if (icon) {
            icon.rotation = driver.location.heading
            existingMarker.setIcon(icon)
          }
        }
      } else {
        // Create new marker
        const marker = new google.maps.Marker({
          position,
          map,
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 7,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            rotation: driver.location.heading || 0,
          },
          title: driver.driver.name || "Chauffeur",
          zIndex: 10,
        })

        // Add click listener
        marker.addListener("click", () => {
          setSelectedDriver(driver.bookingId)
        })

        markersRef.current.set(driver.bookingId, marker)
      }
    })

    // Remove markers for drivers no longer active
    markersRef.current.forEach((marker, bookingId) => {
      if (!drivers.find((d) => d.bookingId === bookingId)) {
        marker.setMap(null)
        markersRef.current.delete(bookingId)
      }
    })

    // Fit map to show all markers
    if (hasLocation && drivers.length > 0) {
      if (drivers.length === 1) {
        map.setCenter(bounds.getCenter())
        map.setZoom(14)
      } else {
        map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 })
      }
    }
  }, [])

  // Listen for location updates via Pusher for each active booking
  useEffect(() => {
    activeDrivers.forEach((driver) => {
      // This will be handled by individual subscriptions
    })
  }, [activeDrivers])

  // Initialize map and fetch data
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      setLoading(false)
      return
    }

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (!mapRef.current) return

        // Default center (Paris)
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 48.8566, lng: 2.3522 },
          zoom: 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        })

        googleMapRef.current = map
        setIsLoaded(true)

        // Fetch drivers after map is ready
        fetchActiveDrivers()
      })
      .catch((err) => {
        console.error("Error loading Google Maps:", err)
        setLoading(false)
      })

    // Refresh every 30 seconds
    const interval = setInterval(fetchActiveDrivers, 30000)

    return () => {
      clearInterval(interval)
      markersRef.current.forEach((marker) => marker.setMap(null))
      markersRef.current.clear()
    }
  }, [fetchActiveDrivers])

  // Get selected driver info
  const selectedDriverInfo = activeDrivers.find(
    (d) => d.bookingId === selectedDriver
  )

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-white">
          <Truck className="h-5 w-5 text-emerald-400" />
          Chauffeurs en mission ({activeDrivers.length})
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchActiveDrivers}
          className="text-gray-400 hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map */}
        <div className="relative">
          <div
            ref={mapRef}
            className="w-full h-[400px] rounded-lg overflow-hidden"
            style={{ minHeight: "400px" }}
          />

          {/* Loading overlay */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-slate-700 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Skeleton className="h-8 w-8 rounded-full bg-slate-600 mx-auto mb-2" />
                <span className="text-gray-400">Chargement...</span>
              </div>
            </div>
          )}

          {/* No drivers message */}
          {isLoaded && activeDrivers.length === 0 && (
            <div className="absolute inset-0 bg-slate-700/80 rounded-lg flex items-center justify-center">
              <div className="text-center p-4">
                <Truck className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">Aucun chauffeur en mission</p>
                <p className="text-sm text-gray-500 mt-1">
                  Les chauffeurs apparaitront ici une fois leurs missions demarrees
                </p>
              </div>
            </div>
          )}

          {/* Live indicator */}
          {isLoaded && activeDrivers.length > 0 && (
            <div className="absolute top-4 right-4 bg-emerald-500/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span className="text-white text-sm font-medium">En direct</span>
            </div>
          )}
        </div>

        {/* Driver list */}
        {activeDrivers.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-400">
              Chauffeurs actifs
            </h4>
            <div className="grid gap-2">
              {activeDrivers.map((driver, index) => (
                <div
                  key={driver.bookingId}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedDriver === driver.bookingId
                      ? "bg-slate-600 border border-emerald-500/50"
                      : "bg-slate-700/50 hover:bg-slate-700"
                  }`}
                  onClick={() => {
                    setSelectedDriver(driver.bookingId)
                    if (driver.location && googleMapRef.current) {
                      googleMapRef.current.panTo({
                        lat: driver.location.latitude,
                        lng: driver.location.longitude,
                      })
                      googleMapRef.current.setZoom(15)
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getDriverColor(index) }}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={driver.driver.image || undefined} />
                      <AvatarFallback className="bg-slate-600 text-white text-xs">
                        {driver.driver.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {driver.driver.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {driver.job.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {driver.location ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          GPS
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          En attente
                        </Badge>
                      )}
                    </div>
                  </div>
                  {selectedDriver === driver.bookingId && (
                    <div className="mt-3 pt-3 border-t border-slate-600 flex items-center justify-between">
                      <div className="text-xs text-gray-400">
                        <p>Secteur: {driver.job.secteurLivraison}</p>
                        {driver.location?.speed && (
                          <p>Vitesse: {Math.round(driver.location.speed * 3.6)} km/h</p>
                        )}
                      </div>
                      <Link href={`/jobs/${driver.job.id}`}>
                        <Button size="sm" variant="outline" className="text-xs">
                          Voir mission
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
