"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"
import { DriverFeedbackTags, type FeedbackTag } from "@/components/driver-feedback-tags"

interface MissionFeedbackModalProps {
  jobId: string
  driverId: string
  driverName: string
  onClose?: () => void
  onSubmit?: (feedback: MissionFeedback) => Promise<void>
}

export interface MissionFeedback {
  rating: number
  tags: FeedbackTag[]
  comment?: string
}

export function MissionFeedbackModal({
  jobId,
  driverId,
  driverName,
  onClose,
  onSubmit,
}: MissionFeedbackModalProps) {
  const [rating, setRating] = useState<number>(0)
  const [hoveredRating, setHoveredRating] = useState<number>(0)
  const [selectedTags, setSelectedTags] = useState<FeedbackTag[]>([])
  const [comment, setComment] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Veuillez donner une note")
      return
    }

    if (selectedTags.length === 0) {
      alert("Veuillez sélectionner au moins une qualité")
      return
    }

    setIsSubmitting(true)
    try {
      if (onSubmit) {
        await onSubmit({
          rating,
          tags: selectedTags,
          comment: comment.trim() || undefined,
        })
      }
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du feedback:", error)
      alert("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Rating */}
      <Card>
        <CardHeader>
          <CardTitle>Notez votre expérience avec {driverName}</CardTitle>
          <CardDescription>Votre avis aide les autres entreprises à choisir leur chauffeur</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-12 w-12 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center mt-4 text-lg font-medium">
              {rating === 5 && "Excellent !"}
              {rating === 4 && "Très bien"}
              {rating === 3 && "Bien"}
              {rating === 2 && "Moyen"}
              {rating === 1 && "Décevant"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tags */}
      {rating > 0 && (
        <DriverFeedbackTags
          jobId={jobId}
          driverId={driverId}
          selectedTags={selectedTags}
          onSubmit={(tags) => setSelectedTags(tags)}
          readonly={false}
        />
      )}

      {/* Comment (optional) */}
      {selectedTags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Commentaire (facultatif)</CardTitle>
            <CardDescription>
              Partagez plus de détails sur votre expérience avec {driverName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Ex: Excellent chauffeur, ponctuel et très professionnel. Communication au top tout au long de la mission."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-2 text-right">
              {comment.length}/500 caractères
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        {onClose && (
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || selectedTags.length === 0 || isSubmitting}
          size="lg"
        >
          {isSubmitting ? "Envoi en cours..." : "Valider mon avis"}
        </Button>
      </div>
    </div>
  )
}
