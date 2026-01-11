"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Briefcase,
  AlertTriangle,
  LogOut,
  Menu,
  BarChart3,
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useState } from "react"

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
  { href: "/admin/jobs", label: "Missions", icon: Briefcase },
  { href: "/admin/litiges", label: "Litiges", icon: AlertTriangle },
]

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { data: session } = useSession()

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 p-6 border-b border-emerald-800/30">
        <Shield className="h-8 w-8 text-emerald-400" />
        <div>
          <span className="font-bold text-xl text-white">PrestaPop</span>
          <span className="ml-2 text-xs bg-emerald-500 text-white px-2 py-0.5 rounded">Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${isActive
                  ? 'bg-emerald-500/20 text-emerald-400 font-medium border-l-4 border-emerald-400'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User info & logout */}
      <div className="p-4 border-t border-emerald-800/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <span className="text-emerald-400 font-medium">
              {session?.user?.name?.[0] || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {session?.user?.name || 'Admin'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {session?.user?.email}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 bg-transparent border-gray-600 text-gray-300 hover:bg-white/5 hover:text-white"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user?.role !== "ADMIN") {
    redirect("/login?error=unauthorized")
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Mobile header */}
      <div className="lg:hidden bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-emerald-400" />
          <span className="font-bold text-lg text-white">PrestaPop</span>
          <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded">Admin</span>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-white/10">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-slate-800 border-slate-700">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu Admin</SheetTitle>
            </SheetHeader>
            <SidebarContent pathname={pathname} onNavigate={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 bg-slate-800 border-r border-slate-700 fixed inset-y-0 left-0 flex-col">
          <SidebarContent pathname={pathname} />
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-64 min-h-screen">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
