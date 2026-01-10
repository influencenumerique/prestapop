"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { Truck, Clock, CheckCircle, MapPin } from "lucide-react"
import { ProtectedActionButton } from "./protected-action-button"

const statusConfig: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Disponible", color: "bg-green-100 text-green-800" },
  ASSIGNED: { label: "Attribuée", color: "bg-blue-100 text-blue-800" },
  IN_PROGRESS: { label: "En cours", color: "bg-yellow-100 text-yellow-800" },
  DELIVERED: { label: "Livrée", color: "bg-purple-100 text-purple-800" },
  COMPLETED: { label: "Terminée", color: "bg-gray-100 text-gray-800" },
  CANCELLED: { label: "Annulée", color: "bg-red-100 text-red-800" },
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
}

export function DriverDashboard({ profile, bookings, hasKbis, kbisVerified }: DriverDashboardProps) {
  const activeBookings = bookings.filter(
    b => b.status === "ASSIGNED" || b.status === "IN_PROGRESS"
  )

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

      {/* KBIS Alert */}
      {!hasKbis && (
        <Card className="mb-8 border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg shrink-0">
                <CheckCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-1">
                  Document requis pour postuler
                </h3>
                <p className="text-sm text-yellow-800 mb-4">
                  Pour commencer à postuler aux missions, vous devez d'abord télécharger votre KBIS d'auto-entrepreneur (moins de 3 mois).
                </p>
                <ProtectedActionButton
                  userType="driver"
                  hasKbis={false}
                  kbisVerified={false}
                  variant="default"
                  size="sm"
                >
                  Télécharger mon KBIS
                </ProtectedActionButton>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                      <Badge className={status.color}>{status.label}</Badge>
                      <span className="font-semibold">{formatPrice(booking.agreedPrice)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Pas encore de mission</p>
              <ProtectedActionButton
                userType="driver"
                hasKbis={hasKbis}
                kbisVerified={kbisVerified}
                href="/jobs"
              >
                Trouver une mission
              </ProtectedActionButton>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
