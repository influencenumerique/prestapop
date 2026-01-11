"use client"

import { useState, useEffect } from "react"
import { usePusherEvent } from "@/hooks/use-pusher"
import { Badge } from "@/components/ui/badge"
import { MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface UnreadBadgeProps {
  userId: string
  initialCount?: number
  className?: string
  showIcon?: boolean
}

export function UnreadBadge({
  userId,
  initialCount = 0,
  className,
  showIcon = true,
}: UnreadBadgeProps) {
  const [count, setCount] = useState(initialCount)

  // Fetch initial count
  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch("/api/messages/unread")
        if (res.ok) {
          const data = await res.json()
          setCount(data.count)
        }
      } catch (error) {
        console.error("Failed to fetch unread count:", error)
      }
    }
    fetchUnread()
  }, [])

  // Listen for new notifications
  usePusherEvent<{ conversationId: string }>(
    `user-${userId}`,
    "new-message-notification",
    () => {
      setCount(prev => prev + 1)
    }
  )

  // Reset count when messages are read
  const resetCount = () => setCount(0)

  if (count === 0) {
    return showIcon ? (
      <div className={cn("relative", className)}>
        <MessageCircle className="h-5 w-5" />
      </div>
    ) : null
  }

  return (
    <div className={cn("relative", className)}>
      {showIcon && <MessageCircle className="h-5 w-5" />}
      <Badge
        variant="destructive"
        className={cn(
          "absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center p-0 text-xs",
          !showIcon && "relative top-0 right-0"
        )}
      >
        {count > 99 ? "99+" : count}
      </Badge>
    </div>
  )
}

// Hook version for more flexibility
export function useUnreadCount(userId: string) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch("/api/messages/unread")
        if (res.ok) {
          const data = await res.json()
          setCount(data.count)
        }
      } catch (error) {
        console.error("Failed to fetch unread count:", error)
      }
    }
    fetchUnread()
  }, [])

  usePusherEvent<{ conversationId: string }>(
    `user-${userId}`,
    "new-message-notification",
    () => {
      setCount(prev => prev + 1)
    }
  )

  const reset = () => setCount(0)
  const decrement = (by = 1) => setCount(prev => Math.max(0, prev - by))

  return { count, reset, decrement }
}
