# Exemples d'utilisation - Driver Feedback API

## 1. Utilisation côté client (TypeScript/React)

### Installation du client

```typescript
import {
  createDriverFeedback,
  getDriverStats,
  getDriverRanking,
} from "@/lib/api/driver-feedback-client"
import { FeedbackTag } from "@prisma/client"
```

---

## 2. Composant: Formulaire de feedback

```typescript
"use client"

import { useState } from "react"
import { FeedbackTag } from "@prisma/client"
import { createDriverFeedback } from "@/lib/api/driver-feedback-client"

interface FeedbackFormProps {
  driverId: string
  bookingId: string
  onSuccess?: () => void
}

export function DriverFeedbackForm({
  driverId,
  bookingId,
  onSuccess,
}: FeedbackFormProps) {
  const [rating, setRating] = useState(5)
  const [selectedTags, setSelectedTags] = useState<FeedbackTag[]>([])
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableTags: { value: FeedbackTag; label: string }[] = [
    { value: FeedbackTag.PUNCTUAL, label: "Ponctuel" },
    { value: FeedbackTag.CAREFUL, label: "Soigneux" },
    { value: FeedbackTag.FAST, label: "Rapide" },
    { value: FeedbackTag.COMMUNICATIVE, label: "Communicatif" },
    { value: FeedbackTag.PROFESSIONAL, label: "Professionnel" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await createDriverFeedback(driverId, {
        bookingId,
        rating,
        tags: selectedTags,
        comment: comment || undefined,
      })

      alert("Feedback envoyé avec succès!")
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi")
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tag: FeedbackTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Note globale
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-2xl ${
                star <= rating ? "text-yellow-400" : "text-gray-300"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Qualités du chauffeur
        </label>
        <div className="flex flex-wrap gap-2">
          {availableTags.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleTag(value)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedTags.includes(value)
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Commentaire (optionnel)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full border rounded p-2"
          rows={4}
          placeholder="Partagez votre expérience..."
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || selectedTags.length === 0}
        className="w-full bg-blue-500 text-white py-2 rounded disabled:bg-gray-300"
      >
        {loading ? "Envoi en cours..." : "Envoyer le feedback"}
      </button>
    </form>
  )
}
```

---

## 3. Composant: Profil du chauffeur avec stats

```typescript
"use client"

import { useEffect, useState } from "react"
import { getDriverStats } from "@/lib/api/driver-feedback-client"
import type { DriverStatsResponse } from "@/lib/types/driver-feedback"

interface DriverProfileProps {
  driverId: string
}

export function DriverProfile({ driverId }: DriverProfileProps) {
  const [stats, setStats] = useState<DriverStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [driverId])

  const loadStats = async () => {
    try {
      const data = await getDriverStats(driverId)
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Chargement...</div>
  if (error) return <div className="text-red-600">{error}</div>
  if (!stats) return null

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <img
          src={stats.driver.image || "/default-avatar.png"}
          alt={stats.driver.name || "Chauffeur"}
          className="w-20 h-20 rounded-full"
        />
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {stats.driver.name}
            {stats.driver.isVerified && (
              <span className="text-blue-500">✓</span>
            )}
          </h2>
          <p className="text-gray-600">
            {stats.driver.city} • {stats.driver.region}
          </p>
        </div>
      </div>

      {/* Performance */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-yellow-500">
            {stats.performance.rating.toFixed(1)}
          </div>
          <div className="text-sm text-gray-600">Note moyenne</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold">
            {stats.performance.totalDeliveries}
          </div>
          <div className="text-sm text-gray-600">Livraisons</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold">
            {stats.performance.totalReviews}
          </div>
          <div className="text-sm text-gray-600">Avis</div>
        </div>
      </div>

      {/* Badges */}
      {stats.badges.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Badges obtenus</h3>
          <div className="flex flex-wrap gap-2">
            {stats.badges.map((badge) => (
              <span
                key={badge.type}
                className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm"
              >
                🏆 {badge.type.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top Tags */}
      {stats.topTags.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Qualités les plus citées</h3>
          <div className="space-y-2">
            {stats.topTags.map((tag) => (
              <div key={tag.tag}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{tag.tag}</span>
                  <span className="font-medium">{tag.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${tag.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Classement */}
      {stats.ranking.regionalRank && (
        <div className="bg-blue-50 p-4 rounded">
          <div className="text-center">
            <div className="text-sm text-gray-600">Classement régional</div>
            <div className="text-2xl font-bold text-blue-600">
              #{stats.ranking.regionalRank}
            </div>
            <div className="text-sm text-gray-600">
              {stats.ranking.region}
            </div>
          </div>
        </div>
      )}

      {/* Feedbacks récents */}
      {stats.recentFeedbacks.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Avis récents</h3>
          <div className="space-y-3">
            {stats.recentFeedbacks.slice(0, 3).map((feedback, idx) => (
              <div key={idx} className="border-l-4 border-blue-500 pl-3 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-yellow-500">
                    {"★".repeat(feedback.rating)}
                  </div>
                  <span className="text-sm text-gray-600">
                    {feedback.company.companyName}
                  </span>
                </div>
                {feedback.comment && (
                  <p className="text-sm text-gray-700">{feedback.comment}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {feedback.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-100 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## 4. Composant: Classement régional

```typescript
"use client"

