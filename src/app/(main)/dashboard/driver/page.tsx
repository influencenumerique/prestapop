"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Send,
  CheckCircle2,
  Package,
  Euro,
  DollarSign,
  Star,
  TrendingUp,
  Truck,
  Zap
} from "lucide-react"
import { UsageMeter } from "@/components/subscription/usage-meter"
import { SubscriptionBadge } from "@/components/subscription/subscription-badge"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Stats {
  totalBookings: number
  pendingBookings: number
  acceptedBookings: number
  inProgressBookings: number
  completedBookings: number
  cancelledBookings: number
  totalEarnings: number
  commission: number
  averageRating: number
  earningsPerMonth: Array<{ month: Date; earnings: number; count: number }>
}

interface UsageData {
  applicationsUsed: number
  applicationsLimit: number | null
  missionsUsed: number
  missionsLimit: number | null
  tier: "FREE" | "PRO" | "BUSINESS" | "ENTERPRISE"
  commissionRate: number
}

interface Booking {
  id: string
  status: string
  agreedPrice: number
  createdAt: string
  job: {
    id: string
    title: string
    vehicleVolume: string
    company: {
      companyName: string
    }
  }
}

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR"
  }).format(cents / 100)
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400",
  ASSIGNED: "bg-purple-500/20 text-purple-400",
  IN_PROGRESS: "bg-indigo-500/20 text-indigo-400",
  COMPLETED: "bg-emerald-500/20 text-emerald-400",
  CANCELLED: "bg-red-500/20 text-red-400"
}

const statusLabels: Record<string, string> = {
  PENDING: "En attente",
  ASSIGNED: "Acceptée",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée"
}

