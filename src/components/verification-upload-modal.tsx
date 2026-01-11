"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CldUploadWidget } from "next-cloudinary"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  Loader2,
  X,
  Eye,
  Trash2,
  AlertCircle
} from "lucide-react"

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "prestapop_docs"

interface UploadedDoc {
  type: "SIRET" | "PERMIS" | "ASSURANCE"
  url: string
  publicId: string
  format: string
}

interface VerificationUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userRole: "DRIVER" | "COMPANY"
  existingDocs?: UploadedDoc[]
}

const docConfig = {
  DRIVER: [
    { type: "PERMIS" as const, label: "Permis de conduire", description: "Recto du permis en cours de validité" },
    { type: "ASSURANCE" as const, label: "Attestation d'assurance", description: "Assurance RC Pro ou véhicule" },
  ],
  COMPANY: [
    { type: "SIRET" as const, label: "Extrait KBIS / SIRET", description: "Document de moins de 3 mois" },
    { type: "ASSURANCE" as const, label: "Attestation d'assurance", description: "Assurance RC entreprise" },
  ],
}

export function VerificationUploadModal({
  open,
  onOpenChange,
  userRole,
  existingDocs = [],
}: VerificationUploadModalProps) {
  const router = useRouter()
  const [docs, setDocs] = useState<UploadedDoc[]>(existingDocs)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currentUploadType, setCurrentUploadType] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [widgetAvailable, setWidgetAvailable] = useState(!!CLOUDINARY_CLOUD_NAME)
  const [dragActive, setDragActive] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const requiredDocs = docConfig[userRole]

  // Check if Cloudinary widget can load
  useEffect(() => {
    if (!CLOUDINARY_CLOUD_NAME) {
      console.warn("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME not set, using fallback upload")
      setWidgetAvailable(false)
    }
  }, [])

  const handleUploadSuccess = useCallback((result: any, type: "SIRET" | "PERMIS" | "ASSURANCE") => {
    const info = result.info
    const newDoc: UploadedDoc = {
      type,
      url: info.secure_url,
      publicId: info.public_id,
      format: info.format,
    }

    setDocs(prev => {
      const filtered = prev.filter(d => d.type !== type)
      return [...filtered, newDoc]
    })
    setCurrentUploadType(null)
    toast.success(`${type} uploadé avec succès`)
  }, [])

  // Fallback upload via API when Cloudinary widget unavailable
  const handleFallbackUpload = useCallback(async (file: File, type: "SIRET" | "PERMIS" | "ASSURANCE") => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format non supporté. Utilisez PDF, JPG ou PNG.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 5 Mo)")
      return
    }

    setCurrentUploadType(type)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)
      formData.append("folder", `verification/${type.toLowerCase()}`)

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
        { method: "POST", body: formData }
      )

      if (!res.ok) {
        throw new Error("Erreur upload Cloudinary")
      }

      const data = await res.json()
      const newDoc: UploadedDoc = {
        type,
        url: data.secure_url,
        publicId: data.public_id,
        format: data.format,
      }

      setDocs(prev => {
        const filtered = prev.filter(d => d.type !== type)
        return [...filtered, newDoc]
      })
      toast.success(`${type} uploadé avec succès`)
    } catch (err) {
      console.error("Upload error:", err)
      toast.error("Erreur lors de l'upload. Réessayez.")
    } finally {
      setUploading(false)
      setCurrentUploadType(null)
      setDragActive(null)
    }
  }, [])

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent, type: string, active: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(active ? type : null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, type: "SIRET" | "PERMIS" | "ASSURANCE") => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(null)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFallbackUpload(files[0], type)
    }
  }, [handleFallbackUpload])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: "SIRET" | "PERMIS" | "ASSURANCE") => {
    const files = e.target.files
    if (files && files[0]) {
      handleFallbackUpload(files[0], type)
    }
    // Reset input
    e.target.value = ""
  }, [handleFallbackUpload])

  const removeDoc = (type: string) => {
    setDocs(prev => prev.filter(d => d.type !== type))
  }

  const getDocByType = (type: string) => docs.find(d => d.type === type)

  const allDocsUploaded = requiredDocs.every(doc => getDocByType(doc.type))

  const handleSubmit = async () => {
    if (!allDocsUploaded) {
      toast.error("Veuillez uploader tous les documents requis")
      return
    }

    setSubmitting(true)
    try {
      const docsPayload = docs.map(d => ({
        type: d.type,
        url: d.url,
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
              Vérification de votre compte
            </DialogTitle>
            <DialogDescription>
              Uploadez vos documents pour activer votre compte. Validation sous 24-48h.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {requiredDocs.map(({ type, label, description }) => {
              const doc = getDocByType(type)
              const isUploading = currentUploadType === type

              return (
                <div
                  key={type}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{label}</p>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    {doc ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Uploadé
                      </Badge>
                    ) : (
                      <Badge variant="outline">Requis</Badge>
                    )}
                  </div>

                  {doc ? (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      {isPdf(doc.url) ? (
                        <FileText className="h-8 w-8 text-red-500 shrink-0" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-blue-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {doc.format.toUpperCase()} • {type}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPreviewUrl(doc.url)}
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
                  ) : widgetAvailable ? (
                    <CldUploadWidget
                      uploadPreset={CLOUDINARY_UPLOAD_PRESET}
                      options={{
                        maxFiles: 1,
                        resourceType: "auto",
                        clientAllowedFormats: ["pdf", "jpg", "jpeg", "png"],
                        maxFileSize: 5000000,
                        folder: `verification/${type.toLowerCase()}`,
                        sources: ["local", "camera"],
                        multiple: false,
                        showAdvancedOptions: false,
                        singleUploadAutoClose: true,
                      }}
                      onOpen={() => setCurrentUploadType(type)}
                      onClose={() => setCurrentUploadType(null)}
                      onSuccess={(result) => handleUploadSuccess(result, type)}
                      onError={(error) => {
                        console.error("Cloudinary upload error:", error)
                        setCurrentUploadType(null)
                        toast.error("Erreur lors de l'upload. Réessayez.")
                      }}
                    >
                      {({ open }) => (
                        <div
                          className={`w-full border-2 border-dashed rounded-lg h-24 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                            dragActive === type
                              ? "border-primary bg-primary/10"
                              : "border-muted-foreground/25 hover:border-primary/50"
                          }`}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            open()
                          }}
                          onDragEnter={(e) => handleDrag(e, type, true)}
                          onDragLeave={(e) => handleDrag(e, type, false)}
                          onDragOver={(e) => {
                            e.preventDefault()
                            handleDrag(e, type, true)
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setDragActive(null)
                            open()
                          }}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                              <span className="text-sm text-muted-foreground mt-1">Upload en cours...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-6 w-6 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground mt-1">
                                Glisser-déposer ou cliquer
                              </span>
                              <span className="text-xs text-muted-foreground">PDF, JPG, PNG (max 5 Mo)</span>
                            </>
                          )}
                        </div>
                      )}
                    </CldUploadWidget>
                  ) : (
                    /* Fallback: native file input with drag/drop */
                    <div
                      className={`relative w-full border-2 border-dashed rounded-lg h-24 flex flex-col items-center justify-center cursor-pointer transition-colors ${
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
                        accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf"
                        className="hidden"
                        onChange={(e) => handleFileInput(e, type)}
                        disabled={isUploading}
                      />
                      {isUploading ? (
                        <>
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          <span className="text-sm text-muted-foreground mt-1">Upload en cours...</span>
                        </>
                      ) : dragActive === type ? (
                        <>
                          <Upload className="h-6 w-6 text-primary" />
                          <span className="text-sm text-primary mt-1">Déposez le fichier ici</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground mt-1">
                            Glisser-déposer ou cliquer
                          </span>
                          <span className="text-xs text-muted-foreground">PDF, JPG, PNG (max 5 Mo)</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="flex-1"
            >
              Plus tard
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!allDocsUploaded || submitting}
              className="flex-1"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Envoi..." : "Envoyer pour validation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF/Image Preview Modal */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Aperçu du document
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPreviewUrl(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center min-h-[500px] bg-muted rounded-lg overflow-hidden">
            {previewUrl && isPdf(previewUrl) ? (
              <iframe
                src={previewUrl}
                className="w-full h-[70vh]"
                title="PDF Preview"
              />
            ) : previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Document preview"
                className="max-w-full max-h-[70vh] object-contain"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
