"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { XCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface CancelMissionButtonProps {
  jobId: string
}

export function CancelMissionButton({ jobId }: CancelMissionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleCancel = async () => {
    setIsLoading(true)
    toast.loading("Annulation de la mission...", { id: "cancel-mission" })

    try {
      const response = await fetch(`/api/jobs/${jobId}/cancel`, {
        method: "PATCH",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'annulation")
      }

      toast.success("Mission annulée avec succès", { id: "cancel-mission" })
      setIsOpen(false)

      // Refresh the page to show updated status
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'annulation",
        { id: "cancel-mission" }
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="destructive"
        className="w-full gap-2"
        size="lg"
        onClick={() => setIsOpen(true)}
      >
        <XCircle className="h-4 w-4" />
        Annuler cette mission
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler cette mission</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir annuler cette mission ? Cette action est
              irréversible. Les candidats seront notifiés de l&apos;annulation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Retour
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Annulation...
                </>
              ) : (
                "Confirmer l'annulation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
