"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

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
  const [acceptPayment, setAcceptPayment] = useState(false)
  const [acceptVehicle, setAcceptVehicle] = useState(false)

  const allCheckboxesChecked = acceptCGU && acceptCommission && acceptPayment && acceptVehicle

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!allCheckboxesChecked) {
      setError("Veuillez accepter toutes les conditions pour continuer.")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Create driver profile
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
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Inscription Chauffeur-Livreur</CardTitle>
          <CardDescription>
            Complétez votre profil pour commencer à accepter des missions de livraison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Informations de base</h3>

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
                  <Input
                    id="region"
                    type="text"
                    placeholder="Île-de-France"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    required
                  />
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
                    <Link href="/cgu" target="_blank" className="text-primary hover:underline">
                      Conditions Générales d&apos;Utilisation
                    </Link>{" "}
                    et la politique no-show (sanctions progressives en cas d&apos;absence non justifiée)
                  </Label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="commission"
                    checked={acceptCommission}
                    onCheckedChange={(checked) => setAcceptCommission(checked as boolean)}
                  />
                  <Label htmlFor="commission" className="text-sm font-normal leading-relaxed cursor-pointer">
                    J&apos;accepte la commission PrestaPop de <strong>15%</strong> sur chaque mission effectuée
                  </Label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="payment"
                    checked={acceptPayment}
                    onCheckedChange={(checked) => setAcceptPayment(checked as boolean)}
                  />
                  <Label htmlFor="payment" className="text-sm font-normal leading-relaxed cursor-pointer">
                    Je comprends que le paiement s&apos;effectue après validation de l&apos;entreprise ou auto-validation automatique après 48h
                  </Label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="vehicle"
                    checked={acceptVehicle}
                    onCheckedChange={(checked) => setAcceptVehicle(checked as boolean)}
                  />
                  <Label htmlFor="vehicle" className="text-sm font-normal leading-relaxed cursor-pointer">
                    Je dispose d&apos;un véhicule personnel en bon état et des <strong>assurances obligatoires</strong> pour effectuer des livraisons commerciales
                  </Label>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!allCheckboxesChecked || loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Création du profil..." : "Accéder au tableau de bord"}
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
