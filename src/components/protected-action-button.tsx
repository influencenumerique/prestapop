"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { KbisUploadModal } from "./kbis-upload-modal"
import { AlertCircle } from "lucide-react"

interface ProtectedActionButtonProps {
  userType: "driver" | "company"
  hasKbis: boolean
  kbisVerified: boolean
  children: React.ReactNode
  onClick?: () => void
  href?: string
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  disabled?: boolean
}

export function ProtectedActionButton({
  userType,
  hasKbis,
  kbisVerified,
  children,
  onClick,
  href,
  variant = "default",
  size = "default",
  className,
  disabled = false,
}: ProtectedActionButtonProps) {
  const [showKbisModal, setShowKbisModal] = useState(false)
  const [showVerificationMessage, setShowVerificationMessage] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    // If no KBIS uploaded, show modal
    if (!hasKbis) {
      e.preventDefault()
      setShowKbisModal(true)
      return
    }

    // If KBIS uploaded but not verified, show message
    if (!kbisVerified) {
      e.preventDefault()
      setShowVerificationMessage(true)
      setTimeout(() => setShowVerificationMessage(false), 3000)
      return
    }

    // Otherwise, proceed with action
    if (onClick) {
      onClick()
    } else if (href) {
      window.location.href = href
    }
  }

  return (
    <>
      {href && hasKbis && kbisVerified ? (
        <a href={href}>
          <Button
            variant={variant}
            size={size}
            className={className}
            disabled={disabled}
          >
            {children}
          </Button>
        </a>
      ) : (
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={handleClick}
          disabled={disabled}
        >
          {children}
        </Button>
      )}

      {showVerificationMessage && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-yellow-900">
                Vérification en cours
              </p>
              <p className="text-xs text-yellow-800 mt-1">
                Votre KBIS est en cours de vérification. Vous pourrez {userType === "driver" ? "postuler aux missions" : "publier des missions"} dès validation (sous 24h).
              </p>
            </div>
          </div>
        </div>
      )}

      <KbisUploadModal
        open={showKbisModal}
        onOpenChange={setShowKbisModal}
        userType={userType}
      />
    </>
  )
}
