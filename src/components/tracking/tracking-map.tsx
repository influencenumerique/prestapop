"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { usePusherEvent } from "@/hooks/use-pusher"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, Navigation, AlertCircle } from "lucide-react"

interface LocationData {
  latitude: number
  longitude: number
  accuracy?: number
  speed?: number
  heading?: number
  timestamp: string
}

interface TrackingMapProps {
  bookingId: string
  initialLocation?: { lat: number; lng: number } | null
  deliveryLocation?: { lat: number; lng: number } | null
  driverName?: string
  className?: string
}

// Load Google Maps script dynamically
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

export function TrackingMap({
  bookingId,
  initialLocation,
  deliveryLocation,
  driverName = "Chauffeur",
  className = "",
}: TrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const driverMarkerRef = useRef<google.maps.Marker | null>(null)
  const destinationMarkerRef = useRef<google.maps.Marker | null>(null)
  const routeLineRef = useRef<google.maps.Polyline | null>(null)

  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    initialLocation
      ? {
          latitude: initialLocation.lat,
          longitude: initialLocation.lng,
          timestamp: new Date().toISOString(),
        }
      : null
  )
  const [eta, setEta] = useState<{ minutes: number; distance: string } | null>(null)

  // Listen for real-time location updates via Pusher
  usePusherEvent<LocationData>(
    `booking-${bookingId}`,
    "location-update",
    (data) => {
      setCurrentLocation(data)
      updateDriverMarker(data)
      if (deliveryLocation) {
        calculateETA(data, deliveryLocation)
      }
    }
  )

  const updateDriverMarker = useCallback((location: LocationData) => {
    if (!googleMapRef.current || !driverMarkerRef.current) return

    const newPosition = new google.maps.LatLng(location.latitude, location.longitude)

    // Animate marker movement
    driverMarkerRef.current.setPosition(newPosition)

    // Rotate marker based on heading
    if (location.heading !== undefined && location.heading !== null) {
      const icon = driverMarkerRef.current.getIcon() as google.maps.Symbol
      if (icon) {
        icon.rotation = location.heading
        driverMarkerRef.current.setIcon(icon)
      }
    }

    // Update route line
    if (routeLineRef.current && deliveryLocation) {
      routeLineRef.current.setPath([
        newPosition,
        new google.maps.LatLng(deliveryLocation.lat, deliveryLocation.lng),
      ])
    }

    // Center map on driver
    googleMapRef.current.panTo(newPosition)
  }, [deliveryLocation])

  const calculateETA = useCallback(
    async (origin: LocationData, destination: { lat: number; lng: number }) => {
      if (!window.google) return

      const service = new google.maps.DistanceMatrixService()

      try {
        const response = await service.getDistanceMatrix({
          origins: [{ lat: origin.latitude, lng: origin.longitude }],
          destinations: [destination],
          travelMode: google.maps.TravelMode.DRIVING,
        })

        const result = response.rows[0]?.elements[0]
        if (result?.status === "OK") {
          setEta({
            minutes: Math.round((result.duration?.value || 0) / 60),
            distance: result.distance?.text || "",
          })
        }
      } catch (err) {
        console.error("Error calculating ETA:", err)
      }
    },
    []
  )

  // Initialize Google Maps
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      setError("Cle API Google Maps non configuree")
      return
    }

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (!mapRef.current) return

        // Default center (Paris)
        const defaultCenter = { lat: 48.8566, lng: 2.3522 }
        const center = currentLocation
          ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
          : deliveryLocation || defaultCenter

        // Create map
        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom: 14,
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

        // Create driver marker (car icon)
        const driverMarker = new google.maps.Marker({
          position: center,
          map,
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: "#10B981",
            fillOpacity: 1,
            strokeColor: "#059669",
            strokeWeight: 2,
            rotation: 0,
          },
          title: driverName,
          zIndex: 10,
        })

        driverMarkerRef.current = driverMarker

        // Create destination marker if provided
        if (deliveryLocation) {
          const destinationMarker = new google.maps.Marker({
            position: deliveryLocation,
            map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#EF4444",
              fillOpacity: 1,
              strokeColor: "#DC2626",
              strokeWeight: 2,
            },
            title: "Destination",
            zIndex: 5,
          })

          destinationMarkerRef.current = destinationMarker

          // Create route line
          const routeLine = new google.maps.Polyline({
            path: [center, deliveryLocation],
            geodesic: true,
            strokeColor: "#3B82F6",
            strokeOpacity: 0.8,
            strokeWeight: 4,
          })

          routeLine.setMap(map)
          routeLineRef.current = routeLine

          // Fit bounds to show both markers
          const bounds = new google.maps.LatLngBounds()
          bounds.extend(center)
          bounds.extend(deliveryLocation)
          map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 })

          // Calculate initial ETA
          if (currentLocation) {
            calculateETA(currentLocation, deliveryLocation)
          }
        }

        setIsLoaded(true)
      })
      .catch((err: Error) => {
        console.error("Error loading Google Maps:", err)
        setError("Erreur lors du chargement de la carte")
      })

    return () => {
      // Cleanup
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setMap(null)
      }
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setMap(null)
      }
      if (routeLineRef.current) {
        routeLineRef.current.setMap(null)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <Card className={`bg-slate-800 border-slate-700 p-6 ${className}`}>
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </Card>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div
        ref={mapRef}
        className="w-full h-[400px] rounded-lg overflow-hidden"
        style={{ minHeight: "400px" }}
      />

      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-800 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Skeleton className="h-8 w-8 rounded-full bg-slate-700 mx-auto mb-2" />
            <span className="text-gray-400">Chargement de la carte...</span>
          </div>
        </div>
      )}

      {/* ETA overlay */}
      {isLoaded && eta && (
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-semibold text-gray-900">
                {eta.minutes} min
              </p>
              <p className="text-sm text-gray-500">{eta.distance}</p>
            </div>
          </div>
        </div>
      )}

      {/* Live indicator */}
      {isLoaded && currentLocation && (
        <div className="absolute top-4 right-4 bg-emerald-500/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <span className="text-white text-sm font-medium">En direct</span>
        </div>
      )}

      {/* No location message */}
      {isLoaded && !currentLocation && (
        <div className="absolute bottom-4 left-4 right-4 bg-yellow-500/90 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-white" />
          <span className="text-white text-sm">
            En attente de la position du chauffeur...
          </span>
        </div>
      )}
    </div>
  )
}
