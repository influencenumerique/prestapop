"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Loader2, Star, Truck, CheckCircle, User } from "lucide-react"
import { toast } from "sonner"

interface CandidateData {
  bookingId: string
  driverId: string
  driverName: string | null
  driverEmail: string
  driverProfilePicture: string | null
  vehicle: string
  rating: number | null
  totalDeliveries: number
  appliedAt: string
  status: string
  agreedPrice: number
  driverNotes: string | null
  stripePaymentStatus: string | null
  driverCity: string | null
  driverIsVerified: boolean
  driverIsAvailable: boolean
}

interface ViewCandidatesButtonProps {
  jobId: string
}

export function ViewCandidatesButton({ jobId }: ViewCandidatesButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [candidates, setCandidates] = useState<CandidateData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const router = useRouter()

  const loadCandidates = async () => {
    setIsLoading(true)
    toast.loading("Chargement des candidatures...", { id: "load-candidates" })

    try {
      const response = await fetch(`/api/jobs/${jobId}/candidatures`)

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des candidatures")
      }

      const data = await response.json()
      setCandidates(data.candidatures || [])
      toast.dismiss("load-candidates")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors du chargement",
        { id: "load-candidates" }
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptCandidate = async (bookingId: string, driverName: string | null) => {
    setAcceptingId(bookingId)
    toast.loading("Acceptation du candidat...", { id: "accept-candidate" })

    try {
      const response = await fetch(`/api/bookings/${bookingId}/accept`, {
        method: "PATCH",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'acceptation")
      }

      toast.success(`${driverName || "Candidat"} accepté avec succès`, { id: "accept-candidate" })
      setIsOpen(false)

      // Refresh the page to show updated status
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'acceptation",
        { id: "accept-candidate" }
      )
    } finally {
      setAcceptingId(null)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && candidates.length === 0) {
      loadCandidates()
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full gap-2"
        size="lg"
        onClick={() => handleOpenChange(true)}
      >
        <Users className="h-4 w-4" />
        Voir les candidatures
      </Button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidatures reçues</DialogTitle>
            <DialogDescription>
              Consultez les candidats et acceptez celui qui correspond le mieux à
              vos besoins
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune candidature reçue pour le moment
            </div>
          ) : (
            <div className="space-y-3">
              {candidates.map((candidate) => (
                <Card key={candidate.bookingId} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={candidate.driverProfilePicture || undefined} />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">
                              {candidate.driverName || "Chauffeur"}
                            </h4>
                            {candidate.driverCity && (
                              <p className="text-sm text-muted-foreground">
                                {candidate.driverCity}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {candidate.driverIsVerified && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Vérifié
                              </Badge>
                            )}
                            {candidate.status === "ASSIGNED" && (
                              <Badge className="bg-blue-100 text-blue-800">
                                Accepté
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="gap-1">
                            <Truck className="h-3 w-3" />
                            {candidate.vehicle}
                          </Badge>
                          {candidate.rating !== null && (
                            <Badge variant="outline" className="gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {candidate.rating.toFixed(1)} ({candidate.totalDeliveries} livraisons)
                            </Badge>
                          )}
                        </div>

                        {candidate.driverNotes && (
                          <p className="text-sm text-muted-foreground italic">
                            &quot;{candidate.driverNotes}&quot;
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2">
                          <p className="text-xs text-muted-foreground">
                            Candidature du{" "}
                            {new Date(candidate.appliedAt).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {candidate.status === "PENDING" ? (
                            <Button
                              size="sm"
                              onClick={() => handleAcceptCandidate(candidate.bookingId, candidate.driverName)}
                              disabled={acceptingId !== null}
                              className="gap-2"
                            >
                              {acceptingId === candidate.bookingId ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Acceptation...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-3 w-3" />
                                  Accepter
                                </>
                              )}
                            </Button>
                          ) : candidate.status === "CANCELLED" ? (
                            <Badge variant="outline" className="bg-gray-50 text-gray-600">
                              Rejeté
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
