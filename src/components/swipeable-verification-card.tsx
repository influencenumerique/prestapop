"use client"

import { useState } from "react"
import { SwipeableCard } from "./swipeable-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  FileText,
  Building2,
  Truck,
  ChevronRight,
  MapPin,
  Mail
} from "lucide-react"
import { cn } from "@/lib/utils"

interface VerificationUser {
  id: string
  name: string | null
  email: string
  image: string | null
  role: "DRIVER" | "COMPANY"
  status: string
  company?: { companyName: string } | null
  driverProfile?: { city?: string | null } | null
  createdAt: string
}

interface SwipeableVerificationCardProps {
  user: VerificationUser
  onValidate: (userId: string) => Promise<void>
  onReject: (userId: string) => Promise<void>
  onViewDetails: (user: VerificationUser) => void
  className?: string
}

export function SwipeableVerificationCard({
  user,
  onValidate,
  onReject,
  onViewDetails,
  className,
}: SwipeableVerificationCardProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleValidate = async () => {
    setIsProcessing(true)
    try {
      await onValidate(user.id)
      toast.success(`${user.name || user.email} validé`)
    } catch (error) {
      toast.error("Erreur lors de la validation")
      throw error
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    setIsProcessing(true)
    try {
      await onReject(user.id)
      toast.success(`${user.name || user.email} refusé`)
    } catch (error) {
      toast.error("Erreur lors du refus")
      throw error
    } finally {
      setIsProcessing(false)
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_VERIF":
        return <Badge variant="secondary" className="bg-orange-100 text-orange-700">En attente</Badge>
      case "VERIFIED":
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Vérifié</Badge>
      case "REJECTED":
        return <Badge variant="secondary" className="bg-red-100 text-red-700">Refusé</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const RoleIcon = user.role === "COMPANY" ? Building2 : Truck

  return (
    <SwipeableCard
      onSwipeRight={handleValidate}
      onSwipeLeft={handleReject}
      rightLabel="Valider"
      leftLabel="Refuser"
      disabled={isProcessing}
      className={className}
    >
      <div
        className="p-4 border rounded-lg bg-card cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => onViewDetails(user)}
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={user.image || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">
                {user.name || user.email}
              </h3>
              <RoleIcon className={cn(
                "h-4 w-4 shrink-0",
                user.role === "COMPANY" ? "text-purple-500" : "text-emerald-500"
              )} />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Mail className="h-3 w-3" />
              <span className="truncate">{user.email}</span>
            </div>

            {(user.company?.companyName || user.driverProfile?.city) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                {user.company?.companyName ? (
                  <>
                    <Building2 className="h-3 w-3" />
                    <span className="truncate">{user.company.companyName}</span>
                  </>
                ) : user.driverProfile?.city ? (
                  <>
                    <MapPin className="h-3 w-3" />
                    <span>{user.driverProfile.city}</span>
                  </>
                ) : null}
              </div>
            )}
          </div>

          {/* Status & arrow */}
          <div className="flex items-center gap-2 shrink-0">
            {getStatusBadge(user.status)}
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {/* Swipe hint for mobile */}
        <p className="text-xs text-muted-foreground mt-3 text-center md:hidden">
          ← Glissez pour refuser • Glissez pour valider →
        </p>
      </div>
    </SwipeableCard>
  )
}
