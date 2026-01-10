"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function CompanyOnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Form fields
  const [companyName, setCompanyName] = useState("")
  const [siret, setSiret] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [description, setDescription] = useState("")

  // Legal checkboxes
  const [acceptCGU, setAcceptCGU] = useState(false)
  const [acceptValidation, setAcceptValidation] = useState(false)

  const allCheckboxesChecked = acceptCGU && acceptValidation

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!allCheckboxesChecked) {
      setError("Veuillez accepter toutes les conditions pour continuer.")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Create company profile
      const res = await fetch("/api/company/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          siret,
          phone,
          address,
          city,
          description,
          acceptedTerms: true,
          acceptedValidationDelay: true,
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
          <CardTitle className="text-2xl">Inscription Entreprise</CardTitle>
          <CardDescription>
            Complétez votre profil entreprise pour publier vos premières missions de livraison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            {/* Company Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Informations entreprise</h3>

              <div className="space-y-2">
                <Label htmlFor="companyName">Nom de l&apos;entreprise</Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Transport Express SARL"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siret">SIRET</Label>
                <Input
                  id="siret"
                  type="text"
                  placeholder="123 456 789 00010"
                  value={siret}
                  onChange={(e) => setSiret(e.target.value)}
                  required
                  maxLength={14}
                />
                <p className="text-xs text-muted-foreground">
                  14 chiffres sans espaces
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="01 23 45 67 89"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="123 rue de la République"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre activité..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
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
                    </Link>
                    {" "}et la{" "}
                    <Link href="/cgv" target="_blank" className="text-primary hover:underline">
                      politique litiges
                    </Link>{" "}
                    de PrestaPop
                  </Label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="validation"
                    checked={acceptValidation}
                    onCheckedChange={(checked) => setAcceptValidation(checked as boolean)}
                  />
                  <Label htmlFor="validation" className="text-sm font-normal leading-relaxed cursor-pointer">
                    J&apos;accepte le délai de validation de <strong>48 heures</strong> après livraison. Passé ce délai, la mission sera automatiquement validée et le paiement déclenché
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
