import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CookieConsent } from "@/components/cookie-consent"
import { Chatbot } from "@/components/chatbot"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <CookieConsent />
      <Chatbot />
    </>
  )
}
