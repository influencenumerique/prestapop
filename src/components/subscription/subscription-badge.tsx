"use client"

import { Badge } from "@/components/ui/badge"
import { Crown, Star, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface SubscriptionBadgeProps {
  tier: "FREE" | "PRO" | "BUSINESS" | "ENTERPRISE"
  size?: "sm" | "md" | "lg"
  variant?: "driver" | "company"
}

export function SubscriptionBadge({
  tier,
  size = "md",
  variant = "driver",
}: SubscriptionBadgeProps) {
  if (tier === "FREE") return null

  const config = {
    PRO: {
      label: "Pro",
      icon: Star,
      className: variant === "driver"
        ? "bg-emerald-100 text-emerald-700 border-emerald-300"
        : "bg-blue-100 text-blue-700 border-blue-300",
    },
    BUSINESS: {
      label: "Business",
      icon: Crown,
      className: "bg-amber-100 text-amber-700 border-amber-300",
    },
    ENTERPRISE: {
      label: "Enterprise",
      icon: Sparkles,
      className: "bg-purple-100 text-purple-700 border-purple-300",
    },
  }

  const { label, icon: Icon, className } = config[tier] || config.PRO

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-0.5",
    lg: "text-base px-3 py-1",
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold",
        className,
        sizeClasses[size]
      )}
    >
      <Icon className={cn("mr-1", iconSizes[size])} />
      {label}
    </Badge>
  )
}
