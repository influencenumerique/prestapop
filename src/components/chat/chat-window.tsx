"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePusherEvent } from "@/hooks/use-pusher"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  Loader2,
  MoreVertical,
  Check,
  CheckCheck
} from "lucide-react"
import { cn } from "@/lib/utils"

interface User {
  id: string
  name: string | null
  image: string | null
}

interface Message {
  id: string
  content: string
  senderId: string
  receiverId?: string | null
  createdAt: string
  readAt?: string | null
  sender: User
  receiver?: User | null
}

interface TypingUser {
  userId: string
  userName: string
}

interface ChatWindowProps {
  conversationId: string
  currentUserId: string
  participants: User[]
  initialMessages?: Message[]
}

export function ChatWindow({
  conversationId,
  currentUserId,
  participants,
  initialMessages = [],
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [showMentions, setShowMentions] = useState(false)
  const [mentionFilter, setMentionFilter] = useState("")
  const [cursorPosition, setCursorPosition] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTypingRef = useRef(false)

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Listen for new messages
  usePusherEvent<{ message: Message }>(
    `conversation-${conversationId}`,
    "new-message",
    (data) => {
      if (data.message.senderId !== currentUserId) {
        setMessages(prev => [...prev, data.message])
      }
    }
  )

  // Listen for typing indicators
  usePusherEvent<{ userId: string; userName: string; isTyping: boolean }>(
    `conversation-${conversationId}`,
    "typing",
    (data) => {
      if (data.userId === currentUserId) return

      setTypingUsers(prev => {
        if (data.isTyping) {
          if (!prev.find(u => u.userId === data.userId)) {
            return [...prev, { userId: data.userId, userName: data.userName }]
          }
          return prev
        } else {
          return prev.filter(u => u.userId !== data.userId)
        }
      })
    }
  )

  // Send typing indicator
  const sendTypingIndicator = useCallback(async (isTyping: boolean) => {
    if (lastTypingRef.current === isTyping) return
    lastTypingRef.current = isTyping

    try {
      await fetch("/api/messages/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, isTyping }),
      })
    } catch (error) {
      console.error("Failed to send typing indicator:", error)
    }
  }, [conversationId])

  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewMessage(value)
    setCursorPosition(e.target.selectionStart || 0)

    // Typing indicator logic
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    if (value.length > 0) {
      sendTypingIndicator(true)
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false)
      }, 2000)
    } else {
      sendTypingIndicator(false)
    }

    // Check for @mention trigger
    const lastAtIndex = value.lastIndexOf("@", cursorPosition)
    if (lastAtIndex !== -1 && lastAtIndex < cursorPosition) {
      const textAfterAt = value.slice(lastAtIndex + 1, cursorPosition)
      if (!textAfterAt.includes(" ")) {
        setShowMentions(true)
        setMentionFilter(textAfterAt.toLowerCase())
        return
      }
    }
    setShowMentions(false)
  }

  // Filter participants for mentions
  const filteredParticipants = participants.filter(
    p => p.id !== currentUserId &&
    (p.name?.toLowerCase().includes(mentionFilter) || mentionFilter === "")
  )

  // Insert mention
  const insertMention = (user: User) => {
    const lastAtIndex = newMessage.lastIndexOf("@", cursorPosition)
    const beforeAt = newMessage.slice(0, lastAtIndex)
    const afterCursor = newMessage.slice(cursorPosition)
    const mention = `@${user.name || "user"} `

    setNewMessage(beforeAt + mention + afterCursor)
    setShowMentions(false)
    inputRef.current?.focus()
  }

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || sending) return

    const content = newMessage.trim()
    setNewMessage("")
    setSending(true)
    sendTypingIndicator(false)

    // Optimistic update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
      sender: { id: currentUserId, name: null, image: null },
    }
    setMessages(prev => [...prev, optimisticMessage])

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          content,
          receiverId: participants.find(p => p.id !== currentUserId)?.id,
        }),
      })

      if (!res.ok) throw new Error("Failed to send message")

      const { message } = await res.json()

      // Replace optimistic message with real one
      setMessages(prev =>
        prev.map(m => m.id === optimisticMessage.id ? message : m)
      )
    } catch (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
      console.error("Failed to send message:", error)
    } finally {
      setSending(false)
    }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === "Escape") {
      setShowMentions(false)
    }
  }

  // Render mention in message
  const renderMessageContent = (content: string) => {
    const mentionRegex = /@(\w+)/g
    const parts = content.split(mentionRegex)

    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return (
          <span key={i} className="text-primary font-medium bg-primary/10 px-1 rounded">
            @{part}
          </span>
        )
      }
      return part
    })
  }

  const getInitials = (name: string | null) => {
    if (!name) return "?"
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwn = message.senderId === currentUserId

          return (
            <div
              key={message.id}
              className={cn(
                "flex gap-2",
                isOwn ? "flex-row-reverse" : "flex-row"
              )}
            >
              {!isOwn && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={message.sender.image || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(message.sender.name)}
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={cn(
                  "max-w-[70%] rounded-2xl px-4 py-2",
                  isOwn
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                )}
              >
                {!isOwn && message.sender.name && (
                  <p className="text-xs font-medium mb-1 opacity-70">
                    {message.sender.name}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">
                  {renderMessageContent(message.content)}
                </p>
                <div className={cn(
                  "flex items-center gap-1 mt-1",
                  isOwn ? "justify-end" : "justify-start"
                )}>
                  <span className="text-[10px] opacity-50">
                    {new Date(message.createdAt).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {isOwn && (
                    message.readAt ? (
                      <CheckCheck className="h-3 w-3 text-blue-400" />
                    ) : (
                      <Check className="h-3 w-3 opacity-50" />
                    )
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span>
              {typingUsers.length === 1
                ? `${typingUsers[0].userName} écrit...`
                : `${typingUsers.length} personnes écrivent...`}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="relative border-t p-4">
        {/* Mentions dropdown */}
        {showMentions && filteredParticipants.length > 0 && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredParticipants.map(user => (
              <button
                key={user.id}
                className="w-full flex items-center gap-2 p-2 hover:bg-muted transition-colors text-left"
                onClick={() => insertMention(user)}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.image || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{user.name || "Utilisateur"}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Écrivez un message... (@pour mentionner)"
            className="flex-1"
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            size="icon"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
