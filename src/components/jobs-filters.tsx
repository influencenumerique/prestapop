"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { Search, SlidersHorizontal, X } from "lucide-react"

const volumeLabels: Record<string, string> = {
  CUBE_6M: "6m³",
  CUBE_9M: "9m³",
  CUBE_12M: "12m³",
  CUBE_15M: "15m³",
  CUBE_20M: "20m³",
}

const zoneTypeLabels: Record<string, string> = {
  URBAN: "Urbain",
  CITY_TO_CITY: "Inter-urbain",
}

const missionTypeLabels: Record<string, string> = {
  DAY: "Journée",
  HALF_DAY: "Demi-journée",
  WEEK: "Semaine",
}

export function JobsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(searchParams.get("secteur") || "")

  const currentFilters = {
    secteur: searchParams.get("secteur") || "",
    missionZoneType: searchParams.get("missionZoneType") || "",
    vehicleVolume: searchParams.get("vehicleVolume") || "",
    typeMission: searchParams.get("typeMission") || "",
  }

  const [filters, setFilters] = useState(currentFilters)

  const activeFiltersCount = Object.values(currentFilters).filter(Boolean).length

  const applyFilters = () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    router.push(`/jobs?${params.toString()}`)
    setOpen(false)
  }

  const clearFilters = () => {
    setFilters({
      secteur: "",
      missionZoneType: "",
      vehicleVolume: "",
      typeMission: "",
    })
    setSearchTerm("")
    router.push("/jobs")
    setOpen(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchTerm) {
      params.set("secteur", searchTerm)
    } else {
      params.delete("secteur")
    }
    router.push(`/jobs?${params.toString()}`)
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par secteur (ex: Paris 11e)..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </form>

      {/* Filter button with sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filtres
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filtrer les missions</SheetTitle>
          </SheetHeader>

          <div className="py-6 space-y-6">
            {/* Zone type */}
            <div>
              <label className="text-sm font-medium mb-3 block">Type de zone</label>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={!filters.missionZoneType ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setFilters({ ...filters, missionZoneType: "" })}
                >
                  Tous
                </Badge>
                {Object.entries(zoneTypeLabels).map(([key, label]) => (
                  <Badge
                    key={key}
                    variant={filters.missionZoneType === key ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setFilters({ ...filters, missionZoneType: key })}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Volume */}
            <div>
              <label className="text-sm font-medium mb-3 block">Volume véhicule</label>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={!filters.vehicleVolume ? "secondary" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setFilters({ ...filters, vehicleVolume: "" })}
                >
                  Tous
                </Badge>
                {Object.entries(volumeLabels).map(([key, label]) => (
                  <Badge
                    key={key}
                    variant={filters.vehicleVolume === key ? "secondary" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setFilters({ ...filters, vehicleVolume: key })}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Mission type */}
            <div>
              <label className="text-sm font-medium mb-3 block">Type de mission</label>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={!filters.typeMission ? "secondary" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setFilters({ ...filters, typeMission: "" })}
                >
                  Tous
                </Badge>
                {Object.entries(missionTypeLabels).map(([key, label]) => (
                  <Badge
                    key={key}
                    variant={filters.typeMission === key ? "secondary" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setFilters({ ...filters, typeMission: key })}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter className="flex gap-2">
            <Button variant="outline" onClick={clearFilters} className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Effacer
            </Button>
            <Button onClick={applyFilters} className="flex-1">
              Appliquer
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
