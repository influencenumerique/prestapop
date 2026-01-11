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
import { toast } from "sonner"
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Image as ImageIcon,
  AlertTriangle,
  ExternalLink,
  Loader2
} from "lucide-react"

interface Document {
  id: string
  type: "SIRET" | "PERMIS" | "ASSURANCE"
  url: string
  status: "OK" | "MISSING" | "ILLEGIBLE"
}

interface VerificationUser {
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

interface VerificationModalProps {
  user: VerificationUser | null
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

export function VerificationModal({ user, open, onOpenChange, onSuccess }: VerificationModalProps) {
  const [loading, setLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

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
    // Check documents table first
    const doc = user.documents.find(d => d.type === type)
    if (doc?.url && doc.url !== "") return doc.url

    // Fallback to verificationDocs JSON
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

  const requiredDocs = user.role === "COMPANY"
    ? ["SIRET", "ASSURANCE"]
    : ["PERMIS", "ASSURANCE"]

  const allDocsOk = requiredDocs.every(type => getDocStatus(type) === "OK")
  const hasMissingDocs = requiredDocs.some(type => {
    const status = getDocStatus(type)
    return status === "MISSING" || status === "ILLEGIBLE"
  })

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-400" />
              Vérification - {user.name || user.email}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {user.role === "COMPANY" ? "Entreprise" : "Chauffeur"} • {user.email}
              {user.company && <span className="block text-purple-400">{user.company.companyName}</span>}
              {user.driverProfile?.city && <span className="block text-emerald-400">{user.driverProfile.city}</span>}
            </DialogDescription>
          </DialogHeader>

          {/* Documents List */}
          <div className="space-y-4 py-4">
            <h4 className="text-sm font-medium text-gray-300">Documents requis</h4>

            {requiredDocs.map((type) => {
              const url = getDocUrl(type)
              const status = getDocStatus(type)

              return (
                <div key={type} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {url && isImage(url) ? (
                      <ImageIcon className="h-5 w-5 text-blue-400" />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">{docTypeLabels[type]}</p>
                      <Badge className={`${docStatusColors[status]} border text-xs mt-1`}>
                        {docStatusLabels[status]}
                      </Badge>
                    </div>
                  </div>

                  {url && url !== "" ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewUrl(url)}
                        className="bg-transparent border-slate-600 text-gray-300 hover:bg-slate-600"
                      >
                        Aperçu
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(url, "_blank")}
                        className="bg-transparent border-slate-600 text-gray-300 hover:bg-slate-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Non fourni</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Status Summary */}
          <div className="p-3 bg-slate-700/30 rounded-lg">
            {allDocsOk ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="h-5 w-5" />
                <span>Tous les documents sont validés</span>
              </div>
            ) : hasMissingDocs ? (
              <div className="flex items-center gap-2 text-orange-400">
                <AlertTriangle className="h-5 w-5" />
                <span>Documents manquants ou illisibles</span>
              </div>
            ) : null}
          </div>

          {/* Rejection Form */}
          {showRejectForm && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Raison du refus</label>
              <Textarea
                placeholder="Expliquez la raison du refus..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                rows={3}
              />
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {!showRejectForm ? (
              <>
                {/* Validate Button - Green */}
                <Button
                  onClick={() => handleVerify("ACTIVE")}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Valider → ACTIVE
                </Button>

                {/* Wait Button - Orange */}
                <Button
                  onClick={() => handleVerify("PENDING_VERIF")}
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Clock className="h-4 w-4 mr-2" />
                  )}
                  Attendre → PENDING
                </Button>

                {/* Reject Button - Red */}
                <Button
                  onClick={() => setShowRejectForm(true)}
                  disabled={loading}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Refuser
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
                  disabled={loading || !rejectionReason}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
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

      {/* Preview Modal */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-white">Aperçu du document</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center min-h-[400px] bg-slate-900 rounded-lg overflow-hidden">
            {previewUrl && isImage(previewUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Document preview"
                className="max-w-full max-h-[70vh] object-contain"
              />
            ) : previewUrl && isPdf(previewUrl) ? (
              <iframe
                src={previewUrl}
                className="w-full h-[70vh]"
                title="PDF Preview"
              />
            ) : (
              <div className="text-gray-400 flex flex-col items-center gap-2">
                <FileText className="h-12 w-12" />
                <p>Aperçu non disponible</p>
                <Button
                  onClick={() => previewUrl && window.open(previewUrl, "_blank")}
                  variant="outline"
                  className="bg-transparent border-slate-600 text-gray-300 hover:bg-slate-600"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir dans un nouvel onglet
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
