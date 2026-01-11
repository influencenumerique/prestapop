"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Loader2,
  Eye,
  Trash2,
  X,
} from "lucide-react"
import { REQUIRED_DOCUMENTS, type DocumentType } from "@/lib/document-config"

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "prestapop_docs"

interface UploadedDoc {
  type: DocumentType
  url: string
  format: string
}

interface DocState {
  url: string | null
  status: "MISSING" | "OK"
  uploading: boolean
}

interface DocumentUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: "DRIVER" | "COMPANY"
  onSuccess?: () => void
}

export function DocumentUploadModal({
  open,
  onOpenChange,
  role,
  onSuccess,
}: DocumentUploadModalProps) {
  const router = useRouter()
  const requiredDocs = REQUIRED_DOCUMENTS[role]

  // Initialize state for each document type
  const initialState = requiredDocs.reduce((acc, doc) => {
    acc[doc.type] = { url: null, status: "MISSING", uploading: false }
    return acc
  }, {} as Record<DocumentType, DocState>)

  const [docsState, setDocsState] = useState<Record<DocumentType, DocState>>(initialState)
  const [submitting, setSubmitting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState<DocumentType | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const handleUpload = useCallback(async (file: File, type: DocumentType) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format non supporté. Utilisez PDF, JPG ou PNG.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 5 Mo)")
      return
    }

    setDocsState(prev => ({
      ...prev,
      [type]: { ...prev[type], uploading: true }
    }))

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)
      formData.append("folder", `documents/${type.toLowerCase()}`)

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
        { method: "POST", body: formData }
      )

      if (!res.ok) {
        throw new Error("Erreur upload")
      }

      const data = await res.json()

      setDocsState(prev => ({
        ...prev,
        [type]: {
          url: data.secure_url,
          status: "OK",
          uploading: false,
        }
      }))

      toast.success("Document uploadé avec succès")
    } catch (err) {
      console.error("Upload error:", err)
      toast.error("Erreur lors de l'upload. Réessayez.")
      setDocsState(prev => ({
        ...prev,
        [type]: { ...prev[type], uploading: false }
      }))
    }
  }, [])

  const handleDrag = useCallback((e: React.DragEvent, type: DocumentType, active: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(active ? type : null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, type: DocumentType) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(null)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleUpload(files[0], type)
    }
  }, [handleUpload])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: DocumentType) => {
    const files = e.target.files
    if (files && files[0]) {
      handleUpload(files[0], type)
    }
    e.target.value = ""
  }, [handleUpload])

  const removeDoc = (type: DocumentType) => {
    setDocsState(prev => ({
      ...prev,
      [type]: { url: null, status: "MISSING", uploading: false }
    }))
  }

  const allDocsUploaded = requiredDocs.every(doc => docsState[doc.type]?.status === "OK")

  const handleSubmit = async () => {
    if (!allDocsUploaded) {
      toast.error("Veuillez uploader tous les documents requis")
      return
    }

    setSubmitting(true)
    try {
      const docsPayload = requiredDocs.map(doc => ({
        type: doc.type,
        url: docsState[doc.type].url,
        status: "PENDING"
      }))

      const res = await fetch("/api/verification-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docs: docsPayload }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erreur lors de l'envoi")
      }

      toast.success("Documents envoyés ! Validation sous 24-48h.")
      router.refresh()
      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const isPdf = (url: string) => url.toLowerCase().includes(".pdf") || url.includes("/raw/")

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Documents requis
            </DialogTitle>
            <DialogDescription>
              Uploadez tous les documents pour activer votre compte.
              {role === "DRIVER" ? " (4 documents)" : " (2 documents)"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {requiredDocs.map(({ type, label, accept }) => {
              const docState = docsState[type]
              const isUploaded = docState?.status === "OK"
              const isUploading = docState?.uploading

              return (
                <div
                  key={type}
                  className="border rounded-lg p-4 space-y-3"
                >
                  {/* Header avec Checkbox, Label et Badge */}
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isUploaded}
                      disabled
                      className={isUploaded ? "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" : ""}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{label}</p>
                    </div>
                    {isUploaded ? (
                      <Badge className="bg-green-500 hover:bg-green-600 text-white">
                        Validé
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        Requis
                      </Badge>
                    )}
                  </div>

                  {/* Zone d'upload ou Preview */}
                  {isUploaded && docState.url ? (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      {isPdf(docState.url) ? (
                        <FileText className="h-8 w-8 text-red-500 shrink-0" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-blue-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-green-600">
                          Document uploadé
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPreviewUrl(docState.url)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeDoc(type)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`relative w-full border-2 border-dashed rounded-lg h-20 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                        dragActive === type
                          ? "border-primary bg-primary/10"
                          : "border-muted-foreground/25 hover:border-primary/50"
                      }`}
                      onClick={() => fileInputRefs.current[type]?.click()}
                      onDragEnter={(e) => handleDrag(e, type, true)}
                      onDragLeave={(e) => handleDrag(e, type, false)}
                      onDragOver={(e) => handleDrag(e, type, true)}
                      onDrop={(e) => handleDrop(e, type)}
                    >
                      <input
                        ref={(el) => { fileInputRefs.current[type] = el }}
                        type="file"
                        accept={accept}
                        className="hidden"
                        onChange={(e) => handleFileInput(e, type)}
                        disabled={isUploading}
                      />
                      {isUploading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          <span className="text-sm text-muted-foreground mt-1">Upload...</span>
                        </>
                      ) : dragActive === type ? (
                        <>
                          <Upload className="h-5 w-5 text-primary" />
                          <span className="text-sm text-primary mt-1">Déposez ici</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground mt-1">
                            PDF, JPG, PNG (max 5 Mo)
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!allDocsUploaded || submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Envoi..." : "Envoyer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Preview */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Aperçu
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPreviewUrl(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center min-h-[400px] bg-muted rounded-lg overflow-hidden">
            {previewUrl && isPdf(previewUrl) ? (
              <iframe
                src={previewUrl}
                className="w-full h-[60vh]"
                title="Aperçu PDF"
              />
            ) : previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Aperçu document"
                className="max-w-full max-h-[60vh] object-contain"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
