"use client"

import { useEffect, useRef } from "react"
import Pusher from "pusher-js"

let pusherInstance: Pusher | null = null

function getPusherInstance() {
  if (!pusherInstance) {
    pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })
  }
  return pusherInstance
}

export function usePusherChannel(channelName: string) {
  const channelRef = useRef<ReturnType<Pusher["subscribe"]> | null>(null)

  useEffect(() => {
    const pusher = getPusherInstance()
    channelRef.current = pusher.subscribe(channelName)

    return () => {
      if (channelRef.current) {
        pusher.unsubscribe(channelName)
        channelRef.current = null
      }
    }
  }, [channelName])

  return channelRef.current
}

export function usePusherEvent<T>(
  channelName: string,
  eventName: string,
  callback: (data: T) => void
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const pusher = getPusherInstance()
    const channel = pusher.subscribe(channelName)

    const handler = (data: T) => {
      callbackRef.current(data)
    }

    channel.bind(eventName, handler)

    return () => {
      channel.unbind(eventName, handler)
    }
  }, [channelName, eventName])
}
