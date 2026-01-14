"use client"

import { cn } from "@/lib/utils"

interface UsageMeterProps {
  label: string
  current: number
  max: number | null
  variant?: "missions" | "applications"
  showUpgradeLink?: boolean
}

export function UsageMeter({
  label,
  current,
  max,
  variant = "missions",
  showUpgradeLink = true,
}: UsageMeterProps) {
  const isUnlimited = max === null
  const percentage = isUnlimited ? 0 : Math.min((current / max) * 100, 100)
  const isNearLimit = !isUnlimited && percentage >= 80
  const isAtLimit = !isUnlimited && current >= max

  const colorClass = variant === "applications" ? "bg-emerald-500" : "bg-blue-500"
  const warningColorClass = isAtLimit
    ? "bg-red-500"
    : isNearLimit
      ? "bg-yellow-500"
      : colorClass

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium">{label}</span>
        <span className={cn(
          "tabular-nums",
          isAtLimit && "text-red-600 font-semibold",
          isNearLimit && !isAtLimit && "text-yellow-600"
        )}>
          {isUnlimited ? (
            <span className="text-green-600">Illimité</span>
          ) : (
            `${current}/${max}`
          )}
        </span>
      </div>

      {!isUnlimited && (
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              warningColorClass
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      {isAtLimit && showUpgradeLink && (
        <p className="text-xs text-red-600">
          Limite atteinte.{" "}
          <a href="/pricing" className="underline font-medium hover:text-red-700">
            Passez à Pro
          </a>
        </p>
      )}

      {isNearLimit && !isAtLimit && showUpgradeLink && (
        <p className="text-xs text-yellow-600">
          Vous approchez de la limite.{" "}
          <a href="/pricing" className="underline font-medium hover:text-yellow-700">
            Voir les plans
          </a>
        </p>
      )}
    </div>
  )
}