export default function DriverDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, bookingsRes, usageRes] = await Promise.all([
        fetch("/api/driver/stats"),
        fetch("/api/driver/bookings?limit=5"),
        fetch("/api/subscriptions/usage")
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }
      if (bookingsRes.ok) {
        const data = await bookingsRes.json()
        setRecentBookings(data.bookings || [])
      }
      if (usageRes.ok) {
        const data = await usageRes.json()
        setUsage(data.usage)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const statCards = [
    {
      title: "Candidatures envoyées",
      value: stats?.totalBookings || 0,
      icon: Send,
      color: "from-blue-500 to-blue-600",
      bgIcon: "bg-blue-500/20"
    },
    {
      title: "Missions acceptées",
      value: stats?.acceptedBookings || 0,
      icon: CheckCircle2,
      color: "from-purple-500 to-purple-600",
      bgIcon: "bg-purple-500/20"
    },
    {
      title: "Missions terminées",
      value: stats?.completedBookings || 0,
      icon: Package,
      color: "from-emerald-500 to-emerald-600",
      bgIcon: "bg-emerald-500/20"
    },
    {
      title: "Gains totaux",
      value: formatCurrency(stats?.totalEarnings || 0),
      icon: Euro,
      color: "from-pink-500 to-pink-600",
      bgIcon: "bg-pink-500/20",
      isText: true
    },
    {
      title: "Commission (15%)",
      value: formatCurrency(stats?.commission || 0),
      icon: DollarSign,
      color: "from-orange-500 to-orange-600",
      bgIcon: "bg-orange-500/20",
      isText: true
    },
    {
      title: "Ma note moyenne",
      value: stats?.averageRating?.toFixed(1) || "0.0",
      icon: Star,
      color: "from-yellow-500 to-yellow-600",
      bgIcon: "bg-yellow-500/20",
      isText: true
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Tableau de bord Chauffeur
              </h1>
              {usage && <SubscriptionBadge tier={usage.tier} size="lg" />}
            </div>
            <p className="text-emerald-100/80">
              Gérez vos candidatures et suivez vos performances de livraison
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/jobs">
              <Button className="bg-white text-emerald-600 hover:bg-emerald-50">
                <Truck className="h-4 w-4 mr-2" />
                Trouver des missions
              </Button>
            </Link>
            <Button
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 w-fit"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

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
                  {card.isText ? card.value : typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                </p>
                <p className="text-sm text-gray-400">{card.title}</p>
              </>
            )}
          </Card>
        ))}
      </div>

      {/* Subscription Usage */}
      {usage && (
        <Card className="bg-slate-800 border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Zap className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Mon abonnement</h3>
                <p className="text-sm text-gray-400">
                  {usage.tier === "FREE" ? "Plan Gratuit" : `Plan ${usage.tier}`} - Commission {(usage.commissionRate * 100).toFixed(0)}%
                </p>
              </div>
            </div>
            <Link href="/pricing">
              <Button variant="outline" size="sm" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
                {usage.tier === "FREE" ? "Passer Pro" : "Gérer"}
              </Button>
            </Link>
          </div>
          <UsageMeter
            label="Candidatures ce mois"
            current={usage.applicationsUsed}
            max={usage.applicationsLimit}
            variant="applications"
          />
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Chart */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Gains mensuels</h3>
              <p className="text-sm text-gray-400">Revenus des 6 derniers mois</p>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          {loading ? (
            <div className="h-48 flex items-end justify-between gap-2">
              {[80, 120, 60, 100, 90, 110].map((height, i) => (
                <Skeleton key={i} className="w-full bg-slate-700" style={{ height: `${height}px` }} />
              ))}
            </div>
          ) : stats?.earningsPerMonth && stats.earningsPerMonth.length > 0 ? (
            <div className="h-48 flex items-end justify-between gap-2">
              {stats.earningsPerMonth.map((item, index) => {
                const maxEarnings = Math.max(...stats.earningsPerMonth.map(r => r.earnings))
                const height = maxEarnings > 0 ? (item.earnings / maxEarnings) * 160 : 20
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs text-gray-400">{formatCurrency(item.earnings)}</span>
                    <div
                      className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all hover:from-emerald-500 hover:to-emerald-300 cursor-pointer"
                      style={{ height: `${Math.max(height, 20)}px` }}
                      title={`${item.count} mission(s)`}
                    />
                    <span className="text-xs text-gray-500">
                      {new Date(item.month).toLocaleDateString('fr-FR', { month: 'short' })}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">
              Aucune donnée disponible
            </div>
          )}
        </Card>

        {/* Financial Summary */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Bilan financier</h3>
              <p className="text-sm text-gray-400">Résumé de vos gains</p>
            </div>
            <Euro className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Euro className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Gains nets</p>
                  <p className="text-xl font-bold text-white">{formatCurrency((stats?.totalEarnings || 0) - (stats?.commission || 0))}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Commission plateforme (15%)</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(stats?.commission || 0)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Star className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Ma note moyenne</p>
                  <p className="text-xl font-bold text-white">{stats?.averageRating?.toFixed(1) || "0.0"} / 5</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card className="bg-slate-800 border-slate-700">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Mes missions</h3>
            <p className="text-sm text-gray-400">Dernières candidatures et missions</p>
          </div>
          <Link href="/jobs">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Truck className="h-4 w-4 mr-2" />
              Trouver des missions
            </Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-gray-400">Mission</TableHead>
                <TableHead className="text-gray-400">Entreprise</TableHead>
                <TableHead className="text-gray-400">Statut</TableHead>
                <TableHead className="text-gray-400 text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i} className="border-slate-700">
                    <TableCell><Skeleton className="h-8 w-32 bg-slate-700" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 bg-slate-700" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 bg-slate-700" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 bg-slate-700 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : recentBookings.length === 0 ? (
                <TableRow className="border-slate-700">
                  <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                    Aucune mission pour le moment
                  </TableCell>
                </TableRow>
              ) : (
                recentBookings.map((booking) => (
                  <TableRow key={booking.id} className="border-slate-700 hover:bg-slate-700/50 cursor-pointer" onClick={() => router.push(`/jobs/${booking.job.id}`)}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{booking.job.title}</p>
                        <p className="text-sm text-gray-400">{booking.job.vehicleVolume}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-white">{booking.job.company.companyName}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[booking.status]}>
                        {statusLabels[booking.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-white">{formatCurrency(booking.agreedPrice)}</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
