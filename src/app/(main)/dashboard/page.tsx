import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Truck } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { driverProfile: true, company: true },
  })

  if (!user) {
    redirect("/login")
  }

  // Redirect ADMIN users to admin dashboard
  if (user.role === "ADMIN") {
    redirect("/admin/dashboard")
  }

  // Redirect to specific dashboard based on role
  if (user.driverProfile) {
    redirect("/dashboard/driver")
  }

  if (user.company) {
    redirect("/dashboard/company")
  }

  // No profile yet - show choice page
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">
          Bienvenue sur PrestaPop, {user.name || "utilisateur"}
        </h1>
        <p className="text-muted-foreground mt-2">
          Choisissez votre profil pour commencer
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Company Card */}
        <Link href="/register?type=company">
          <Card className="cursor-pointer hover:shadow-xl transition-all hover:scale-105 border-2 hover:border-blue-500">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Je suis une entreprise</h2>
              <p className="text-muted-foreground mb-6">
                Publiez vos missions de livraison et trouvez des chauffeurs qualifiés
              </p>
              <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                Créer mon compte entreprise
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* Driver Card */}
        <Link href="/register?type=driver">
          <Card className="cursor-pointer hover:shadow-xl transition-all hover:scale-105 border-2 hover:border-emerald-500">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Truck className="h-10 w-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Je suis chauffeur-livreur</h2>
              <p className="text-muted-foreground mb-6">
                Trouvez des missions de livraison et développez votre activité
              </p>
              <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700">
                Créer mon compte chauffeur
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
