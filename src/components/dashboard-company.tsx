"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { Clock, CheckCircle, MapPin, Plus } from "lucide-react"
import { ProtectedActionButton } from "./protected-action-button"
import { LaunchMissionButton } from "./launch-mission-button"

const statusConfig: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Disponible", color: "bg-green-100 text-green-800" },
  ASSIGNED: { label: "Attribuée", color: "bg-blue-100 text-blue-800" },
  IN_PROGRESS: { label: "En cours", color: "bg-yellow-100 text-yellow-800" },
  DELIVERED: { label: "Livrée", color: "bg-purple-100 text-purple-800" },
  COMPLETED: { label: "Terminée", color: "bg-gray-100 text-gray-800" },
  CANCELLED: { label: "Annulée", color: "bg-red-100 text-red-800" },
}

interface CompanyDashboardProps {
  jobs: Array<{
    id: string
    title: string
    secteurLivraison: string
    status: string
    dayRate: number
    _count: {
      bookings: number
    }
    bookings: Array<{
      id: string
      driver: {
        user: {
          name: string | null
        }
      }
    }>
  }>
  hasKbis: boolean
  kbisVerified: boolean
}

export function CompanyDashboard({ jobs, hasKbis, kbisVerified }: CompanyDashboardProps) {
  const openJobs = jobs.filter(j => j.status === "OPEN")
  const inProgressJobs = jobs.filter(j => j.status === "IN_PROGRESS")

  return (
    <>
      {/* CTA principale si aucune mission */}
      {jobs.length === 0 && (
        <Card className="mb-8 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
          <CardContent className="p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Trouvez le chauffeur parfait en quelques clics</h2>
              <p className="text-primary-foreground/90 mb-6">
                Publiez votre mission de livraison et recevez des candidatures de chauffeurs qualifiés
              </p>
              <ProtectedActionButton
                userType="company"
                hasKbis={hasKbis}
                kbisVerified={kbisVerified}
                href="/dashboard/create-job"
                variant="secondary"
                size="lg"
                className="gap-2"
              >
                <Plus className="h-5 w-5" />
                Publier ma première mission
              </ProtectedActionButton>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <ProtectedActionButton
          userType="company"
          hasKbis={hasKbis}
          kbisVerified={kbisVerified}
          href="/dashboard/create-job"
          variant="ghost"
          className="p-0 h-auto hover:bg-transparent"
        >
          <Card className="w-full cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold">Publier</p>
                  <p className="text-sm text-muted-foreground">Nouvelle mission</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </ProtectedActionButton>
        <Link href="/jobs">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{openJobs.length}</p>
                  <p className="text-sm text-muted-foreground">Missions ouvertes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressJobs.length}</p>
                <p className="text-sm text-muted-foreground">En cours</p>
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
                  Document requis pour publier
                </h3>
                <p className="text-sm text-yellow-800 mb-4">
                  Pour publier votre première mission, vous devez d&apos;abord télécharger le KBIS de votre entreprise (moins de 3 mois).
                </p>
                <ProtectedActionButton
                  userType="company"
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

      {/* My Jobs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Mes missions</CardTitle>
            <CardDescription>Gérez vos missions de livraison</CardDescription>
          </div>
          <ProtectedActionButton
            userType="company"
            hasKbis={hasKbis}
            kbisVerified={kbisVerified}
            href="/dashboard/create-job"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Publier nouvelle mission
          </ProtectedActionButton>
        </CardHeader>
        <CardContent>
          {jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job) => {
                const status = statusConfig[job.status]
                const acceptedBooking = job.bookings[0]
                return (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-primary transition-colors"
                  >
                    <Link href={`/jobs/${job.id}`} className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{job.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {job.secteurLivraison}
                      </div>
                      {acceptedBooking && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Chauffeur: {acceptedBooking.driver.user.name}
                        </p>
                      )}
                    </Link>
                    <div className="flex items-center gap-4">
                      {job.status === "ASSIGNED" && acceptedBooking ? (
                        <LaunchMissionButton
                          bookingId={acceptedBooking.id}
                          dayRate={job.dayRate}
                        />
                      ) : (
                        <>
                          <div className="text-right">
                            <Badge className={status.color}>{status.label}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {job._count.bookings} candidature(s)
                            </p>
                          </div>
                          <span className="font-semibold">{formatPrice(job.dayRate)}</span>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Aucune mission publiée</p>
              <ProtectedActionButton
                userType="company"
                hasKbis={hasKbis}
                kbisVerified={kbisVerified}
                href="/dashboard/create-job"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Publier ma première mission
              </ProtectedActionButton>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
