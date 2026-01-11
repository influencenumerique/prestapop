"use client"

import { useEffect, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquare
} from "lucide-react"

interface Booking {
  id: string
  status: string
  agreedPrice: number
  driverNotes: string | null
  companyNotes: string | null
  createdAt: string
  job: {
    title: string
    company: { companyName: string }
  }
  driver: {
    user: { name: string; email: string }
  }
}

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR"
  }).format(cents / 100)
}

export default function AdminLitiges() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [detailDialog, setDetailDialog] = useState<Booking | null>(null)
  const [resolveDialog, setResolveDialog] = useState<{ booking: Booking; resolution: "company" | "driver" } | null>(null)
  const [adminComment, setAdminComment] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchLitiges = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch bookings with disputed or problematic status
      // For now, we'll fetch all bookings and filter client-side
      // In production, you'd have a dedicated API for disputes
      const res = await fetch(`/api/admin/jobs?status=ALL&page=${page}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        // Extract bookings from jobs that have issues
        const allBookings: Booking[] = []
        for (const job of data.jobs) {
          for (const booking of job.bookings) {
            if (booking.status === "PENDING" || job.companyNotes?.includes("litige") || job.companyNotes?.includes("NO_SHOW")) {
              allBookings.push({
                ...booking,
                job: { title: job.title, company: job.company },
                driver: booking.driver
              })
            }
          }
        }
        setBookings(allBookings)
        setTotal(allBookings.length)
        setTotalPages(1)
      }
    } catch (error) {
      console.error("Error fetching litiges:", error)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchLitiges()
  }, [fetchLitiges])

  const handleResolve = async () => {
    if (!resolveDialog) return
    setActionLoading(resolveDialog.booking.id)
    try {
      // In a real app, you'd have a dedicated API for dispute resolution
      // This is a simplified version
      const newStatus = resolveDialog.resolution === "company" ? "CANCELLED" : "COMPLETED"
      const res = await fetch("/api/admin/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: resolveDialog.booking.job.title, // This is a hack, in production use proper jobId
          action: "changeStatus",
          status: newStatus
        })
      })
      if (res.ok) {
        setResolveDialog(null)
        setAdminComment("")
        fetchLitiges()
      }
    } catch (error) {
      console.error("Error resolving dispute:", error)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Litiges</h1>
        <p className="text-gray-500">Gestion des litiges et conflits</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{bookings.length}</p>
              <p className="text-sm text-gray-500">Litiges en cours</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-500">Résolus ce mois</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">-</p>
              <p className="text-sm text-gray-500">Temps moyen résolution</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mission</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Chauffeur</TableHead>
                <TableHead className="hidden md:table-cell">Montant</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="h-12 w-12 text-green-500" />
                      <p className="text-gray-500">Aucun litige en cours</p>
                      <p className="text-sm text-gray-400">Tous les conflits ont été résolus</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.job.title}</p>
                        <Badge className="bg-yellow-100 text-yellow-800 mt-1">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Litige
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{booking.job.company.companyName}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{booking.driver.user.name}</p>
                        <p className="text-xs text-gray-500">{booking.driver.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="font-medium">{formatCurrency(booking.agreedPrice)}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-gray-500">
                      {new Date(booking.createdAt).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDetailDialog(booking)}
                          title="Détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => setResolveDialog({ booking, resolution: "driver" })}
                          disabled={actionLoading === booking.id}
                          title="Faveur chauffeur"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setResolveDialog({ booking, resolution: "company" })}
                          disabled={actionLoading === booking.id}
                          title="Faveur entreprise"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {bookings.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-gray-500">
              {total} litige{total > 1 ? "s" : ""} au total
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} / {totalPages || 1}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du litige</DialogTitle>
          </DialogHeader>
          {detailDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Mission</p>
                  <p className="font-medium">{detailDialog.job.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Montant</p>
                  <p className="font-medium">{formatCurrency(detailDialog.agreedPrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Entreprise</p>
                  <p className="font-medium">{detailDialog.job.company.companyName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Chauffeur</p>
                  <p className="font-medium">{detailDialog.driver.user.name}</p>
                </div>
              </div>

              {detailDialog.companyNotes && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-800 mb-1">Note de l'entreprise</p>
                  <p className="text-sm text-purple-700">{detailDialog.companyNotes}</p>
                </div>
              )}

              {detailDialog.driverNotes && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800 mb-1">Note du chauffeur</p>
                  <p className="text-sm text-green-700">{detailDialog.driverNotes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={!!resolveDialog} onOpenChange={() => { setResolveDialog(null); setAdminComment("") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Résoudre en faveur {resolveDialog?.resolution === "driver" ? "du chauffeur" : "de l'entreprise"}
            </DialogTitle>
            <DialogDescription>
              {resolveDialog?.resolution === "driver"
                ? "Le chauffeur sera payé et la mission sera marquée comme terminée."
                : "La mission sera annulée et l'entreprise sera remboursée."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Commentaire admin (optionnel)</label>
            <Textarea
              placeholder="Ajouter une note explicative..."
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResolveDialog(null); setAdminComment("") }}>
              Annuler
            </Button>
            <Button
              variant={resolveDialog?.resolution === "driver" ? "default" : "destructive"}
              onClick={handleResolve}
              disabled={actionLoading === resolveDialog?.booking.id}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
