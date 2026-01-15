"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

const REGIONS = [
  "Île-de-France",
  "Auvergne-Rhône-Alpes",
  "Hauts-de-France",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Grand Est",
  "Provence-Alpes-Côte d'Azur",
  "Pays de la Loire",
  "Normandie",
  "Bretagne",
  "Bourgogne-Franche-Comté",
  "Centre-Val de Loire",
  "Corse",
]

export default function DriverOnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Form fields
  const [phone, setPhone] = useState("")
  const [city, setCity] = useState("")
  const [region, setRegion] = useState("")

  // Legal checkboxes
  const [acceptCGU, setAcceptCGU] = useState(false)
  const [acceptCommission, setAcceptCommission] = useState(false)
  const [acceptPaymentTerms, setAcceptPaymentTerms] = useState(false)

  const allCheckboxesChecked = acceptCGU && acceptCommission && acceptPaymentTerms

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!allCheckboxesChecked) {
      setError("Veuillez accepter toutes les conditions pour continuer.")
      return
    }

    if (!region) {
      setError("Veuillez sélectionner une région.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/driver/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          city,
          region,
          acceptedTerms: true,
          acceptedCommission: true,
          acceptedPaymentTerms: true,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Une erreur est survenue")
      }

      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl border-emerald-200">
        <CardHeader>
          <CardTitle className="text-2xl text-emerald-700">Inscription Chauffeur-Livreur</CardTitle>
          <CardDescription>
            Complétez votre profil chauffeur pour accéder aux missions de livraison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            {/* Driver Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Informations personnelles</h3>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="06 12 34 56 78"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="Paris"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Région</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger id="region">
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Legal Conditions */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg">Conditions légales</h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="cgu"
                    checked={acceptCGU}
                    onCheckedChange={(checked) => setAcceptCGU(checked as boolean)}
                  />
                  <Label htmlFor="cgu" className="text-sm font-normal leading-relaxed cursor-pointer">
                    J&apos;accepte les{" "}
                    <Link href="/cgu" target="_blank" className="text-emerald-600 hover:underline">
                      Conditions Générales d&apos;Utilisation
                    </Link>
                    {" "}et la{" "}
                    <Link href="/cgv" target="_blank" className="text-emerald-600 hover:underline">
                      politique litiges
                    </Link>{" "}
                    de PrestaPop
                  </Label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="commission"
                    checked={acceptCommission}
                    onCheckedChange={(checked) => setAcceptCommission(checked as boolean)}
                  />
                  <Label htmlFor="commission" className="text-sm font-normal leading-relaxed cursor-pointer">
                    J&apos;accepte la commission de <strong>15%</strong> prélevée par PrestaPop sur chaque mission réalisée
                  </Label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="payment"
                    checked={acceptPaymentTerms}
                    onCheckedChange={(checked) => setAcceptPaymentTerms(checked as boolean)}
                  />
                  <Label htmlFor="payment" className="text-sm font-normal leading-relaxed cursor-pointer">
                    J&apos;accepte les délais de paiement : le paiement sera déclenché <strong>48h après validation</strong> de la livraison par l&apos;entreprise
                  </Label>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={!allCheckboxesChecked || loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Création du profil..." : "Accéder aux missions"}
            </Button>

            {!allCheckboxesChecked && (
              <p className="text-xs text-center text-muted-foreground">
                Cochez toutes les cases pour activer le bouton
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
