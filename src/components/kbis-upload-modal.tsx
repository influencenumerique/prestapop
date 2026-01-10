"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface KbisUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userType: "driver" | "company"
  onSuccess?: () => void
}

export function KbisUploadModal({
  open,
  onOpenChange,
  userType,
  onSuccess,
}: KbisUploadModalProps) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [kbisFile, setKbisFile] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError("")

    // Validate file type
    const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
    if (!validTypes.includes(file.type)) {
      setError("Format invalide. Utilisez PDF, JPG ou PNG.")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Fichier trop volumineux (max 5MB).")
      return
    }

    setKbisFile(file)
  }

  const handleUpload = async () => {
    if (!kbisFile) {
      setError("Veuillez sélectionner un fichier")
      return
    }

    setUploading(true)
    setError("")

    try {
      // Upload KBIS
      const formData = new FormData()
      formData.append("kbis", kbisFile)

      const uploadRes = await fetch("/api/upload/kbis", {
        method: "POST",
        body: formData,
      })

      if (!uploadRes.ok) {
        const data = await uploadRes.json()
        throw new Error(data.error || "Erreur lors du téléchargement")
      }

      const { url } = await uploadRes.json()

      // Update profile with KBIS URL
      const updateRes = await fetch(`/api/${userType}/update-kbis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kbisUrl: url }),
      })

      if (!updateRes.ok) {
        throw new Error("Erreur lors de la mise à jour du profil")
      }

      setSuccess(true)
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        }
        router.refresh()
        onOpenChange(false)
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (!uploading) {
      setKbisFile(null)
      setError("")
      setSuccess(false)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Document requis</DialogTitle>
          <DialogDescription>
            {userType === "driver"
              ? "Pour commencer à postuler aux missions, veuillez télécharger votre KBIS d'auto-entrepreneur (moins de 3 mois)."
              : "Pour publier votre première mission, veuillez télécharger le KBIS de votre entreprise (moins de 3 mois)."}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 flex flex-col items-center justify-center gap-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <div className="text-center">
              <p className="font-semibold text-lg">Documents reçus</p>
              <p className="text-sm text-muted-foreground mt-1">
                Validation sous 24 heures
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kbis-file">
                KBIS {userType === "driver" ? "Auto-entrepreneur" : "Entreprise"}
              </Label>
              <Input
                id="kbis-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                disabled={uploading}
              />
              {kbisFile && (
                <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                  <FileText className="h-4 w-4" />
                  <span>{kbisFile.name}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Format accepté: PDF, JPG, PNG (max 5MB)
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-500 bg-red-50 rounded-md">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-xs text-blue-800">
                <strong>Important :</strong> Votre KBIS doit avoir moins de 3 mois.
                Les documents plus anciens seront refusés.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={uploading}
                className="flex-1"
              >
                Plus tard
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!kbisFile || uploading}
                className="flex-1"
              >
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {uploading ? "Envoi..." : "Envoyer"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
