"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { Truck, Clock, CheckCircle, MapPin, FileText, AlertTriangle, Package, Calendar, XCircle, Hourglass } from "lucide-react"
import { ProtectedActionButton } from "./protected-action-button"
import { DocumentUploadModal } from "./document-upload-modal"

const statusConfig: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Disponible", color: "bg-green-100 text-green-800" },
  ASSIGNED: { label: "Attribuée", color: "bg-blue-100 text-blue-800" },
  IN_PROGRESS: { label: "En cours", color: "bg-yellow-100 text-yellow-800" },
  DELIVERED: { label: "Livrée", color: "bg-purple-100 text-purple-800" },
  COMPLETED: { label: "Terminée", color: "bg-gray-100 text-gray-800" },
  CANCELLED: { label: "Annulée", color: "bg-red-100 text-red-800" },
}

const volumeLabels: Record<string, string> = {
  CUBE_6M: "6m³",
  CUBE_9M: "9m³",
  CUBE_12M: "12m³",
  CUBE_15M: "15m³",
  CUBE_20M: "20m³",
}

const verificationStatusConfig: Record<string, { label: string; icon: React.ReactNode; bgColor: string; textColor: string; borderColor: string }> = {
  PENDING_VERIF: {
    label: "En attente de validation",
    icon: <Hourglass className="h-5 w-5" />,
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-800",
    borderColor: "border-yellow-200",
  },
  VERIFIED: {
    label: "Compte validé",
    icon: <CheckCircle className="h-5 w-5" />,
    bgColor: "bg-green-50",
    textColor: "text-green-800",
    borderColor: "border-green-200",
  },
  REJECTED: {
    label: "Compte refusé",
    icon: <XCircle className="h-5 w-5" />,
    bgColor: "bg-red-50",
    textColor: "text-red-800",
    borderColor: "border-red-200",
  },
}

interface Job {
  id: string
  title: string
  secteurLivraison: string
  dayRate: number
  vehicleVolume: string
  startTime: string
  company: {
    companyName: string
  }
}

interface DriverDashboardProps {
  profile: {
    totalDeliveries: number
    rating: number
  }
  bookings: Array<{
    id: string
    status: string
    agreedPrice: number
    job: {
      title: string
      secteurLivraison: string
      company: {
        companyName: string
      }
    }
  }>
  hasKbis: boolean
  kbisVerified: boolean
  userStatus: string
  isVerified: boolean
}

export function DriverDashboard({ profile, bookings, hasKbis, kbisVerified, userStatus, isVerified }: DriverDashboardProps) {
  const [showDocModal, setShowDocModal] = useState(false)
  const [availableJobs, setAvailableJobs] = useState<Job[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)

  const activeBookings = bookings.filter(
    b => b.status === "ASSIGNED" || b.status === "IN_PROGRESS"
  )

  // Check if documents section should be shown
  // Hide if user is verified OR has rating > 0 OR has completed deliveries (already active driver)
  const isActiveDriver = userStatus === "VERIFIED" || isVerified || profile.rating > 0 || profile.totalDeliveries > 0
  const showDocumentsSection = !isActiveDriver

  // Fetch available jobs when there are no bookings
  useEffect(() => {
    if (bookings.length === 0) {
      setLoadingJobs(true)
      fetch("/api/jobs?status=OPEN")
        .then(res => res.json())
        .then(data => {
          setAvailableJobs(data.jobs || [])
        })
        .catch(err => {
          console.error("Error fetching jobs:", err)
        })
        .finally(() => {
          setLoadingJobs(false)
        })
    }
  }, [bookings.length])

  return (
    <>
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profile.totalDeliveries}</p>
                <p className="text-sm text-muted-foreground">Livraisons effectuées</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeBookings.length}</p>
                <p className="text-sm text-muted-foreground">Missions en cours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profile.rating.toFixed(1)}/5</p>
                <p className="text-sm text-muted-foreground">Note moyenne</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification Status Badge - Only show for new drivers (not active) */}
      {!isActiveDriver && verificationStatusConfig[userStatus] && (
        <Card className={`mb-8 ${verificationStatusConfig[userStatus].borderColor} ${verificationStatusConfig[userStatus].bgColor}`}>
          <CardContent className="p-4">
            <div className={`flex items-center gap-3 ${verificationStatusConfig[userStatus].textColor}`}>
              {verificationStatusConfig[userStatus].icon}
              <span className="font-medium">{verificationStatusConfig[userStatus].label}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents Alert - Only show if not verified */}
      {showDocumentsSection && !hasKbis && (
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 rounded-lg shrink-0">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 mb-1">
                  Documents requis pour postuler
                </h3>
                <p className="text-sm text-orange-800 mb-2">
                  Pour commencer à postuler aux missions, vous devez fournir les documents suivants :
                </p>
                <ul className="text-sm text-orange-800 mb-4 space-y-1">
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    KBIS (moins de 3 mois)
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Pièce d&apos;identité
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Permis de conduire
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Assurance véhicule
                  </li>
                </ul>
                <Button
                  onClick={() => setShowDocModal(true)}
                  size="sm"
                >
                  Envoyer mes documents
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Upload Modal */}
      <DocumentUploadModal
        open={showDocModal}
        onOpenChange={setShowDocModal}
        role="DRIVER"
      />

      {/* My Missions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Mes missions</CardTitle>
            <CardDescription>Vos missions de livraison</CardDescription>
          </div>
          <ProtectedActionButton
            userType="driver"
            hasKbis={hasKbis}
            kbisVerified={kbisVerified}
            href="/jobs"
          >
            Trouver une mission
          </ProtectedActionButton>
        </CardHeader>
        <CardContent>
          {bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const status = statusConfig[booking.status]
                return (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{booking.job.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {booking.job.company.companyName}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {booking.job.secteurLivraison}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={status?.color || "bg-gray-100 text-gray-800"}>
                        {status?.label || booking.status}
                      </Badge>
                      <span className="font-semibold">{formatPrice(booking.agreedPrice)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-2">Pas encore de mission attribuée</p>
                <p className="text-sm text-muted-foreground">Découvrez les missions disponibles ci-dessous</p>
              </div>

              {/* Available Jobs Section */}
              {loadingJobs ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Chargement des missions...</p>
                </div>
              ) : availableJobs.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-4 py-3 border-b">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Missions disponibles ({availableJobs.length})
                    </h4>
                  </div>
                  <div className="divide-y">
                    {availableJobs.slice(0, 5).map((job) => (
                      <div
                        key={job.id}
                        className="p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium truncate">{job.title}</h5>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {job.secteurLivraison}
                              </span>
                              <span className="flex items-center gap-1">
                                <Truck className="h-3 w-3" />
                                {volumeLabels[job.vehicleVolume] || job.vehicleVolume}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(job.startTime).toLocaleDateString("fr-FR")}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 ml-4">
                            <span className="text-lg font-bold text-primary whitespace-nowrap">
                              {formatPrice(job.dayRate)}
                            </span>
                            <Link href={`/jobs/${job.id}`}>
                              <Button size="sm">
                                Candidater
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {availableJobs.length > 5 && (
                    <div className="px-4 py-3 bg-muted/30 border-t text-center">
                      <Link href="/jobs">
                        <Button variant="outline" size="sm">
                          Voir toutes les missions ({availableJobs.length})
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg bg-muted/20">
                  <p className="text-muted-foreground mb-4">Aucune mission disponible pour le moment</p>
                  <Link href="/jobs">
                    <Button variant="outline">
                      Voir toutes les missions
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
