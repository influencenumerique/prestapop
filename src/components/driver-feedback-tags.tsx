"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export type FeedbackTag =
  | "PUNCTUAL"
  | "CAREFUL"
  | "COMMUNICATIVE"
  | "FAST"
  | "PRECISE"
  | "FRIENDLY"
  | "RESOURCEFUL"
  | "RESPONSIVE"
  | "PROFESSIONAL"
  | "RELIABLE"

interface FeedbackTagConfig {
  tag: FeedbackTag
  emoji: string
  label: string
}

export const feedbackTags: FeedbackTagConfig[] = [
  { tag: "PUNCTUAL", emoji: "👍", label: "Ponctuel" },
  { tag: "CAREFUL", emoji: "📦", label: "Soigneux" },
  { tag: "COMMUNICATIVE", emoji: "💬", label: "Communicatif" },
  { tag: "FAST", emoji: "⚡", label: "Rapide" },
  { tag: "PRECISE", emoji: "🎯", label: "Précis" },
  { tag: "FRIENDLY", emoji: "😊", label: "Souriant" },
  { tag: "RESOURCEFUL", emoji: "🔧", label: "Débrouillard" },
  { tag: "RESPONSIVE", emoji: "📱", label: "Réactif" },
  { tag: "PROFESSIONAL", emoji: "👔", label: "Professionnel" },
  { tag: "RELIABLE", emoji: "✅", label: "Fiable" },
]

interface DriverFeedbackTagsProps {
  jobId?: string
  driverId?: string
  onSubmit?: (selectedTags: FeedbackTag[]) => void
  readonly?: boolean
  selectedTags?: FeedbackTag[]
}

export function DriverFeedbackTags({
  jobId,
  driverId,
  onSubmit,
  readonly = false,
  selectedTags: initialSelectedTags = [],
}: DriverFeedbackTagsProps) {
  const [selectedTags, setSelectedTags] = useState<FeedbackTag[]>(initialSelectedTags)

  const toggleTag = (tag: FeedbackTag) => {
    if (readonly) return

    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(selectedTags)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {readonly ? "Points forts du chauffeur" : "Comment s'est passée la mission ?"}
        </CardTitle>
        <CardDescription>
          {readonly
            ? "Les qualités reconnues par les entreprises"
            : "Sélectionnez les qualités du chauffeur (plusieurs choix possibles)"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {feedbackTags.map((tagConfig) => {
            const isSelected = selectedTags.includes(tagConfig.tag)
            return (
              <button
                key={tagConfig.tag}
                onClick={() => toggleTag(tagConfig.tag)}
                disabled={readonly}
                className={`
                  flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
                  ${readonly ? "cursor-default" : "cursor-pointer hover:border-primary"}
                  ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border bg-background"
                  }
                `}
              >
                <span className="text-3xl mb-2">{tagConfig.emoji}</span>
                <span className="text-sm font-medium text-center">{tagConfig.label}</span>
              </button>
            )
          })}
        </div>

        {!readonly && (
          <div className="flex justify-end pt-4">
            <Button onClick={handleSubmit} disabled={selectedTags.length === 0} size="lg">
              Valider ma notation ({selectedTags.length} qualité{selectedTags.length > 1 ? "s" : ""})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface CompactFeedbackTagsProps {
  tags: Array<{ tag: FeedbackTag; percentage: number }>
  maxDisplay?: number
}

export function CompactFeedbackTags({ tags, maxDisplay = 3 }: CompactFeedbackTagsProps) {
  const sortedTags = [...tags].sort((a, b) => b.percentage - a.percentage).slice(0, maxDisplay)

  if (sortedTags.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {sortedTags.map(({ tag, percentage }) => {
        const config = feedbackTags.find((t) => t.tag === tag)
        if (!config) return null

        return (
          <Badge
            key={tag}
            variant="secondary"
            className="gap-1 px-3 py-1 text-sm font-medium border border-primary/20"
          >
            <span>{config.emoji}</span>
            <span>{config.label}</span>
            <span className="text-primary font-semibold">{percentage}%</span>
          </Badge>
        )
      })}
    </div>
  )
}
