"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Image as ImageIcon,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Building2,
  Truck,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X
} from "lucide-react"

interface Document {
  id: string
  type: "SIRET" | "PERMIS" | "ASSURANCE"
  url: string
  status: "OK" | "MISSING" | "ILLEGIBLE"
}

interface RegistrationUser {
  id: string
  email: string
  name: string | null
  role: string
  status: string
  verificationDocs?: {
    siretUrl?: string | null
    permisUrl?: string | null
    assuranceUrl?: string | null
  } | null
  rejectionReason?: string | null
  documents: Document[]
  company?: { companyName: string } | null
  driverProfile?: { phone?: string | null; city?: string | null } | null
}

interface NewRegistrationModalProps {
  user: RegistrationUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const docTypeLabels: Record<string, string> = {
  SIRET: "Extrait SIRET / Kbis",
  PERMIS: "Permis de conduire",
  ASSURANCE: "Attestation d'assurance"
}

const docStatusColors: Record<string, string> = {
  OK: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  MISSING: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  ILLEGIBLE: "bg-red-500/20 text-red-400 border-red-500/30"
}

const docStatusLabels: Record<string, string> = {
  OK: "Validé",
  MISSING: "Manquant",
  ILLEGIBLE: "Illisible"
}

export function NewRegistrationModal({ user, open, onOpenChange, onSuccess }: NewRegistrationModalProps) {
  const [loading, setLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  if (!user) return null

  const handleVerify = async (status: "ACTIVE" | "PENDING_VERIF" | "REJECTED") => {
    if (status === "REJECTED" && !rejectionReason) {
      toast.error("Veuillez indiquer une raison de refus")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reason: status === "REJECTED" ? rejectionReason : undefined
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(data.message)
        onOpenChange(false)
        onSuccess()
        setRejectionReason("")
        setShowRejectForm(false)
      } else {
        toast.error(data.error || "Erreur lors de la vérification")
      }
    } catch {
      toast.error("Erreur de connexion")
    } finally {
      setLoading(false)
    }
  }

  const getDocUrl = (type: string): string | null => {
    const doc = user.documents.find(d => d.type === type)
    if (doc?.url && doc.url !== "") return doc.url

    if (user.verificationDocs) {
      switch (type) {
        case "SIRET": return user.verificationDocs.siretUrl || null
        case "PERMIS": return user.verificationDocs.permisUrl || null
        case "ASSURANCE": return user.verificationDocs.assuranceUrl || null
      }
    }
    return null
  }

  const getDocStatus = (type: string): "OK" | "MISSING" | "ILLEGIBLE" => {
    const doc = user.documents.find(d => d.type === type)
    return doc?.status || "MISSING"
  }

  const isImage = (url: string): boolean => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
  }

  const isPdf = (url: string): boolean => {
    return /\.pdf$/i.test(url)
  }

  const openPreview = (url: string, type: string) => {
    setPreviewUrl(url)
    setPreviewType(type)
    setZoom(1)
    setRotation(0)
  }

  const closePreview = () => {
    setPreviewUrl(null)
    setPreviewType(null)
    setZoom(1)
    setRotation(0)
  }

  const requiredDocs = user.role === "COMPANY"
    ? ["SIRET", "ASSURANCE"]
    : ["PERMIS", "ASSURANCE"]

