"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useGeolocation } from "./use-geolocation"
import { toast } from "sonner"

interface UseLocationSenderOptions {
  intervalMs?: number
  enabled?: boolean
}

interface LocationSenderState {
  isTracking: boolean
  isSending: boolean
  lastSentAt: Date | null
  error: string | null
  sendCount: number
}

export function useLocationSender(
  bookingId: string,
  options: UseLocationSenderOptions = {}
) {
  const { intervalMs = 15000, enabled = true } = options

  const [state, setState] = useState<LocationSenderState>({
    isTracking: false,
    isSending: false,
    lastSentAt: null,
    error: null,
    sendCount: 0,
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isFirstSend = useRef(true)

  const {
    latitude,
    longitude,
    accuracy,
    speed,
    heading,
    error: geoError,
    loading: geoLoading,
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 5000,
  })

  const sendLocation = useCallback(async () => {
    if (latitude === null || longitude === null) {
      return
    }

    setState((prev) => ({ ...prev, isSending: true, error: null }))

    try {
      const response = await fetch("/api/tracking/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
          latitude,
          longitude,
          accuracy,
          speed,
          heading,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erreur lors de l'envoi de la position")
      }

      setState((prev) => ({
        ...prev,
        isSending: false,
        lastSentAt: new Date(),
        sendCount: prev.sendCount + 1,
        error: null,
      }))

      // Show toast only on first successful send
      if (isFirstSend.current) {
        toast.success("Partage de position active")
        isFirstSend.current = false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"

      setState((prev) => ({
        ...prev,
        isSending: false,
        error: errorMessage,
      }))

      // Only show error toast occasionally to avoid spam
      if (state.sendCount % 5 === 0) {
        toast.error("Erreur de tracking: " + errorMessage)
      }
    }
  }, [bookingId, latitude, longitude, accuracy, speed, heading, state.sendCount])

  const startTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    setState((prev) => ({ ...prev, isTracking: true, error: null }))
    isFirstSend.current = true

    // Send immediately
    sendLocation()

    // Then send at interval
    intervalRef.current = setInterval(() => {
      sendLocation()
    }, intervalMs)
  }, [sendLocation, intervalMs])

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setState((prev) => ({ ...prev, isTracking: false }))
    toast.info("Partage de position arrete")
  }, [])

  // Auto-start when enabled and location is available
  useEffect(() => {
    if (enabled && latitude !== null && longitude !== null && !state.isTracking) {
      startTracking()
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, latitude, longitude]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update error state from geolocation
  useEffect(() => {
    if (geoError) {
      setState((prev) => ({ ...prev, error: geoError }))
    }
  }, [geoError])

  return {
    ...state,
    geoLoading,
    geoError,
    currentPosition: {
      latitude,
      longitude,
      accuracy,
      speed,
      heading,
    },
    startTracking,
    stopTracking,
    sendNow: sendLocation,
  }
}