import { useEffect, useState } from "react"
import { getDriverRanking } from "@/lib/api/driver-feedback-client"
import type { DriverRankingResponse } from "@/lib/types/driver-feedback"

interface RegionalRankingProps {
  region: string
  limit?: number
}

export function RegionalRanking({ region, limit = 10 }: RegionalRankingProps) {
  const [ranking, setRanking] = useState<DriverRankingResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRanking()
  }, [region, limit])

  const loadRanking = async () => {
    setLoading(true)
    try {
      const data = await getDriverRanking(region, limit)
      setRanking(data)
    } catch (err) {
      console.error("Error loading ranking:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Chargement du classement...</div>
  if (!ranking) return null

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">
        Top {limit} - {ranking.region}
      </h2>

      <div className="space-y-3">
        {ranking.ranking.map((entry) => (
          <div
            key={entry.driver.id}
            className="flex items-center gap-4 p-4 border rounded hover:bg-gray-50"
          >
            {/* Rang */}
            <div className="text-2xl font-bold text-gray-400 w-8">
              {entry.rank}
            </div>

            {/* Avatar */}
            <img
              src={entry.driver.image || "/default-avatar.png"}
              alt={entry.driver.name || "Chauffeur"}
              className="w-12 h-12 rounded-full"
            />

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{entry.driver.name}</span>
                {entry.driver.isVerified && (
                  <span className="text-blue-500">✓</span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {entry.driver.city}
              </div>
              <div className="flex gap-2 mt-1">
                {entry.badges.slice(0, 3).map((badge) => (
                  <span
                    key={badge}
                    className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded"
                  >
                    🏆
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="text-right">
              <div className="text-lg font-bold text-yellow-500">
                {entry.performance.rating.toFixed(1)} ★
              </div>
              <div className="text-sm text-gray-600">
                {entry.performance.totalDeliveries} livraisons
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 5. Utilisation avec React Query (recommandé)

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getDriverStats,
  getDriverRanking,
  createDriverFeedback,
} from "@/lib/api/driver-feedback-client"

// Hook pour les stats d'un chauffeur
export function useDriverStats(driverId: string) {
  return useQuery({
    queryKey: ["driverStats", driverId],
    queryFn: () => getDriverStats(driverId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook pour le classement régional
export function useDriverRanking(region: string, limit = 10) {
  return useQuery({
    queryKey: ["driverRanking", region, limit],
    queryFn: () => getDriverRanking(region, limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook pour créer un feedback
export function useCreateFeedback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ driverId, data }: {
      driverId: string
      data: CreateFeedbackRequest
    }) => createDriverFeedback(driverId, data),
    onSuccess: (_, variables) => {
      // Invalider le cache pour forcer le rechargement
      queryClient.invalidateQueries({
        queryKey: ["driverStats", variables.driverId],
      })
    },
  })
}

// Exemple d'utilisation
function MyComponent({ driverId }: { driverId: string }) {
  const { data: stats, isLoading } = useDriverStats(driverId)
  const createFeedback = useCreateFeedback()

  const handleSubmit = (data: CreateFeedbackRequest) => {
    createFeedback.mutate(
      { driverId, data },
      {
        onSuccess: () => {
          alert("Feedback envoyé!")
        },
      }
    )
  }

  // ...
}
```

---

## 6. Utilisation côté serveur (Server Components)

```typescript
import { db } from "@/lib/db"

// Dans un Server Component Next.js
export default async function DriverPage({
  params,
}: {
  params: { id: string }
}) {
  // Récupérer directement depuis la DB
  const driver = await db.driverProfile.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      tagStats: { orderBy: { count: "desc" }, take: 5 },
      badges: { orderBy: { earnedAt: "desc" } },
      feedbacks: {
        include: { company: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  })

  if (!driver) {
    return <div>Chauffeur non trouvé</div>
  }

  return (
    <div>
      <h1>{driver.user.name}</h1>
      <p>Note: {driver.rating.toFixed(1)}/5</p>
      {/* ... */}
    </div>
  )
}
```

---

## 7. Gestion d'erreurs avancée

```typescript
import { createDriverFeedback } from "@/lib/api/driver-feedback-client"

async function submitFeedback(driverId: string, data: CreateFeedbackRequest) {
  try {
    const feedback = await createDriverFeedback(driverId, data)
    return { success: true, data: feedback }
  } catch (error) {
    if (error instanceof Error) {
      // Gérer les erreurs spécifiques
      if (error.message.includes("déjà laissé un feedback")) {
        return { success: false, error: "ALREADY_VOTED" }
      }
      if (error.message.includes("pas encore publié")) {
        return { success: false, error: "JOB_NOT_PUBLISHED" }
      }
      if (error.message.includes("terminées")) {
        return { success: false, error: "MISSION_NOT_COMPLETED" }
      }
    }
    return { success: false, error: "UNKNOWN_ERROR" }
  }
}
```

---

Ces exemples montrent comment intégrer facilement le système de feedback dans votre application frontend. Le client TypeScript fourni garantit la type-safety et facilite l'utilisation des APIs.
