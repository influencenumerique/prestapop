"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, ArrowRight, Zap, Trophy, Shield, Truck, Users } from "lucide-react"
import { type FeedbackTag } from "@/components/driver-feedback-tags"
import { type BadgeType } from "@/components/driver-badges"

interface Driver {
  id: string
  name: string
  city: string
  rating: number
  reviewCount: number
  totalDeliveries: number
  yearsExperience: number
  vehicleTypes: string[]
  vehicleDetails: string
  bio: string
  availability: string
  verified: boolean
  superDriver: boolean
  topTags?: Array<{ tag: FeedbackTag; percentage: number }>
  badges?: BadgeType[]
  regionalRanking?: { position: number; region: string }
}

const availabilityLabels: Record<string, { label: string; color: string }> = {
  immediate: { label: "DISPO", color: "bg-green-500 text-white animate-pulse" },
  tomorrow: { label: "Demain", color: "bg-blue-500 text-white" },
  in_3_days: { label: "3 jours", color: "bg-orange-500 text-white" },
}

// Calcul du niveau basé sur les livraisons
function getDriverLevel(deliveries: number): { level: number; title: string; color: string; progress: number } {
  if (deliveries >= 500) return { level: 5, title: "LEGENDE", color: "from-yellow-400 to-amber-600", progress: 100 }
  if (deliveries >= 200) return { level: 4, title: "EXPERT", color: "from-purple-500 to-pink-600", progress: (deliveries - 200) / 3 }
  if (deliveries >= 100) return { level: 3, title: "PRO", color: "from-blue-500 to-cyan-500", progress: (deliveries - 100) }
  if (deliveries >= 50) return { level: 2, title: "CONFIRME", color: "from-green-500 to-emerald-500", progress: (deliveries - 50) * 2 }
  return { level: 1, title: "DEBUTANT", color: "from-gray-400 to-gray-500", progress: deliveries * 2 }
}

interface FeaturedDriversSectionProps {
  drivers: Driver[]
}

export function FeaturedDriversSection({ drivers }: FeaturedDriversSectionProps) {
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <Badge className="mb-2 bg-blue-500/20 text-blue-300 border-blue-500/30">
              <Users className="h-3 w-3 mr-1" />
              Pour les entreprises
            </Badge>
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h2 className="text-3xl font-bold text-white">Chauffeurs prets a livrer</h2>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">
                <Zap className="h-3 w-3 mr-1" />
                {drivers.length} disponibles
              </Badge>
            </div>
            <p className="text-slate-400">Recrutez les meilleurs profils pour vos missions</p>
          </div>
          <Link href="/register?type=company">
            <Button className="gap-2 bg-green-500 hover:bg-green-600 text-white">
              Recruter un chauffeur
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {drivers.map((driver) => {
            const availability = availabilityLabels[driver.availability]
            const driverLevel = getDriverLevel(driver.totalDeliveries)

            return (
              <Link key={driver.id} href="/register?type=company">
                <Card className="overflow-hidden hover:scale-105 transition-all duration-300 h-full group border-2 border-slate-700 hover:border-green-500 bg-slate-800/50 backdrop-blur">
                  <CardContent className="p-4 text-center relative">
                    {/* Badge disponibilite */}
                    <div className="absolute top-2 right-2">
                      <Badge className={`${availability.color} text-[10px] font-bold px-2 py-0.5`}>
                        {availability.label}
                      </Badge>
                    </div>

                    {/* Niveau / Rang */}
                    <div className="absolute top-2 left-2">
                      <div className={`bg-gradient-to-r ${driverLevel.color} text-white text-[10px] font-black px-2 py-0.5 rounded`}>
                        LVL {driverLevel.level}
                      </div>
                    </div>

                    {/* Avatar avec bordure niveau */}
                    <div className="relative inline-block mb-2 mt-4">
                      <div className={`w-20 h-20 bg-gradient-to-br ${driverLevel.color} p-1 rounded-full`}>
                        <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center text-3xl font-bold text-white">
                          {driver.name.charAt(0)}
                        </div>
                      </div>
                      {driver.superDriver && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-yellow-500 rounded-full px-2 py-0.5 flex items-center gap-1">
                          <Trophy className="h-3 w-3 text-yellow-900" />
                          <span className="text-[9px] font-bold text-yellow-900">SUPER</span>
                        </div>
                      )}
                      {driver.verified && !driver.superDriver && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-blue-500 rounded-full p-1">
                          <Shield className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Titre niveau */}
                    <div className={`text-[10px] font-bold bg-gradient-to-r ${driverLevel.color} bg-clip-text text-transparent mb-1`}>
                      {driverLevel.title}
                    </div>

                    {/* Nom */}
                    <h3 className="font-bold text-white group-hover:text-green-400 transition-colors">
                      {driver.name}
                    </h3>
                    <p className="text-xs text-slate-400 mb-2">{driver.city}</p>

                    {/* Stats */}
                    <div className="flex justify-center gap-3 mb-3">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-bold text-white">{driver.rating}</span>
                        </div>
                        <div className="text-[9px] text-slate-500">Note</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-white">{driver.totalDeliveries}</div>
                        <div className="text-[9px] text-slate-500">Missions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-white">{driver.yearsExperience}a</div>
                        <div className="text-[9px] text-slate-500">Exp.</div>
                      </div>
                    </div>

                    {/* Barre XP */}
                    <div className="w-full bg-slate-700 rounded-full h-1.5 mb-2">
                      <div
                        className={`bg-gradient-to-r ${driverLevel.color} h-1.5 rounded-full transition-all`}
                        style={{ width: `${Math.min(driverLevel.progress, 100)}%` }}
                      />
                    </div>

                    {/* Vehicule */}
                    <div className="flex items-center justify-center gap-1 text-slate-400">
                      <Truck className="h-3 w-3" />
                      <span className="text-[10px]">{driver.vehicleDetails.split(' ')[0]}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <p className="text-slate-400 mb-4">Inscrivez-vous pour voir tous les profils et contacter les chauffeurs</p>
          <Link href="/register?type=company">
            <Button size="lg" className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-8">
              <Zap className="h-5 w-5" />
              Creer mon compte entreprise gratuit
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
