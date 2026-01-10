"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle } from "lucide-react"
import { MissionFeedbackModal, type MissionFeedback } from "@/components/mission-feedback-modal"

export default function MissionFeedbackPage() {
  const router = useRouter()
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Dans une vraie app, ces données viendraient de l'API
  const mockData = {
    jobId: "job-123",
    jobTitle: "Tournée express Paris 11e, 12e, 20e",
    driverId: "driver-456",
    driverName: "Marc Dupont",
    driverAvatar: null,
    completedAt: new Date().toISOString(),
  }

  const handleFeedbackSubmit = async (feedback: MissionFeedback) => {
    // Simulation d'envoi API
    console.log("Feedback submitted:", {
      jobId: mockData.jobId,
      driverId: mockData.driverId,
      ...feedback,
    })

    // Simuler un délai réseau
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="container mx-auto py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-green-200 bg-green-50/50">
            <CardContent className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Merci pour votre avis !</h2>
              <p className="text-muted-foreground mb-8">
                Votre évaluation aide les autres entreprises à choisir les meilleurs chauffeurs et contribue à
                améliorer la qualité du service.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => router.push("/dashboard")} size="lg">
                  Retour au tableau de bord
                </Button>
                <Button onClick={() => router.push("/jobs")} variant="outline" size="lg">
                  Voir les missions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" className="mb-4 gap-2" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold mb-2">Évaluer la mission</h1>
          <p className="text-muted-foreground">Mission terminée avec succès</p>
        </div>

        {/* Mission & Driver Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Informations de la mission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Mission</p>
                <p className="font-medium">{mockData.jobTitle}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Chauffeur</p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                      {mockData.driverName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{mockData.driverName}</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      Mission terminée
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Terminée le</p>
                <p className="font-medium">
                  {new Date(mockData.completedAt).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Form */}
        <MissionFeedbackModal
          jobId={mockData.jobId}
          driverId={mockData.driverId}
          driverName={mockData.driverName}
          onSubmit={handleFeedbackSubmit}
        />
      </div>
    </div>
  )
}
