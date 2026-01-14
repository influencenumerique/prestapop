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
  Building2,
  Package,
  CheckCircle2,
  Euro,
  TrendingUp,
  ArrowRight,
  Clock,
  FileText,
  Star,
  DollarSign,
  Briefcase,
  Plus,
  Zap
} from "lucide-react"
import { UsageMeter } from "@/components/subscription/usage-meter"
import { SubscriptionBadge } from "@/components/subscription/subscription-badge"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { MultiDriverMap } from "@/components/tracking/multi-driver-map"

interface Stats {
  totalJobs: number
  draftJobs: number
  openJobs: number
  assignedJobs: number
  completedJobs: number
  totalBookings: number
  totalRevenue: number
  commission: number
  averageRating: number
  revenuePerMonth: Array<{ month: Date; revenue: number; count: number }>
}

interface UsageData {
  applicationsUsed: number
  applicationsLimit: number | null
  missionsUsed: number
  missionsLimit: number | null
  tier: string
  commissionRate: number
}

interface Job {
  id: string
  title: string
  status: string
  dayRate: number
  secteurLivraison: string
  missionZoneType: string
  vehicleVolume: string
  startTime: string
  estimatedEndTime: string
  _count: { bookings: number }
}

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR"
  }).format(cents / 100)
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500/20 text-gray-400",
  OPEN: "bg-blue-500/20 text-blue-400",
  ASSIGNED: "bg-purple-500/20 text-purple-400",
  IN_PROGRESS: "bg-indigo-500/20 text-indigo-400",
  COMPLETED: "bg-emerald-500/20 text-emerald-400",
  CANCELLED: "bg-red-500/20 text-red-400"
}

const statusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  OPEN: "Ouverte",
  ASSIGNED: "Attribuée",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée"
}

export default function CompanyDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentJobs, setRecentJobs] = useState<Job[]>([])
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, jobsRes, usageRes] = await Promise.all([
        fetch("/api/company/stats"),
        fetch("/api/company/jobs?limit=5"),
        fetch("/api/subscriptions/usage")
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }
      if (jobsRes.ok) {
        const data = await jobsRes.json()
        setRecentJobs(data.jobs || [])
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
      title: "Missions créées",
      value: stats?.totalJobs || 0,
      icon: Briefcase,
      color: "from-blue-500 to-blue-600",
      bgIcon: "bg-blue-500/20"
    },
    {
      title: "Missions ouvertes",
      value: stats?.openJobs || 0,
      icon: Package,
      color: "from-purple-500 to-purple-600",
      bgIcon: "bg-purple-500/20"
    },
    {
      title: "Missions terminées",
      value: stats?.completedJobs || 0,
      icon: CheckCircle2,
      color: "from-emerald-500 to-emerald-600",
      bgIcon: "bg-emerald-500/20"
    },
    {
      title: "CA total",
      value: formatCurrency(stats?.totalRevenue || 0),
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
      title: "Rating moyen",
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Tableau de bord Entreprise
              </h1>
              {usage && <SubscriptionBadge tier={usage.tier} size="lg" />}
            </div>
            <p className="text-blue-100/80">
              Gérez vos missions de livraison et suivez vos performances
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/create-job">
              <Button className="bg-white text-blue-600 hover:bg-blue-50">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle mission
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
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Zap className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Mon abonnement</h3>
                <p className="text-sm text-gray-400">
                  {usage.tier === "FREE" ? "Plan Gratuit" : `Plan ${usage.tier}`} - Commission {(usage.commissionRate * 100).toFixed(0)}%
                </p>
              </div>
            </div>
            <Link href="/pricing">
              <Button variant="outline" size="sm" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
                {usage.tier === "FREE" ? "Passer Pro" : "Gérer"}
              </Button>
            </Link>
          </div>
          <UsageMeter
            label="Missions ce mois"
            current={usage.missionsUsed}
            max={usage.missionsLimit}
            variant="missions"
          />
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Chiffre d'affaires</h3>
              <p className="text-sm text-gray-400">CA mensuel (6 derniers mois)</p>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          {loading ? (
            <div className="h-48 flex items-end justify-between gap-2">
              {[80, 120, 60, 100, 90, 110].map((height, i) => (
                <Skeleton key={i} className="w-full bg-slate-700" style={{ height: `${height}px` }} />
              ))}
            </div>
          ) : stats?.revenuePerMonth && stats.revenuePerMonth.length > 0 ? (
            <div className="h-48 flex items-end justify-between gap-2">
              {stats.revenuePerMonth.map((item, index) => {
                const maxRevenue = Math.max(...stats.revenuePerMonth.map(r => r.revenue))
                const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 160 : 20
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs text-gray-400">{formatCurrency(item.revenue)}</span>
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all hover:from-blue-500 hover:to-blue-300 cursor-pointer"
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
              <h3 className="text-lg font-semibold text-white">Facturation</h3>
              <p className="text-sm text-gray-400">Résumé financier</p>
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
                  <p className="text-sm text-gray-400">CA total</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(stats?.totalRevenue || 0)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-pink-400" />
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
                  <p className="text-sm text-gray-400">Rating moyen chauffeurs</p>
                  <p className="text-xl font-bold text-white">{stats?.averageRating?.toFixed(1) || "0.0"} / 5</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Multi-Driver Tracking Map */}
      <MultiDriverMap />

      {/* Recent Jobs */}
      <Card className="bg-slate-800 border-slate-700">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Mes missions récentes</h3>
            <p className="text-sm text-gray-400">Dernières missions publiées</p>
          </div>
          <Link href="/dashboard/create-job">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle mission
            </Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-gray-400">Mission</TableHead>
                <TableHead className="text-gray-400">Zone / Secteur</TableHead>
                <TableHead className="text-gray-400">Statut</TableHead>
                <TableHead className="text-gray-400 text-right">Tarif</TableHead>
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
              ) : recentJobs.length === 0 ? (
                <TableRow className="border-slate-700">
                  <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                    Aucune mission publiée
                  </TableCell>
                </TableRow>
              ) : (
                recentJobs.map((job) => (
                  <TableRow key={job.id} className="border-slate-700 hover:bg-slate-700/50 cursor-pointer" onClick={() => router.push(`/jobs/${job.id}`)}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{job.title}</p>
                        <p className="text-sm text-gray-400">{job.vehicleVolume}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-white">{job.missionZoneType === "URBAN" ? "Urbain" : "Ville à ville"}</p>
                        <p className="text-sm text-gray-400">{job.secteurLivraison}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge className={statusColors[job.status]}>
                          {statusLabels[job.status]}
                        </Badge>
                        <p className="text-xs text-gray-400 mt-1">{job._count.bookings} candidature(s)</p>
                      </div>
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
  )
}
