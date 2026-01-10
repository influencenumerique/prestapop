import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { Providers } from "@/components/providers"
import { CookieConsent } from "@/components/cookie-consent"
import { Footer } from "@/components/footer"
import { Chatbot } from "@/components/chatbot"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PrestaPop - Plateforme de Transport Urbain B2B",
  description: "Connectez votre entreprise avec des chauffeurs-livreurs indépendants qualifiés pour vos missions de livraison urbaine",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <CookieConsent />
          <Chatbot />
        </Providers>
      </body>
    </html>
  )
}
