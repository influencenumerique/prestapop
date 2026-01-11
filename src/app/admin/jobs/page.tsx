"use client"

import { useEffect, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Briefcase,
  Truck,
  Euro,
  Mail,
  Building2
} from "lucide-react"
import { ContactModal } from "@/components/contact-modal"

interface Job {
  id: string
  title: string
  status: string
  dayRate: number
  secteurLivraison: string
  typeMission: string
  createdAt: string
  company: {
    companyName: string
    phone?: string | null
    user: { id: string; name: string | null; email: string }
  }
  bookings: Array<{
    id: string
    status: string
    driver: {
      phone?: string | null
      user: { id: string; name: string | null; email: string }
    }
  }>
}

interface JobsResponse {
  jobs: Job[]
  total: number
  page: number
  totalPages: number
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  OPEN: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  ASSIGNED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  IN_PROGRESS: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  DELIVERED: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  COMPLETED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30"
}

const statusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  OPEN: "Ouverte",
  PENDING: "En attente",
  ASSIGNED: "Assignée",
  IN_PROGRESS: "En cours",
  DELIVERED: "Livrée",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée"
}

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR"
  }).format(cents / 100)
}

export default function AdminJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionDialog, setActionDialog] = useState<{ job: Job; action: "complete" | "cancel" | "litige" } | null>(null)
  const [detailDialog, setDetailDialog] = useState<Job | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [contactUser, setContactUser] = useState<{ id: string; name: string; email: string; phone?: string | null } | null>(null)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20"
      })
      if (statusFilter !== "ALL") params.set("status", statusFilter)
      if (search) params.set("search", search)

      const res = await fetch(`/api/admin/jobs?${params}`)
      if (res.ok) {
        const data: JobsResponse = await res.json()
        setJobs(data.jobs)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      }
    } catch (error) {
      console.error("Error fetching jobs:", error)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, search])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchJobs()
  }

  const handleAction = async () => {
    if (!actionDialog) return
    setActionLoading(actionDialog.job.id)
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: actionDialog.job.id,
          action: actionDialog.action === "litige" ? "changeStatus" : actionDialog.action,
          status: actionDialog.action === "litige" ? "PENDING" : undefined
        })
      })
      if (res.ok) {
        setActionDialog(null)
        fetchJobs()
      }
    } catch (error) {
      console.error("Error updating job:", error)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-emerald-400" />
            Missions
          </h1>
          <p className="text-gray-400">Gestion des missions de la plateforme</p>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-lg px-4 py-1">
          {total} missions
        </Badge>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par titre ou secteur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-emerald-500"
              />
            </div>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Rechercher
            </Button>
          </form>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="ALL" className="text-white hover:bg-slate-700">Tous les statuts</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value} className="text-white hover:bg-slate-700">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="bg-slate-800 border-slate-700">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-gray-400">Mission</TableHead>
                <TableHead className="text-gray-400">Entreprise</TableHead>
                <TableHead className="text-gray-400">Statut</TableHead>
                <TableHead className="text-gray-400 hidden md:table-cell">Chauffeur</TableHead>
                <TableHead className="text-gray-400 hidden lg:table-cell">Prix</TableHead>
                <TableHead className="text-gray-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i} className="border-slate-700">
                    <TableCell><Skeleton className="h-10 w-48 bg-slate-700" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 bg-slate-700" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 bg-slate-700" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-24 bg-slate-700" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-6 w-16 bg-slate-700" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-28 bg-slate-700 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : jobs.length === 0 ? (
                <TableRow className="border-slate-700">
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Aucune mission trouvée
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => {
                  const assignedBooking = job.bookings.find(b =>
                    ["ASSIGNED", "IN_PROGRESS", "DELIVERED", "COMPLETED"].includes(b.status)
                  )
                  return (
                    <TableRow key={job.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{job.title}</p>
                          <p className="text-sm text-gray-400">{job.secteurLivraison}</p>
                          <p className="text-xs text-gray-500">{job.typeMission}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-300">{job.company.companyName}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[job.status]} border`}>
                          {statusLabels[job.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {assignedBooking ? (
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-emerald-400" />
                            <span className="text-emerald-400">
                              {assignedBooking.driver.user.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500">Non assigné</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1">
                          <Euro className="h-4 w-4 text-pink-400" />
                          <span className="font-medium text-white">{formatCurrency(job.dayRate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDetailDialog(job)}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-slate-600"
                            title="Détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setContactUser({
                              id: job.company.user.id,
                              name: job.company.companyName,
                              email: job.company.user.email,
                              phone: job.company.phone
                            })}
                            className="h-8 w-8 p-0 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                            title="Contacter entreprise"
                          >
                            <Building2 className="h-4 w-4" />
                          </Button>
                          {assignedBooking && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setContactUser({
                                id: assignedBooking.driver.user.id,
                                name: assignedBooking.driver.user.name || 'Chauffeur',
                                email: assignedBooking.driver.user.email,
                                phone: assignedBooking.driver.phone
                              })}
                              className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                              title="Contacter chauffeur"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                          {!["COMPLETED", "CANCELLED"].includes(job.status) && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setActionDialog({ job, action: "complete" })}
                                disabled={actionLoading === job.id}
                                className="h-8 w-8 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                title="Valider"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setActionDialog({ job, action: "litige" })}
                                disabled={actionLoading === job.id}
                                className="h-8 w-8 p-0 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                                title="Litige"
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setActionDialog({ job, action: "cancel" })}
                                disabled={actionLoading === job.id}
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                title="Annuler"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-slate-700">
          <p className="text-sm text-gray-400">
            {total} mission{total > 1 ? "s" : ""} au total
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="bg-transparent border-slate-600 text-gray-300 hover:bg-slate-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-400">
              Page {page} / {totalPages || 1}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="bg-transparent border-slate-600 text-gray-300 hover:bg-slate-700"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              {actionDialog?.action === "complete" && <CheckCircle className="h-5 w-5 text-emerald-400" />}
              {actionDialog?.action === "litige" && <AlertTriangle className="h-5 w-5 text-yellow-400" />}
              {actionDialog?.action === "cancel" && <XCircle className="h-5 w-5 text-red-400" />}
              {actionDialog?.action === "complete" ? "Valider la mission" :
               actionDialog?.action === "litige" ? "Signaler un litige" : "Annuler la mission"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {actionDialog?.action === "complete"
                ? `Êtes-vous sûr de vouloir marquer la mission "${actionDialog?.job.title}" comme terminée ?`
                : actionDialog?.action === "litige"
                ? `Êtes-vous sûr de vouloir signaler un litige pour la mission "${actionDialog?.job.title}" ?`
                : `Êtes-vous sûr de vouloir annuler la mission "${actionDialog?.job.title}" ?`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)} className="bg-transparent border-slate-600 text-gray-300 hover:bg-slate-700">
              Annuler
            </Button>
            <Button
              onClick={handleAction}
              disabled={actionLoading === actionDialog?.job.id}
              className={
                actionDialog?.action === "complete" ? "bg-emerald-600 hover:bg-emerald-700" :
                actionDialog?.action === "litige" ? "bg-yellow-600 hover:bg-yellow-700" :
                "bg-red-600 hover:bg-red-700"
              }
            >
              {actionDialog?.action === "complete" ? "Valider" :
               actionDialog?.action === "litige" ? "Signaler" : "Annuler la mission"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">{detailDialog?.title}</DialogTitle>
          </DialogHeader>
          {detailDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-gray-400">Entreprise</p>
                  <p className="font-medium text-white">{detailDialog.company.companyName}</p>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-gray-400">Statut</p>
                  <Badge className={`${statusColors[detailDialog.status]} border mt-1`}>
                    {statusLabels[detailDialog.status]}
                  </Badge>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-gray-400">Secteur</p>
                  <p className="font-medium text-white">{detailDialog.secteurLivraison}</p>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-gray-400">Prix</p>
                  <p className="font-medium text-white">{formatCurrency(detailDialog.dayRate)}</p>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-gray-400">Type</p>
                  <p className="font-medium text-white">{detailDialog.typeMission}</p>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-gray-400">Date de création</p>
                  <p className="font-medium text-white">
                    {new Date(detailDialog.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
              {detailDialog.bookings.length > 0 && (
                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-gray-400 mb-3">Réservations ({detailDialog.bookings.length})</p>
                  <div className="space-y-2">
                    {detailDialog.bookings.map(booking => (
                      <div key={booking.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-emerald-400" />
                          <span className="text-white">{booking.driver.user.name}</span>
                        </div>
                        <Badge className={`${statusColors[booking.status]} border`}>
                          {statusLabels[booking.status]}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Modal */}
      <ContactModal
        user={contactUser}
        open={!!contactUser}
        onOpenChange={(open) => !open && setContactUser(null)}
      />
    </div>
  )
}
