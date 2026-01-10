"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export type BadgeType =
  | "PUNCTUALITY_CHAMPION"
  | "CAREFUL_EXPERT"
  | "SPEED_DEMON"
  | "COMMUNICATION_STAR"
  | "TOP_10_REGION"
  | "TOP_3_REGION"
  | "FIRST_100_DELIVERIES"
  | "FIRST_500_DELIVERIES"
  | "PERFECT_RATING"
  | "RISING_STAR"

interface BadgeConfig {
  emoji: string
  label: string
  color: string
  description: string
}

export const badgeConfig: Record<BadgeType, BadgeConfig> = {
  PUNCTUALITY_CHAMPION: {
    emoji: "🏆",
    label: "Champion Ponctualité",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    description: "95%+ des livraisons à l'heure",
  },
  CAREFUL_EXPERT: {
    emoji: "📦",
    label: "Expert Colis Fragiles",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    description: "Reconnu pour manipuler avec soin",
  },
  SPEED_DEMON: {
    emoji: "🚀",
    label: "Éclair",
    color: "bg-purple-100 text-purple-800 border-purple-300",
    description: "Livraisons ultra-rapides",
  },
  COMMUNICATION_STAR: {
    emoji: "⭐",
    label: "Star Communication",
    color: "bg-orange-100 text-orange-800 border-orange-300",
    description: "Excellente communication client",
  },
  TOP_10_REGION: {
    emoji: "🥇",
    label: "Top 10",
    color: "bg-amber-100 text-amber-800 border-amber-400",
    description: "Top 10 de sa région",
  },
  TOP_3_REGION: {
    emoji: "👑",
    label: "Top 3",
    color: "bg-yellow-200 text-yellow-900 border-yellow-500",
    description: "Top 3 de sa région",
  },
  FIRST_100_DELIVERIES: {
    emoji: "💯",
    label: "100 Livraisons",
    color: "bg-green-100 text-green-800 border-green-300",
    description: "100 livraisons effectuées",
  },
  FIRST_500_DELIVERIES: {
    emoji: "🎖️",
    label: "500 Livraisons",
    color: "bg-emerald-100 text-emerald-800 border-emerald-400",
    description: "500 livraisons effectuées",
  },
  PERFECT_RATING: {
    emoji: "💎",
    label: "Note Parfaite",
    color: "bg-cyan-100 text-cyan-900 border-cyan-400",
    description: "10 missions consécutives à 5/5",
  },
  RISING_STAR: {
    emoji: "🌟",
    label: "Étoile Montante",
    color: "bg-pink-100 text-pink-800 border-pink-300",
    description: "Nouveau talent prometteur",
  },
}

interface DriverBadgesProps {
  badges: BadgeType[]
  size?: "sm" | "md" | "lg"
  maxDisplay?: number
  showTooltips?: boolean
}

export function DriverBadges({ badges, size = "md", maxDisplay, showTooltips = true }: DriverBadgesProps) {
  const displayedBadges = maxDisplay ? badges.slice(0, maxDisplay) : badges
  const remainingCount = maxDisplay && badges.length > maxDisplay ? badges.length - maxDisplay : 0

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-3 py-1 gap-1.5",
    lg: "text-base px-4 py-1.5 gap-2",
  }

  const emojiSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  if (displayedBadges.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {displayedBadges.map((badgeType) => {
        const config = badgeConfig[badgeType]
        const badgeContent = (
          <Badge
            key={badgeType}
            variant="outline"
            className={`${config.color} ${sizeClasses[size]} font-semibold border-2`}
          >
            <span className={emojiSizes[size]}>{config.emoji}</span>
            <span>{config.label}</span>
          </Badge>
        )

        if (showTooltips) {
          return (
            <TooltipProvider key={badgeType}>
              <Tooltip>
                <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
                <TooltipContent>
                  <p>{config.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        }

        return badgeContent
      })}

      {remainingCount > 0 && (
        <Badge variant="outline" className={`${sizeClasses[size]} bg-gray-100 text-gray-700 border-gray-300`}>
          +{remainingCount}
        </Badge>
      )}
    </div>
  )
}

interface RegionalRankingBadgeProps {
  position: number
  region?: string
  size?: "sm" | "md" | "lg"
}

export function RegionalRankingBadge({ position, region, size = "md" }: RegionalRankingBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  }

  const getColorClass = () => {
    if (position <= 3) return "bg-gradient-to-r from-yellow-200 to-yellow-300 text-yellow-900 border-yellow-500"
    if (position <= 10) return "bg-amber-100 text-amber-800 border-amber-300"
    return "bg-gray-100 text-gray-800 border-gray-300"
  }

  const getEmoji = () => {
    if (position === 1) return "🥇"
    if (position === 2) return "🥈"
    if (position === 3) return "🥉"
    return "🏅"
  }

  return (
    <Badge variant="outline" className={`${getColorClass()} ${sizeClasses[size]} font-bold border-2 gap-1.5`}>
      <span>{getEmoji()}</span>
      <span>
        #{position} {region || "région"}
      </span>
    </Badge>
  )
}
