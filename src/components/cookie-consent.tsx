"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Cookie, X } from "lucide-react"

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const acceptAll = () => {
    localStorage.setItem("cookie-consent", JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: true,
      date: new Date().toISOString(),
    }))
    setShowBanner(false)
  }

  const acceptNecessary = () => {
    localStorage.setItem("cookie-consent", JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      date: new Date().toISOString(),
    }))
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t shadow-lg">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Nous utilisons des cookies</p>
              <p className="text-sm text-muted-foreground">
                PrestaPop utilise des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu.
                En continuant, vous acceptez notre{" "}
                <Link href="/confidentialite" className="text-primary hover:underline">
                  politique de confidentialité
                </Link>
                .
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={acceptNecessary}>
              Cookies essentiels
            </Button>
            <Button size="sm" onClick={acceptAll}>
              Tout accepter
            </Button>
          </div>
          <button
            onClick={acceptNecessary}
            className="absolute top-2 right-2 md:relative md:top-auto md:right-auto text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
