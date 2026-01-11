"use client"

import { useState, ReactNode } from "react"
import { useSwipeable } from "react-swipeable"
import { cn } from "@/lib/utils"
import { Check, X, Loader2 } from "lucide-react"

interface SwipeableCardProps {
  children: ReactNode
  onSwipeLeft?: () => void | Promise<void>
  onSwipeRight?: () => void | Promise<void>
  leftLabel?: string
  rightLabel?: string
  leftColor?: string
  rightColor?: string
  threshold?: number
  disabled?: boolean
  className?: string
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftLabel = "Refuser",
  rightLabel = "Valider",
  leftColor = "bg-red-500",
  rightColor = "bg-green-500",
  threshold = 100,
  disabled = false,
  className,
}: SwipeableCardProps) {
  const [offsetX, setOffsetX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [isActioning, setIsActioning] = useState<"left" | "right" | null>(null)

  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (disabled || isActioning) return
      setIsSwiping(true)
      setOffsetX(e.deltaX)
    },
    onSwipedLeft: async () => {
      if (disabled || isActioning || !onSwipeLeft) {
        setOffsetX(0)
        setIsSwiping(false)
        return
      }

      if (Math.abs(offsetX) > threshold) {
        setIsActioning("left")
        try {
          await onSwipeLeft()
        } finally {
          setIsActioning(null)
          setOffsetX(0)
        }
      } else {
        setOffsetX(0)
      }
      setIsSwiping(false)
    },
    onSwipedRight: async () => {
      if (disabled || isActioning || !onSwipeRight) {
        setOffsetX(0)
        setIsSwiping(false)
        return
      }

      if (Math.abs(offsetX) > threshold) {
        setIsActioning("right")
        try {
          await onSwipeRight()
        } finally {
          setIsActioning(null)
          setOffsetX(0)
        }
      } else {
        setOffsetX(0)
      }
      setIsSwiping(false)
    },
    onSwiped: () => {
      if (!isActioning) {
        setOffsetX(0)
        setIsSwiping(false)
      }
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: true,
  })

  const progress = Math.min(Math.abs(offsetX) / threshold, 1)
  const direction = offsetX > 0 ? "right" : "left"
  const isTriggered = progress >= 1

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      {/* Background indicators */}
      <div className="absolute inset-0 flex">
        {/* Left (reject) background */}
        <div
          className={cn(
            "flex-1 flex items-center justify-start pl-4 transition-opacity",
            leftColor,
            direction === "left" ? "opacity-100" : "opacity-0"
          )}
          style={{ opacity: direction === "left" ? progress : 0 }}
        >
          {isActioning === "left" ? (
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          ) : (
            <div className="flex items-center gap-2 text-white">
              <X className={cn("h-8 w-8 transition-transform", isTriggered && "scale-125")} />
              <span className="font-medium">{leftLabel}</span>
            </div>
          )}
        </div>

        {/* Right (validate) background */}
        <div
          className={cn(
            "flex-1 flex items-center justify-end pr-4 transition-opacity",
            rightColor,
            direction === "right" ? "opacity-100" : "opacity-0"
          )}
          style={{ opacity: direction === "right" ? progress : 0 }}
        >
          {isActioning === "right" ? (
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          ) : (
            <div className="flex items-center gap-2 text-white">
              <span className="font-medium">{rightLabel}</span>
              <Check className={cn("h-8 w-8 transition-transform", isTriggered && "scale-125")} />
            </div>
          )}
        </div>
      </div>

      {/* Swipeable content */}
      <div
        {...handlers}
        className={cn(
          "relative bg-card transition-transform touch-pan-y",
          !isSwiping && !isActioning && "transition-all duration-200",
          disabled && "pointer-events-none opacity-50"
        )}
        style={{
          transform: `translateX(${isActioning ? (isActioning === "left" ? -300 : 300) : offsetX}px)`,
        }}
      >
        {children}
      </div>

      {/* Swipe hint indicator (mobile only) */}
      {!disabled && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 md:hidden">
          <div className="w-8 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
      )}
    </div>
  )
}
