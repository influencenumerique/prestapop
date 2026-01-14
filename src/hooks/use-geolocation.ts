"use client"

import { useState, useEffect, useCallback } from "react"

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  speed: number | null
  heading: number | null
  error: string | null
  loading: boolean
  timestamp: number | null
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

const defaultOptions: UseGeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    speed: null,
    heading: null,
    error: null,
    loading: true,
    timestamp: null,
  })

  const [watchId, setWatchId] = useState<number | null>(null)

  const mergedOptions = { ...defaultOptions, ...options }

  const onSuccess = useCallback((position: GeolocationPosition) => {
    setState({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed,
      heading: position.coords.heading,
      error: null,
      loading: false,
      timestamp: position.timestamp,
    })
  }, [])

  const onError = useCallback((error: GeolocationPositionError) => {
    let errorMessage: string

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "Acces a la localisation refuse. Veuillez autoriser l'acces dans les parametres."
        break
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Position indisponible. Verifiez que le GPS est active."
        break
      case error.TIMEOUT:
        errorMessage = "Delai d'attente depasse pour obtenir la position."
        break
      default:
        errorMessage = "Erreur inconnue lors de la geolocalisation."
    }

    setState((prev) => ({
      ...prev,
      error: errorMessage,
      loading: false,
    }))
  }, [])

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "La geolocalisation n'est pas supportee par votre navigateur.",
        loading: false,
      }))
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    const id = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      mergedOptions
    )

    setWatchId(id)
  }, [onSuccess, onError, mergedOptions])

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
  }, [watchId])

  const refreshPosition = useCallback(() => {
    if (!navigator.geolocation) {
      return
    }

    setState((prev) => ({ ...prev, loading: true }))

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      onError,
      mergedOptions
    )
  }, [onSuccess, onError, mergedOptions])

  useEffect(() => {
    startWatching()

    return () => {
      stopWatching()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...state,
    isWatching: watchId !== null,
    startWatching,
    stopWatching,
    refreshPosition,
  }
}
