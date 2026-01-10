/**
 * API Authentication and Authorization Helpers
 *
 * Ce module fournit des fonctions utilitaires pour vérifier l'authentification
 * et les autorisations basées sur les rôles dans les routes API.
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import type { Session } from "next-auth"

export type Role = "COMPANY" | "DRIVER" | "ADMIN"

/**
 * Type pour les données utilisateur enrichies avec le rôle et les profils
 */
export interface AuthenticatedUser {
  id: string
  email: string | null
  name: string | null
  role: Role
  company?: {
    id: string
    companyName: string
    siret: string | null
    userId: string
    phone: string | null
    address: string | null
    city: string | null
    description: string | null
    logo: string | null
    isVerified: boolean
    createdAt: Date
    updatedAt: Date
  } | null
  driverProfile?: {
    id: string
    userId: string
    phone: string | null
    bio: string | null
    city: string | null
    vehicleTypes: string[]
    licenseNumber: string | null
    insuranceNumber: string | null
    stripeAccountId: string | null
    isVerified: boolean
    isAvailable: boolean
    rating: number
    totalDeliveries: number
    totalReviews: number
    createdAt: Date
    updatedAt: Date
  } | null
}

/**
 * Réponses d'erreur standardisées
 */
export const AuthErrors = {
  UNAUTHORIZED: NextResponse.json(
    { error: "Non authentifié. Veuillez vous connecter." },
    { status: 401 }
  ),
  FORBIDDEN: NextResponse.json(
    { error: "Accès refusé. Vous n'avez pas les autorisations nécessaires." },
    { status: 403 }
  ),
  FORBIDDEN_COMPANY_ONLY: NextResponse.json(
    { error: "Accès réservé aux entreprises (Role.COMPANY)." },
    { status: 403 }
  ),
  FORBIDDEN_DRIVER_ONLY: NextResponse.json(
    { error: "Accès réservé aux chauffeurs (Role.DRIVER)." },
    { status: 403 }
  ),
  USER_NOT_FOUND: NextResponse.json(
    { error: "Utilisateur non trouvé." },
    { status: 404 }
  ),
}

/**
 * Récupère la session et vérifie l'authentification
 * Retourne null si non authentifié
 */
export async function getAuthSession(): Promise<Session | null> {
  return await auth()
}

/**
 * Récupère l'utilisateur complet avec son rôle et ses profils
 * Lance une erreur si non trouvé
 */
export async function getAuthenticatedUser(
  session: Session
): Promise<AuthenticatedUser> {
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      company: true,
      driverProfile: true,
    },
  })

  if (!user) {
    throw new Error("USER_NOT_FOUND")
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    company: user.company,
    driverProfile: user.driverProfile,
  }
}

/**
 * Vérifie si l'utilisateur a le rôle requis
 */
export function hasRole(user: AuthenticatedUser, role: Role): boolean {
  return user.role === role
}

/**
 * Vérifie si l'utilisateur a l'un des rôles requis
 */
export function hasAnyRole(user: AuthenticatedUser, roles: Role[]): boolean {
  return roles.includes(user.role)
}

/**
 * Middleware d'authentification complet
 * Retourne l'utilisateur authentifié ou une réponse d'erreur
 */
export async function requireAuth(): Promise<
  { user: AuthenticatedUser } | { error: NextResponse }
> {
  const session = await getAuthSession()

  if (!session?.user) {
    return { error: AuthErrors.UNAUTHORIZED }
  }

  try {
    const user = await getAuthenticatedUser(session)
    return { user }
  } catch (_error) {
    return { error: AuthErrors.USER_NOT_FOUND }
  }
}

/**
 * Middleware d'authentification avec vérification de rôle
 * Retourne l'utilisateur authentifié ou une réponse d'erreur
 */
export async function requireRole(
  role: Role
): Promise<{ user: AuthenticatedUser } | { error: NextResponse }> {
  const authResult = await requireAuth()

  if ("error" in authResult) {
    return authResult
  }

  const { user } = authResult

  if (!hasRole(user, role)) {
    const errorResponse =
      role === "COMPANY"
        ? AuthErrors.FORBIDDEN_COMPANY_ONLY
        : role === "DRIVER"
        ? AuthErrors.FORBIDDEN_DRIVER_ONLY
        : AuthErrors.FORBIDDEN

    return { error: errorResponse }
  }

  return { user }
}

/**
 * Middleware d'authentification avec vérification de plusieurs rôles
 * Retourne l'utilisateur authentifié ou une réponse d'erreur
 */
export async function requireAnyRole(
  roles: Role[]
): Promise<{ user: AuthenticatedUser } | { error: NextResponse }> {
  const authResult = await requireAuth()

  if ("error" in authResult) {
    return authResult
  }

  const { user } = authResult

  if (!hasAnyRole(user, roles)) {
    return { error: AuthErrors.FORBIDDEN }
  }

  return { user }
}

/**
 * Vérifie si l'utilisateur est propriétaire d'une entreprise spécifique
 */
export function isCompanyOwner(
  user: AuthenticatedUser,
  companyId: string
): boolean {
  return user.role === "COMPANY" && user.company?.id === companyId
}

/**
 * Vérifie si l'utilisateur est un chauffeur spécifique
 */
export function isDriver(user: AuthenticatedUser, driverId: string): boolean {
  return user.role === "DRIVER" && user.driverProfile?.id === driverId
}
