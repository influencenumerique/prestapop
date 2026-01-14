"use client"

import Link from "next/link"
import Image from "next/image"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Search, User, LogOut, PlusCircle, Sparkles } from "lucide-react"

export function Navbar() {
  const { data: session } = useSession()
  const isCompany = session?.user?.role === "COMPANY"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full max-w-[1800px] mx-auto px-4 md:px-6 lg:px-8 flex h-20 lg:h-24 items-center justify-between">
        {/* Logo + Navigation */}
        <div className="flex items-center gap-4 lg:gap-8">
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/images/logo-light.png"
              alt="PrestaPop"
              width={400}
              height={110}
              className="h-14 md:h-16 lg:h-20 w-auto"
              priority
            />
          </Link>
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            {isCompany ? (
              <>
                <Link href="/jobs" className="text-sm lg:text-base font-medium hover:text-primary flex items-center gap-1 whitespace-nowrap">
                  <Search className="h-4 w-4" />
                  Trouver un chauffeur
                </Link>
                <Link href="/dashboard/create-job">
                  <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90 whitespace-nowrap">
                    <PlusCircle className="h-4 w-4" />
                    Publier mission
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/jobs?urgent=true" className="animate-urgent-pulse">
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm lg:text-base font-bold px-3 py-1.5 rounded-full shadow-lg shadow-red-500/30 hover:scale-105 transition-transform whitespace-nowrap">
                    <span>🚨</span>
                    URGENT
                  </span>
                </Link>
              </>
            )}
            <Link href="/pricing" className="text-sm lg:text-base font-medium hover:text-primary flex items-center gap-1 whitespace-nowrap">
              <Sparkles className="h-4 w-4" />
              Tarifs
            </Link>
          </nav>
        </div>

        {/* Search + Auth buttons */}
        <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
          {/* Barre de recherche - responsive */}
          <div className="hidden lg:flex relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Rechercher une mission..."
              className="h-10 w-[200px] xl:w-[300px] 2xl:w-[400px] rounded-md border bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          {session?.user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2 text-sm lg:text-base">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{session.user.name || "Dashboard"}</span>
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-sm lg:text-base"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-sm lg:text-base px-3 lg:px-4">
                  Connexion
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="text-sm lg:text-base px-3 lg:px-6">
                  S&apos;inscrire
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
