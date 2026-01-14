import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/api-auth"
import { createCustomerPortalSession } from "@/lib/stripe"

/**
 * POST /api/subscriptions/portal
 * Crée une session du portail client Stripe
 */
export async function POST() {
  try {
    const authResult = await requireAuth()
    if ("error" in authResult) return authResult.error

    const { user } = authResult

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: "Aucun compte de facturation associé" },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const returnUrl = `${baseUrl}/dashboard`

    const portalSession = await createCustomerPortalSession(
      user.stripeCustomerId,
      returnUrl
    )

    return NextResponse.json({
      portalUrl: portalSession.url,
    })
  } catch (error) {
    console.error("Error creating portal session:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'accès au portail de facturation" },
      { status: 500 }
    )
  }
}
