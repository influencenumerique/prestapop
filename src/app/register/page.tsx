"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, Building } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const typeParam = searchParams.get("type") // "driver" or "company"

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedType, setSelectedType] = useState<"driver" | "company" | null>(
    typeParam as "driver" | "company" | null
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedType) {
      setError("Veuillez sélectionner un type de compte")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role: selectedType === "driver" ? "DRIVER" : "COMPANY",
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Une erreur est survenue")
      }

      // Sign in the user
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        throw new Error("Erreur lors de la connexion")
      }

      // Redirect to onboarding
      if (selectedType === "driver") {
        router.push("/onboarding/driver")
      } else {
        router.push("/onboarding/company")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Créer un compte</CardTitle>
          <CardDescription>
            Rejoignez PrestaPop en tant qu&apos;entreprise ou chauffeur-livreur
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Account Type Selection */}
          {!selectedType && (
            <div className="space-y-4 mb-6">
              <p className="text-sm font-medium text-center">Choisissez votre profil</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedType("driver")}
                  className="flex flex-col items-center gap-3 p-6 border-2 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Truck className="h-8 w-8 text-primary" />
                  <div className="text-center">
                    <p className="font-semibold">Chauffeur</p>
                    <p className="text-xs text-muted-foreground">Livreur indépendant</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedType("company")}
                  className="flex flex-col items-center gap-3 p-6 border-2 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Building className="h-8 w-8 text-primary" />
                  <div className="text-center">
                    <p className="font-semibold">Entreprise</p>
                    <p className="text-xs text-muted-foreground">Donneur d&apos;ordre</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Registration Form */}
          {selectedType && (
            <>
              <div className="mb-4 p-3 bg-primary/10 rounded-md flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedType === "driver" ? (
                    <>
                      <Truck className="h-4 w-4" />
                      <span className="text-sm font-medium">Inscription Chauffeur</span>
                    </>
                  ) : (
                    <>
                      <Building className="h-4 w-4" />
                      <span className="text-sm font-medium">Inscription Entreprise</span>
                    </>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedType(null)}
                  className="text-xs"
                >
                  Changer
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {selectedType === "driver" ? "Nom complet" : "Nom du responsable"}
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={selectedType === "driver" ? "Jean Dupont" : "Marie Martin"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 8 caractères
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Création..." : "Continuer vers les conditions légales"}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continuer avec Google
              </Button>
            </>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