  const allDocsOk = requiredDocs.every(type => getDocStatus(type) === "OK")
  const hasMissingDocs = requiredDocs.some(type => {
    const status = getDocStatus(type)
    return status === "MISSING" || status === "ILLEGIBLE"
  })

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const RoleIcon = user.role === "COMPANY" ? Building2 : Truck

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-yellow-400">
                  <AvatarFallback className={`${user.role === "COMPANY" ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"} font-semibold`}>
                    {getInitials(user.name, user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${user.role === "COMPANY" ? "bg-purple-500" : "bg-emerald-500"}`}>
                  <RoleIcon className="h-3 w-3 text-white" />
                </div>
              </div>
              <div>
                <span className="text-lg">{user.name || user.email}</span>
                <Badge className="ml-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  <Clock className="h-3 w-3 mr-1" />
                  En attente
                </Badge>
              </div>
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge className={`${user.role === "COMPANY" ? "bg-purple-500/20 text-purple-400" : "bg-emerald-500/20 text-emerald-400"} border`}>
                  {user.role === "COMPANY" ? "Entreprise" : "Chauffeur"}
                </Badge>
                <span>•</span>
                <span>{user.email}</span>
              </div>
              {user.company && (
                <p className="text-purple-400 mt-1">
                  <Building2 className="h-4 w-4 inline mr-1" />
                  {user.company.companyName}
                </p>
              )}
              {user.driverProfile?.city && (
                <p className="text-emerald-400 mt-1">📍 {user.driverProfile.city}</p>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Documents List with Preview */}
          <div className="space-y-4 py-4">
            <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents requis
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requiredDocs.map((type) => {
                const url = getDocUrl(type)
                const status = getDocStatus(type)

                return (
                  <div key={type} className="bg-slate-700/50 rounded-xl p-4 border border-slate-600 hover:border-slate-500 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {url && isImage(url) ? (
                          <ImageIcon className="h-5 w-5 text-blue-400" />
                        ) : (
                          <FileText className="h-5 w-5 text-gray-400" />
                        )}
                        <div>
                          <p className="font-medium text-white text-sm">{docTypeLabels[type]}</p>
                          <Badge className={`${docStatusColors[status]} border text-xs mt-1`}>
                            {docStatusLabels[status]}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {url && url !== "" ? (
                      <div className="space-y-2">
                        {/* Thumbnail Preview */}
                        {isImage(url) && (
                          <div
                            className="relative h-32 bg-slate-900 rounded-lg overflow-hidden cursor-pointer group"
                            onClick={() => openPreview(url, type)}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={docTypeLabels[type]}
                              className="w-full h-full object-contain transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        )}

                        {isPdf(url) && (
                          <div
                            className="relative h-32 bg-slate-900 rounded-lg overflow-hidden cursor-pointer group flex items-center justify-center"
                            onClick={() => openPreview(url, type)}
                          >
                            <div className="text-center">
                              <FileText className="h-12 w-12 text-red-400 mx-auto mb-2" />
                              <p className="text-xs text-gray-400">PDF Document</p>
                            </div>
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPreview(url, type)}
                            className="flex-1 bg-transparent border-slate-600 text-gray-300 hover:bg-slate-600 text-xs"
                          >
                            <ZoomIn className="h-3 w-3 mr-1" />
                            Aperçu
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(url, "_blank")}
                            className="bg-transparent border-slate-600 text-gray-300 hover:bg-slate-600"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `${type}_${user.id}`
                              a.click()
                            }}
                            className="bg-transparent border-slate-600 text-gray-300 hover:bg-slate-600"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-32 bg-slate-900 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-orange-400" />
                          <p className="text-xs">Document non fourni</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Status Summary */}
          <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600">
            {allDocsOk ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Tous les documents sont validés</span>
              </div>
            ) : hasMissingDocs ? (
              <div className="flex items-center gap-2 text-orange-400">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Documents manquants ou illisibles</span>
              </div>
            ) : null}
          </div>

          {/* Rejection Form */}
          {showRejectForm && (
            <div className="space-y-3 p-4 bg-red-500/10 rounded-xl border border-red-500/30">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-400" />
                Raison du refus (optionnel mais recommandé)
              </label>
              <Textarea
                placeholder="Expliquez la raison du refus... (Ex: Document illisible, SIRET invalide, etc.)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                rows={3}
              />
              <p className="text-xs text-gray-400">
                Cette information sera envoyée à l'utilisateur par email.
              </p>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
            {!showRejectForm ? (
              <>
                {/* Validate Button - Green */}
                <Button
                  onClick={() => handleVerify("ACTIVE")}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 h-11"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <>✅</>
                  )}
                  <span className="ml-2">Valider → ACTIVE</span>
                </Button>

                {/* Wait Button - Orange/Yellow */}
                <Button
                  onClick={() => handleVerify("PENDING_VERIF")}
                  disabled={loading}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white flex-1 h-11"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Clock className="h-4 w-4 mr-2" />
                  )}
                  📄 Attendre → PENDING
                </Button>

                {/* Reject Button - Red */}
                <Button
                  onClick={() => setShowRejectForm(true)}
                  disabled={loading}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 flex-1 h-11"
                >
                  ❌ Refuser
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectForm(false)
                    setRejectionReason("")
                  }}
                  className="bg-transparent border-slate-600 text-gray-300 hover:bg-slate-700"
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => handleVerify("REJECTED")}
                  disabled={loading}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 flex-1"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Confirmer le refus → REJECTED
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Document Preview Modal */}
      <Dialog open={!!previewUrl} onOpenChange={() => closePreview()}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-5xl max-h-[95vh] p-0">
          <div className="relative">
            {/* Preview Header with Controls */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-yellow-400" />
                <span className="font-medium">
                  {previewType && docTypeLabels[previewType]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                  className="bg-transparent border-slate-600 text-gray-300 hover:bg-slate-700"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-400 w-16 text-center">{Math.round(zoom * 100)}%</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                  className="bg-transparent border-slate-600 text-gray-300 hover:bg-slate-700"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                {/* Rotate Control (for images) */}
                {previewUrl && isImage(previewUrl) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRotation(r => (r + 90) % 360)}
                    className="bg-transparent border-slate-600 text-gray-300 hover:bg-slate-700"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                )}
                {/* External Link */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => previewUrl && window.open(previewUrl, "_blank")}
                  className="bg-transparent border-slate-600 text-gray-300 hover:bg-slate-700"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                {/* Close */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => closePreview()}
                  className="bg-transparent border-slate-600 text-gray-300 hover:bg-slate-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="overflow-auto bg-slate-950" style={{ maxHeight: 'calc(95vh - 80px)' }}>
              {previewUrl && isImage(previewUrl) ? (
                <div className="flex items-center justify-center min-h-[400px] p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Document preview"
                    className="max-w-full transition-transform duration-200"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transformOrigin: 'center center'
                    }}
                  />
                </div>
              ) : previewUrl && isPdf(previewUrl) ? (
                <iframe
                  src={previewUrl}
                  className="w-full border-0"
                  style={{ height: 'calc(95vh - 80px)', transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                  title="PDF Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
                  <FileText className="h-16 w-16 mb-4" />
                  <p>Aperçu non disponible pour ce type de fichier</p>
                  <Button
                    onClick={() => previewUrl && window.open(previewUrl, "_blank")}
                    variant="outline"
                    className="mt-4 bg-transparent border-slate-600 text-gray-300 hover:bg-slate-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir dans un nouvel onglet
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
