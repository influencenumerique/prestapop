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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  Search,
  Trash2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Ban,
  AlertTriangle,
  Mail,
  Star,
  Users,
  FileSearch,
  FileText
} from "lucide-react"
import { ContactModal } from "@/components/contact-modal"
import { VerificationModal } from "@/components/verification-modal"

interface Document {
  id: string
  type: "SIRET" | "PERMIS" | "ASSURANCE"
  url: string
  status: "OK" | "MISSING" | "ILLEGIBLE"
}

interface User {
  id: string
  email: string
  name: string | null
  role: string
  status: string
  createdAt: string
  verificationDocs?: {
    siretUrl?: string | null
    permisUrl?: string | null
    assuranceUrl?: string | null
  } | null
  rejectionReason?: string | null
  documents: Document[]
  company?: { companyName: string; isVerified: boolean; phone?: string | null } | null
  driverProfile?: { isVerified: boolean; rating: number; totalDeliveries: number; phone?: string | null; city?: string | null } | null
}

interface UsersResponse {
  users: User[]
  total: number
  page: number
  totalPages: number
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-500/20 text-red-400 border-red-500/30",
  COMPANY: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  DRIVER: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  USER: "bg-gray-500/20 text-gray-400 border-gray-500/30"
}

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  COMPANY: "Entreprise",
  DRIVER: "Chauffeur",
  USER: "Utilisateur"
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  PENDING_VERIF: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  VERIFIED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  REJECTED: "bg-red-500/20 text-red-400 border-red-500/30"
}

