import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // Redirect logged-in COMPANY or DRIVER users from home to dashboard
  if (isLoggedIn && nextUrl.pathname === '/') {
    const userRole = req.auth?.user?.role

    if (userRole === 'COMPANY' || userRole === 'DRIVER') {
      return NextResponse.redirect(new URL('/dashboard', nextUrl.origin))
    }
  }

  // Allow request to proceed
  return NextResponse.next()
})

// Protect routes with matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled by API auth)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icon.png, apple-icon.png (icons)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|.*\\..*$).*)',
  ],
}
