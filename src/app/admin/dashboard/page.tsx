"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Users,
  Building2,
  Truck,
  Briefcase,
  Euro,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  Mail,
  Ban,
  UserPlus,
  CheckCircle,
  XCircle,
  FileText,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { toast } from "sonner"
import { NewRegistrationModal } from "@/components/new-registration-modal"

interface Stats {
  totalUsers: number
  totalCompanies: number
  totalDrivers: number
  totalJobs: number
  openJobs: number
  completedJobs: number
  totalBookings: number
  revenue: number
  totalPaid: number
  jobsPerWeek: Array<{ week: string; count: number }>
  usersPerMonth: Array<{ month: string; count: number }>
}

interface Document {
  id: string
  type: "SIRET" | "PERMIS" | "ASSURANCE"
  url: string
  status: "OK" | "MISSING" | "ILLEGIBLE"
}

interface PendingUser {
  id: string
  email: string
  name: string | null
  role: string
  status: string
  createdAt: string
  documents: Document[]
  verificationDocs?: {
    siretUrl?: string | null
    permisUrl?: string | null
    assuranceUrl?: string | null
  } | null
  company?: { companyName: string } | null
  driverProfile?: { phone?: string | null; city?: string | null } | null
}

interface RecentUser {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
}

interface RecentJob {
  id: string
  title: string
  status: string
  dayRate: number
  company: { companyName: string }
  createdAt: string
}

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR"
  }).format(cents / 100)
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-500/20 text-red-400 border-red-500/30",
  COMPANY: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  DRIVER: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  USER: "bg-gray-500/20 text-gray-400 border-gray-500/30"
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500/20 text-gray-400",
  OPEN: "bg-blue-500/20 text-blue-400",
  PENDING: "bg-yellow-500/20 text-yellow-400",
  ASSIGNED: "bg-purple-500/20 text-purple-400",
  IN_PROGRESS: "bg-indigo-500/20 text-indigo-400",
  COMPLETED: "bg-emerald-500/20 text-emerald-400",
  CANCELLED: "bg-red-500/20 text-red-400"
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([])
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

  const fetchData = useCallback(async (isPolling = false) => {
    try {
      const [statsRes, usersRes, jobsRes, pendingRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users?limit=5"),
        fetch("/api/admin/jobs?limit=5"),
        fetch("/api/admin/users?status=PENDING_VERIF&limit=5")
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }
      if (usersRes.ok) {
        const data = await usersRes.json()
        setRecentUsers(data.users || [])
      }
      if (jobsRes.ok) {
        const data = await jobsRes.json()
        setRecentJobs(data.jobs || [])
      }
      if (pendingRes.ok) {
        const data = await pendingRes.json()
        setPendingUsers(data.users || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      if (!isPolling) setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Polling every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true)
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Quick action handlers for inline buttons
  const handleQuickAction = async (userId: string, action: "ACTIVE" | "PENDING_VERIF" | "REJECTED") => {
    setActionLoading(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || "Action effectuée")
        fetchData()
        setSelectedUsers(prev => {
          const next = new Set(prev)
          next.delete(userId)
          return next
        })
      } else {
        toast.error(data.error || "Erreur")
      }
    } catch {
      toast.error("Erreur de connexion")
    } finally {
      setActionLoading(null)
    }
  }

  // Batch action handler
  const handleBatchAction = async (action: "ACTIVE" | "REJECTED") => {
    if (selectedUsers.size === 0) return
    setActionLoading("batch")
    const promises = Array.from(selectedUsers).map(userId =>
      fetch(`/api/admin/users/${userId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action })
      })
    )
    try {
      await Promise.all(promises)
      toast.success(`${selectedUsers.size} utilisateur(s) ${action === "ACTIVE" ? "validé(s)" : "refusé(s)"}`)
      setSelectedUsers(new Set())
      fetchData()
    } catch {
      toast.error("Erreur lors du traitement")
    } finally {
      setActionLoading(null)
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const getRoleIcon = (role: string) => {
    return role === "COMPANY" ? Building2 : Truck
  }

  const statCards = [
    {
      title: "Utilisateurs",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      bgIcon: "bg-blue-500/20"
    },
    {
      title: "Entreprises",
      value: stats?.totalCompanies || 0,
      icon: Building2,
      color: "from-purple-500 to-purple-600",
      bgIcon: "bg-purple-500/20"
    },
    {
      title: "Chauffeurs",
      value: stats?.totalDrivers || 0,
      icon: Truck,
      color: "from-emerald-500 to-emerald-600",
      bgIcon: "bg-emerald-500/20"
    },
    {
      title: "Jobs ouverts",
      value: stats?.openJobs || 0,
      icon: Briefcase,
      color: "from-orange-500 to-orange-600",
      bgIcon: "bg-orange-500/20"
    },
    {
      title: "CA Stripe (15%)",
      value: formatCurrency(stats?.revenue || 0),
      icon: Euro,
      color: "from-pink-500 to-pink-600",
      bgIcon: "bg-pink-500/20",
      isText: true
    },
    {
      title: "Litiges",
      value: 0,
      icon: AlertTriangle,
      color: "from-red-500 to-red-600",
      bgIcon: "bg-red-500/20"
    }
  ]

  return (
    <div className="space-y-8">
      {/* NOUVELLES INSCRIPTIONS - Hero Section TOP */}
      {pendingUsers.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500 via-yellow-600 to-orange-600 p-6 md:p-8 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            {/* Header with Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl">
                  <UserPlus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl md:text-2xl font-bold text-white">Nouvelles inscriptions</h2>
                    <Badge className="bg-white/90 text-yellow-700 hover:bg-white/80 animate-pulse">
                      🚨 {pendingUsers.length} en attente
                    </Badge>
                  </div>
                  <p className="text-yellow-100/80 text-sm mt-1">Vérification requise</p>
                </div>
              </div>

              {/* Batch Actions */}
              {selectedUsers.size > 0 && (
                <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2">
                  <span className="text-white text-sm px-2">{selectedUsers.size} sélectionné(s)</span>
                  <Button
                    size="sm"
                    onClick={() => handleBatchAction("ACTIVE")}
                    disabled={actionLoading === "batch"}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    {actionLoading === "batch" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    <span className="ml-1 hidden sm:inline">Valider</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleBatchAction("REJECTED")}
                    disabled={actionLoading === "batch"}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    {actionLoading === "batch" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    <span className="ml-1 hidden sm:inline">Refuser</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Pending Users Cards - Horizontal scroll on mobile, grid on desktop */}
            <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:overflow-visible snap-x snap-mandatory md:snap-none">
              {pendingUsers.slice(0, 5).map((user) => {
                const RoleIcon = getRoleIcon(user.role)
                const isSelected = selectedUsers.has(user.id)
                const isLoading = actionLoading === user.id

                return (
                  <div
                    key={user.id}
                    className={`
                      flex-shrink-0 w-72 md:w-auto snap-center
                      bg-white/95 backdrop-blur-sm rounded-xl p-4
                      border-2 transition-all duration-200
                      ${isSelected ? 'border-yellow-400 shadow-lg shadow-yellow-400/20' : 'border-transparent'}
                      hover:border-white/50 hover:shadow-lg hover:scale-[1.02]
                      group cursor-pointer
                    `}
                    onClick={() => toggleUserSelection(user.id)}
                  >
                    {/* User Info */}
                    <div className="flex items-start gap-3 mb-3">
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
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">
                          {user.name || "Sans nom"}
                        </p>
                        <p className="text-sm text-slate-500 truncate">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`${roleColors[user.role]} border text-xs`}>
                            {user.role}
                          </Badge>
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            En attente
                          </Badge>
                        </div>
                      </div>
                      {/* Selection indicator */}
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-yellow-500 border-yellow-500' : 'border-slate-300'}`}>
                        {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                      </div>
                    </div>

                    {/* Company/Driver Info */}
                    {user.company && (
                      <p className="text-xs text-purple-600 mb-2 truncate">
                        <Building2 className="h-3 w-3 inline mr-1" />
                        {user.company.companyName}
                      </p>
                    )}
                    {user.driverProfile?.city && (
                      <p className="text-xs text-emerald-600 mb-2 truncate">
                        📍 {user.driverProfile.city}
                      </p>
                    )}

                    {/* Inline Action Buttons */}
                    <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        onClick={() => handleQuickAction(user.id, "ACTIVE")}
                        disabled={isLoading}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-8 transition-all hover:shadow-md"
                      >
                        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <>✅ Valider</>}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user)
                          setModalOpen(true)
                        }}
                        disabled={isLoading}
                        className="flex-1 border-yellow-400 text-yellow-700 hover:bg-yellow-50 text-xs h-8"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Docs
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleQuickAction(user.id, "REJECTED")}
                        disabled={isLoading}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs h-8 transition-all hover:shadow-md"
                      >
                        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <>❌ Refuser</>}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* View All Link */}
            {pendingUsers.length > 5 && (
              <div className="mt-4 text-center">
                <Link href="/admin/users?status=PENDING_VERIF">
                  <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                    Voir tous les {pendingUsers.length} en attente
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Original Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Bienvenue, {session?.user?.name || 'Super Admin'}
            </h1>
            <p className="text-emerald-100/80">
              Voici un aperçu de votre plateforme PrestaPop
            </p>
          </div>
          <Button
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 w-fit"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            Déconnexion
          </Button>
        </div>
      </div>

      {/* New Registration Modal */}
      <NewRegistrationModal
        user={selectedUser}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={() => fetchData()}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, index) => (
          <Card key={index} className="bg-slate-800 border-slate-700 p-4 hover:border-slate-600 transition-colors">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-10 rounded-lg bg-slate-700" />
                <Skeleton className="h-6 w-16 bg-slate-700" />
                <Skeleton className="h-4 w-20 bg-slate-700" />
              </div>
            ) : (
              <>
                <div className={`inline-flex p-2.5 rounded-lg ${card.bgIcon} mb-3`}>
                  <card.icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {card.isText ? card.value : card.value.toLocaleString()}
                </p>
                <p className="text-sm text-gray-400">{card.title}</p>
              </>
            )}
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jobs per week */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Missions / semaine</h3>
              <p className="text-sm text-gray-400">8 dernières semaines</p>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          {loading ? (
            <div className="h-48 flex items-end justify-between gap-2">
              {[80, 120, 60, 100, 90, 110, 75, 95].map((height, i) => (
                <Skeleton key={i} className="w-full bg-slate-700" style={{ height: `${height}px` }} />
              ))}
            </div>
          ) : stats?.jobsPerWeek && stats.jobsPerWeek.length > 0 ? (
            <div className="h-48 flex items-end justify-between gap-2">
              {stats.jobsPerWeek.map((item, index) => {
                const maxCount = Math.max(...stats.jobsPerWeek.map(j => j.count))
                const height = maxCount > 0 ? (item.count / maxCount) * 160 : 20
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs text-gray-400">{item.count}</span>
                    <div
                      className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all hover:from-emerald-500 hover:to-emerald-300"
                      style={{ height: `${Math.max(height, 20)}px` }}
                    />
                    <span className="text-xs text-gray-500">
                      {new Date(item.week).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">
              Pas de données disponibles
            </div>
          )}
        </Card>

        {/* Revenue Summary */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Résumé financier</h3>
              <p className="text-sm text-gray-400">Performance globale</p>
            </div>
            <Euro className="h-5 w-5 text-pink-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Volume transactionnel</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(stats?.totalPaid || 0)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500/20 rounded-lg">
                  <Euro className="h-5 w-5 text-pink-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Commission (15%)</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(stats?.revenue || 0)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Briefcase className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Missions terminées</p>
                  <p className="text-xl font-bold text-white">{stats?.completedJobs || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Users & Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card className="bg-slate-800 border-slate-700">
          <div className="p-6 border-b border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Utilisateurs récents</h3>
              <p className="text-sm text-gray-400">Dernières inscriptions</p>
            </div>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
                Voir tout <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-transparent">
                  <TableHead className="text-gray-400">Utilisateur</TableHead>
                  <TableHead className="text-gray-400">Rôle</TableHead>
                  <TableHead className="text-gray-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i} className="border-slate-700">
                      <TableCell><Skeleton className="h-8 w-32 bg-slate-700" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 bg-slate-700" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16 bg-slate-700 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : recentUsers.length === 0 ? (
                  <TableRow className="border-slate-700">
                    <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                      Aucun utilisateur
                    </TableCell>
                  </TableRow>
                ) : (
                  recentUsers.map((user) => (
                    <TableRow key={user.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{user.name || "Sans nom"}</p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${roleColors[user.role]} border`}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-slate-600">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10">
                            <Ban className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Recent Jobs */}
        <Card className="bg-slate-800 border-slate-700">
          <div className="p-6 border-b border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Missions en attente</h3>
              <p className="text-sm text-gray-400">À valider</p>
            </div>
            <Link href="/admin/jobs">
              <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
                Voir tout <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-transparent">
                  <TableHead className="text-gray-400">Mission</TableHead>
                  <TableHead className="text-gray-400">Statut</TableHead>
                  <TableHead className="text-gray-400 text-right">Prix</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i} className="border-slate-700">
                      <TableCell><Skeleton className="h-8 w-32 bg-slate-700" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 bg-slate-700" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 bg-slate-700 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : recentJobs.length === 0 ? (
                  <TableRow className="border-slate-700">
                    <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                      Aucune mission
                    </TableCell>
                  </TableRow>
                ) : (
                  recentJobs.map((job) => (
                    <TableRow key={job.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{job.title}</p>
                          <p className="text-sm text-gray-400">{job.company.companyName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[job.status]}>
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium text-white">{formatCurrency(job.dayRate)}</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  )
}
