"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Package, Truck, Clock, MapPin, Calendar } from "lucide-react"
import Link from "next/link"

const vehicleVolumeOptions = [
  { value: "CUBE_6M", label: "6m³", desc: "Petite camionnette", baseRate: 12000 },
  { value: "CUBE_9M", label: "9m³", desc: "Camionnette standard", baseRate: 12250 },
  { value: "CUBE_12M", label: "12m³", desc: "Fourgon moyen", baseRate: 12500 },
  { value: "CUBE_15M", label: "15m³", desc: "Grand fourgon", baseRate: 12750 },
  { value: "CUBE_20M", label: "20m³", desc: "Camion", baseRate: 13000 },
]

// Récupérer le tarif de base pour un volume donné
const getBaseRateForVolume = (volume: string) => {
  const option = vehicleVolumeOptions.find(v => v.value === volume)
  return option?.baseRate || 12000
}

const missionTypeOptions = [
  { value: "HALF_DAY", label: "Demi-journée", desc: "4h de livraison" },
  { value: "DAY", label: "Journée", desc: "8h de livraison" },
  { value: "WEEK", label: "Semaine", desc: "Mission récurrente" },
]

const zoneTypeOptions = [
  { value: "URBAN", label: "Urbain", desc: "Livraisons en ville" },
  { value: "CITY_TO_CITY", label: "Inter-urbain", desc: "Ville à ville" },
]

const packageSizeOptions = [
  { value: "SMALL", label: "Petits colis", desc: "< 5kg" },
  { value: "MEDIUM", label: "Moyens colis", desc: "5-20kg" },
  { value: "LARGE", label: "Gros colis", desc: "> 20kg" },
  { value: "MIXED", label: "Colis mixtes", desc: "Tailles variées" },
]

export default function CreateJobPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    typeMission: "DAY",
    missionZoneType: "URBAN",
    secteurLivraison: "",
    packageSize: "MIXED",
    nombreColis: 10,
    startTime: "",
    estimatedEndTime: "",
    vehicleVolume: "CUBE_12M",
    needsTailLift: false,
    dayRate: 12000, // 120€ par défaut
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          nombreColis: Number(formData.nombreColis),
          dayRate: Number(formData.dayRate),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erreur lors de la création")
      }

      const job = await response.json()
      router.push(`/jobs/${job.id}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }

      // Auto-ajuster le tarif quand le volume change
      if (field === "vehicleVolume") {
        newData.dayRate = getBaseRateForVolume(value)
      }

      return newData
    })
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Retour au dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Publier une nouvelle mission</h1>
        <p className="text-muted-foreground">
          Décrivez votre mission de livraison et trouvez le chauffeur idéal
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Informations générales
            </CardTitle>
            <CardDescription>Décrivez votre mission de livraison</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Titre de la mission</Label>
              <Input
                id="title"
                placeholder="Ex: Livraison colis e-commerce Paris 11e - Urgent"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                required
                minLength={5}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Un titre clair attire plus de candidats qualifiés
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description (optionnelle)</Label>
              <Textarea
                id="description"
                placeholder="Détails supplémentaires sur la mission, consignes particulières..."
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Zone et secteur */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Zone de livraison
            </CardTitle>
            <CardDescription>Où se déroule la mission ?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Type de zone</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {zoneTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateField("missionZoneType", option.value)}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      formData.missionZoneType === option.value
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "hover:border-primary/50"
                    }`}
                  >
                    <div className="font-semibold">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="secteurLivraison">Secteur de livraison</Label>
              <Input
                id="secteurLivraison"
                placeholder="Ex: Paris 11e, 12e, 20e ou Lyon centre"
                value={formData.secteurLivraison}
                onChange={(e) => updateField("secteurLivraison", e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Précisez les arrondissements, quartiers ou villes
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Détails colis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Détails des colis
            </CardTitle>
            <CardDescription>Informations sur les colis à livrer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nombreColis">Nombre de colis</Label>
              <Input
                id="nombreColis"
                type="number"
                min="1"
                value={formData.nombreColis}
                onChange={(e) => updateField("nombreColis", e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Taille des colis</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {packageSizeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateField("packageSize", option.value)}
                    className={`p-3 border rounded-lg text-left transition-all ${
                      formData.packageSize === option.value
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "hover:border-primary/50"
                    }`}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Véhicule requis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Véhicule requis
            </CardTitle>
            <CardDescription>Quel type de véhicule nécessaire ?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Volume du véhicule</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {vehicleVolumeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateField("vehicleVolume", option.value)}
                    className={`p-3 border rounded-lg text-center transition-all ${
                      formData.vehicleVolume === option.value
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "hover:border-primary/50"
                    }`}
                  >
                    <div className="font-bold text-lg">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.desc}</div>
                    <div className="text-xs text-primary font-medium mt-1">
                      Min. {(option.baseRate / 100).toFixed(0)}€
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Le tarif minimum est ajusté selon le volume du véhicule requis
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="needsTailLift"
                checked={formData.needsTailLift}
                onChange={(e) => updateField("needsTailLift", e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="needsTailLift" className="cursor-pointer">
                Hayon élévateur requis
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Horaires et durée */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horaires et durée
            </CardTitle>
            <CardDescription>Planification de la mission</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Type de mission</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {missionTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateField("typeMission", option.value)}
                    className={`p-3 border rounded-lg text-center transition-all ${
                      formData.typeMission === option.value
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "hover:border-primary/50"
                    }`}
                  >
                    <div className="font-semibold text-sm">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Date et heure de début</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => updateField("startTime", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="estimatedEndTime">Date et heure de fin estimée</Label>
                <Input
                  id="estimatedEndTime"
                  type="datetime-local"
                  value={formData.estimatedEndTime}
                  onChange={(e) => updateField("estimatedEndTime", e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rémunération */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Rémunération
            </CardTitle>
            <CardDescription>Tarif proposé pour la mission</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="dayRate">Tarif proposé (en €)</Label>
              <div className="flex items-center gap-3 mt-2">
                <Input
                  id="dayRate"
                  type="number"
                  min="10"
                  step="5"
                  value={(formData.dayRate / 100).toFixed(2)}
                  onChange={(e) => updateField("dayRate", Math.round(parseFloat(e.target.value) * 100))}
                  required
                  className="max-w-xs"
                />
                <Badge variant="outline" className="text-lg font-bold">
                  {(formData.dayRate / 100).toFixed(2)} €
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Un tarif compétitif attire plus de candidats qualifiés
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tarif mission</span>
                <span className="font-semibold">{(formData.dayRate / 100).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frais de service (10%)</span>
                <span className="font-semibold">{((formData.dayRate * 0.1) / 100).toFixed(2)} €</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between font-bold">
                <span>Total à payer</span>
                <span className="text-primary">{((formData.dayRate * 1.1) / 100).toFixed(2)} €</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Submit button */}
        <div className="flex gap-4">
          <Link href="/dashboard" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Annuler
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Création en cours..." : "Publier la mission"}
          </Button>
        </div>
      </form>
    </div>
  )
}
