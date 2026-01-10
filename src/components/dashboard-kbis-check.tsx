"use client"

import { useState, useEffect } from "react"
import { KbisUploadModal } from "./kbis-upload-modal"

interface DashboardKbisCheckProps {
  userType: "driver" | "company"
  hasKbis: boolean
  isFirstAction: boolean
}

export function DashboardKbisCheck({
  userType,
  hasKbis,
  isFirstAction,
}: DashboardKbisCheckProps) {
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Show modal if user tries to do their first action without KBIS
    if (isFirstAction && !hasKbis) {
      setShowModal(true)
    }
  }, [isFirstAction, hasKbis])

  return (
    <KbisUploadModal
      open={showModal}
      onOpenChange={setShowModal}
      userType={userType}
      onSuccess={() => {
        // Refresh the page after successful upload
        window.location.reload()
      }}
    />
  )
}