const statusLabels: Record<string, string> = {
  ACTIVE: "Actif",
  PENDING_VERIF: "En attente",
  VERIFIED: "Vérifié",
  REJECTED: "Refusé"
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [deleteDialog, setDeleteDialog] = useState<User | null>(null)
  const [warnDialog, setWarnDialog] = useState<User | null>(null)
  const [contactUser, setContactUser] = useState<{ id: string; name: string; email: string; phone?: string | null } | null>(null)
  const [verifyUser, setVerifyUser] = useState<User | null>(null)
  const [warnMessage, setWarnMessage] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20"
      })
      if (roleFilter !== "ALL") params.set("role", roleFilter)
      if (statusFilter !== "ALL") params.set("status", statusFilter)
      if (search) params.set("search", search)

      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) {
        const data: UsersResponse = await res.json()
        setUsers(data.users)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Erreur lors du chargement des utilisateurs")
    } finally {
      setLoading(false)
    }
  }, [page, roleFilter, statusFilter, search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const handleVerify = async (userId: string) => {
    setActionLoading(userId)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "verify" })
      })
      if (res.ok) {
        toast.success("Utilisateur vérifié !")
        fetchUsers()
      } else {
        toast.error("Erreur lors de la vérification")
      }
    } catch (error) {
      console.error("Error verifying user:", error)
      toast.error("Erreur de connexion")
    } finally {
      setActionLoading(null)
    }
  }

  const handleBan = async (userId: string) => {
    setActionLoading(userId)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "block" })
      })
      if (res.ok) {
        toast.success("Utilisateur banni")
        fetchUsers()
      } else {
        toast.error("Erreur lors du bannissement")
      }
    } catch (error) {
      console.error("Error banning user:", error)
      toast.error("Erreur de connexion")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog) return
    setActionLoading(deleteDialog.id)
    try {
      const res = await fetch(`/api/admin/users?userId=${deleteDialog.id}`, {
        method: "DELETE"
      })
      if (res.ok) {
        toast.success("Utilisateur supprimé")
        setDeleteDialog(null)
        fetchUsers()
      } else {
        toast.error("Erreur lors de la suppression")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Erreur de connexion")
    } finally {
      setActionLoading(null)
    }
  }

  const handleWarn = async () => {
    if (!warnDialog || !warnMessage) return
    toast.success(`Avertissement envoyé à ${warnDialog.email}`)
    setWarnDialog(null)
    setWarnMessage("")
  }

  const openContactModal = (user: User) => {
    const phone = user.company?.phone || user.driverProfile?.phone || null
    setContactUser({
      id: user.id,
      name: user.name || 'Utilisateur',
      email: user.email,
      phone
    })
  }

  const getDocsCount = (user: User): { ok: number; total: number } => {
    const requiredDocs = user.role === "COMPANY" ? ["SIRET", "ASSURANCE"] : ["PERMIS", "ASSURANCE"]
    const docs = user.documents || []
    const ok = docs.filter(d => requiredDocs.includes(d.type) && d.status === "OK").length
    return { ok, total: requiredDocs.length }
  }

  const pendingCount = users.filter(u => u.status === "PENDING_VERIF").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-7 w-7 text-emerald-400" />
            Utilisateurs
          </h1>
          <p className="text-gray-400">Gestion des utilisateurs de la plateforme</p>
        </div>
        <div className="flex gap-2">
          {statusFilter === "PENDING_VERIF" && pendingCount > 0 && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-lg px-4 py-1">
              {pendingCount} en attente
            </Badge>
          )}
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-lg px-4 py-1">
            {total} utilisateurs
          </Badge>
        </div>
      </div>

      {/* Quick Filter for PENDING_VERIF */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={statusFilter === "PENDING_VERIF" ? "default" : "outline"}
          onClick={() => { setStatusFilter("PENDING_VERIF"); setPage(1) }}
          className={statusFilter === "PENDING_VERIF"
            ? "bg-yellow-600 hover:bg-yellow-700 text-white"
            : "bg-transparent border-yellow-600 text-yellow-400 hover:bg-yellow-600/20"
          }
        >
          <FileSearch className="h-4 w-4 mr-2" />
          Inscriptions à vérifier
        </Button>
        <Button
          variant={statusFilter === "ALL" ? "default" : "outline"}
          onClick={() => { setStatusFilter("ALL"); setPage(1) }}
          className={statusFilter === "ALL"
            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
            : "bg-transparent border-slate-600 text-gray-300 hover:bg-slate-700"
          }
        >
          Tous
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par email ou nom..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-emerald-500"
              />
            </div>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Rechercher
            </Button>
          </form>
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Filtrer par rôle" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="ALL" className="text-white hover:bg-slate-700">Tous les rôles</SelectItem>
              <SelectItem value="ADMIN" className="text-white hover:bg-slate-700">Admin</SelectItem>
              <SelectItem value="COMPANY" className="text-white hover:bg-slate-700">Entreprise</SelectItem>
              <SelectItem value="DRIVER" className="text-white hover:bg-slate-700">Chauffeur</SelectItem>
              <SelectItem value="USER" className="text-white hover:bg-slate-700">Utilisateur</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="ALL" className="text-white hover:bg-slate-700">Tous les statuts</SelectItem>
              <SelectItem value="ACTIVE" className="text-white hover:bg-slate-700">Actif</SelectItem>
              <SelectItem value="PENDING_VERIF" className="text-white hover:bg-slate-700">En attente</SelectItem>
              <SelectItem value="VERIFIED" className="text-white hover:bg-slate-700">Vérifié</SelectItem>
              <SelectItem value="REJECTED" className="text-white hover:bg-slate-700">Refusé</SelectItem>
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
                <TableHead className="text-gray-400">Utilisateur</TableHead>
                <TableHead className="text-gray-400">Rôle</TableHead>
                <TableHead className="text-gray-400">Statut</TableHead>
                <TableHead className="text-gray-400 hidden md:table-cell">Docs</TableHead>
                <TableHead className="text-gray-400 hidden lg:table-cell">Rating</TableHead>
                <TableHead className="text-gray-400 hidden lg:table-cell">Inscrit le</TableHead>
                <TableHead className="text-gray-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i} className="border-slate-700">
                    <TableCell><Skeleton className="h-10 w-48 bg-slate-700" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 bg-slate-700" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 bg-slate-700" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-12 bg-slate-700" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-6 w-12 bg-slate-700" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-6 w-24 bg-slate-700" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-32 bg-slate-700 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow className="border-slate-700">
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Aucun utilisateur trouvé
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const docsCount = getDocsCount(user)
                  return (
                    <TableRow key={user.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{user.name || "Sans nom"}</p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                          {user.company && (
                            <p className="text-xs text-purple-400">{user.company.companyName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${roleColors[user.role]} border`}>
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[user.status] || statusColors.ACTIVE} border`}>
                          {statusLabels[user.status] || "Actif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {(user.role === "COMPANY" || user.role === "DRIVER") ? (
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className={docsCount.ok === docsCount.total ? "text-emerald-400" : "text-orange-400"}>
                              {docsCount.ok}/{docsCount.total}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {user.driverProfile ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-white">{user.driverProfile.rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {/* Verification Modal Button - for PENDING users */}
                          {user.status === "PENDING_VERIF" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setVerifyUser(user)}
                              className="h-8 w-8 p-0 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                              title="Vérifier les documents"
                            >
                              <FileSearch className="h-4 w-4" />
                            </Button>
                          )}
                          {/* Quick Verify for non-pending users */}
                          {user.status !== "PENDING_VERIF" &&
                           (user.company || user.driverProfile) &&
                           !(user.company?.isVerified || user.driverProfile?.isVerified) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleVerify(user.id)}
                              disabled={actionLoading === user.id}
                              className="h-8 w-8 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                              title="Vérifier"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openContactModal(user)}
                            className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            title="Contacter"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setWarnDialog(user)}
                            className="h-8 w-8 p-0 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                            title="Avertir"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleBan(user.id)}
                            disabled={actionLoading === user.id || user.role === "ADMIN"}
                            className="h-8 w-8 p-0 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                            title="Bannir"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteDialog(user)}
                            disabled={actionLoading === user.id || user.role === "ADMIN"}
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
            {total} utilisateur{total > 1 ? "s" : ""} au total
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

      {/* Verification Modal */}
      <VerificationModal
        user={verifyUser}
        open={!!verifyUser}
        onOpenChange={() => setVerifyUser(null)}
        onSuccess={fetchUsers}
      />

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Supprimer l&apos;utilisateur</DialogTitle>
            <DialogDescription className="text-gray-400">
              Êtes-vous sûr de vouloir supprimer l&apos;utilisateur{" "}
              <strong className="text-white">{deleteDialog?.email}</strong> ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)} className="bg-transparent border-slate-600 text-gray-300 hover:bg-slate-700">
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading === deleteDialog?.id}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warn Dialog */}
      <Dialog open={!!warnDialog} onOpenChange={() => { setWarnDialog(null); setWarnMessage("") }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Avertir l&apos;utilisateur
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Envoyer un avertissement à <strong className="text-white">{warnDialog?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Motif de l'avertissement..."
              value={warnMessage}
              onChange={(e) => setWarnMessage(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setWarnDialog(null); setWarnMessage("") }} className="bg-transparent border-slate-600 text-gray-300 hover:bg-slate-700">
              Annuler
            </Button>
            <Button
              onClick={handleWarn}
              disabled={!warnMessage}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Envoyer l&apos;avertissement
            </Button>
          </DialogFooter>
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
