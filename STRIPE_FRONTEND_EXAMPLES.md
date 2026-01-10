# Exemples d'Utilisation Frontend - Stripe

Ce document fournit des exemples de code pour intégrer les paiements Stripe côté frontend.

## Installation

```bash
npm install @stripe/stripe-js
```

## Configuration

```typescript
// lib/stripe-client.ts
import { loadStripe } from '@stripe/stripe-js'

export const getStripePromise = () => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
}
```

---

## Exemple 1 : Paiement via Checkout Session

### Composant React

```typescript
// components/PaymentCheckout.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface PaymentCheckoutProps {
  bookingId: string
}

export function PaymentCheckout({ bookingId }: PaymentCheckoutProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handlePayment = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du paiement')
      }

      // Redirection vers Stripe Checkout
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded">
          {error}
        </div>
      )}

      <Button
        onClick={handlePayment}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Redirection vers le paiement...' : 'Payer maintenant'}
      </Button>
    </div>
  )
}
```

### Page de Succès

```typescript
// app/dashboard/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const payment = searchParams.get('payment')
  const bookingId = searchParams.get('bookingId')
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (payment === 'success' && bookingId) {
      setShowSuccess(true)
      // Optionnel : Recharger les données de la mission
      refreshBooking(bookingId)
    }
  }, [payment, bookingId])

  if (showSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Paiement réussi !</h2>
        <p>Votre paiement a été confirmé. Le chauffeur recevra les fonds sous peu.</p>
      </div>
    )
  }

  return <div>{/* Reste du dashboard */}</div>
}
```

---

## Exemple 2 : Paiement via PaymentIntent + Stripe Elements

### Composant React avec Stripe Elements

```typescript
// components/PaymentForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormProps {
  bookingId: string
  amount: number // en centimes
}

function CheckoutForm({ bookingId }: { bookingId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?payment=success&bookingId=${bookingId}`,
        },
      })

      if (submitError) {
        setError(submitError.message || 'Une erreur est survenue')
      } else {
        setSuccess(true)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 text-green-800 p-4 rounded">
        Paiement confirmé !
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Traitement...' : 'Payer'}
      </button>
    </form>
  )
}

export function PaymentForm({ bookingId, amount }: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Créer le PaymentIntent
    fetch('/api/stripe/payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
        } else {
          setError(data.error || 'Erreur lors de la création du paiement')
        }
      })
      .catch((err) => setError(err.message))
  }, [bookingId])

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded">
        {error}
      </div>
    )
  }

  if (!clientSecret) {
    return <div>Chargement...</div>
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm bookingId={bookingId} />
    </Elements>
  )
}
```

### Utilisation dans une Page

```typescript
// app/bookings/[id]/payment/page.tsx
import { PaymentForm } from '@/components/PaymentForm'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PaymentPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()

  if (!session?.user) {
    return <div>Non autorisé</div>
  }

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      job: {
        include: { company: true },
      },
      driver: { include: { user: true } },
    },
  })

  if (!booking) {
    notFound()
  }

  // Vérifier que l'utilisateur est bien la company
  if (booking.job.company.userId !== session.user.id) {
    return <div>Non autorisé</div>
  }

  return (
    <div className="container max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Paiement de la mission</h1>

      <div className="bg-gray-50 p-4 rounded mb-6">
        <h2 className="font-semibold">{booking.job.title}</h2>
        <p className="text-sm text-gray-600">
          Chauffeur : {booking.driver.user.name}
        </p>
        <p className="text-lg font-bold mt-2">
          Montant : {(booking.agreedPrice / 100).toFixed(2)} €
        </p>
      </div>

      <PaymentForm
        bookingId={booking.id}
        amount={booking.agreedPrice}
      />
    </div>
  )
}
```

---

## Exemple 3 : Vérification du Statut de Paiement

### Hook personnalisé

```typescript
// hooks/usePaymentStatus.ts
import { useEffect, useState } from 'react'

interface PaymentStatus {
  status: string
  amount?: number
  paidAt?: Date
}

export function usePaymentStatus(bookingId: string) {
  const [status, setStatus] = useState<PaymentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(
          `/api/stripe/payment-intent?bookingId=${bookingId}`
        )
        const data = await response.json()

        if (response.ok) {
          setStatus(data)
        } else {
          setError(data.error)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [bookingId])

  return { status, loading, error }
}
```

### Composant d'affichage du statut

```typescript
// components/PaymentStatus.tsx
'use client'

import { usePaymentStatus } from '@/hooks/usePaymentStatus'

interface PaymentStatusProps {
  bookingId: string
}

export function PaymentStatus({ bookingId }: PaymentStatusProps) {
  const { status, loading, error } = usePaymentStatus(bookingId)

  if (loading) {
    return <div>Chargement du statut...</div>
  }

  if (error) {
    return <div className="text-red-600">{error}</div>
  }

  if (!status || status.status === 'no_payment') {
    return (
      <div className="bg-gray-100 p-4 rounded">
        <p className="text-gray-600">Aucun paiement initié</p>
      </div>
    )
  }

  const statusLabels: Record<string, { text: string; color: string }> = {
    succeeded: { text: 'Payé', color: 'green' },
    pending: { text: 'En attente', color: 'yellow' },
    failed: { text: 'Échoué', color: 'red' },
    refunded: { text: 'Remboursé', color: 'gray' },
  }

  const statusInfo = statusLabels[status.status] || {
    text: status.status,
    color: 'gray',
  }

  return (
    <div className={`bg-${statusInfo.color}-50 border border-${statusInfo.color}-200 p-4 rounded`}>
      <div className="flex items-center justify-between">
        <span className={`text-${statusInfo.color}-800 font-semibold`}>
          Statut : {statusInfo.text}
        </span>
        {status.amount && (
          <span className="text-gray-700">
            {(status.amount / 100).toFixed(2)} €
          </span>
        )}
      </div>
      {status.paidAt && (
        <p className="text-sm text-gray-600 mt-2">
          Payé le {new Date(status.paidAt).toLocaleDateString('fr-FR')}
        </p>
      )}
    </div>
  )
}
```

---

## Exemple 4 : Remboursement d'une Mission

### Composant de remboursement

```typescript
// components/RefundButton.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface RefundButtonProps {
  bookingId: string
  onRefunded?: () => void
}

export function RefundButton({ bookingId, onRefunded }: RefundButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleRefund = async () => {
    if (!confirm('Êtes-vous sûr de vouloir rembourser cette mission ?')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          reason: 'requested_by_customer',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du remboursement')
      }

      setSuccess(true)
      onRefunded?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 text-green-800 p-4 rounded">
        Remboursement effectué avec succès
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded">
          {error}
        </div>
      )}

      <Button
        onClick={handleRefund}
        disabled={loading}
        variant="destructive"
      >
        {loading ? 'Traitement...' : 'Rembourser'}
      </Button>
    </div>
  )
}
```

---

## Exemple 5 : Dashboard avec Liste de Missions Payables

### Composant de liste

```typescript
// components/PayableMissions.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/types/stripe'

interface Booking {
  id: string
  status: string
  agreedPrice: number
  stripePaymentStatus?: string
  job: {
    title: string
    typeMission: string
  }
  driver: {
    user: {
      name: string
    }
  }
}

export function PayableMissions() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/bookings?status=DELIVERED')
      .then((res) => res.json())
      .then((data) => {
        setBookings(data.filter((b: Booking) => !b.stripePaymentStatus))
        setLoading(false)
      })
  }, [])

  const handlePay = async (bookingId: string) => {
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    })

    const data = await response.json()
    if (data.url) {
      window.location.href = data.url
    }
  }

  if (loading) {
    return <div>Chargement...</div>
  }

  if (bookings.length === 0) {
    return (
      <div className="text-gray-600">
        Aucune mission à payer
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Missions à payer</h2>

      {bookings.map((booking) => (
        <div
          key={booking.id}
          className="border rounded-lg p-4 flex items-center justify-between"
        >
          <div>
            <h3 className="font-semibold">{booking.job.title}</h3>
            <p className="text-sm text-gray-600">
              Chauffeur : {booking.driver.user.name}
            </p>
            <p className="text-sm text-gray-600">
              Type : {booking.job.typeMission}
            </p>
          </div>

          <div className="text-right">
            <p className="text-lg font-bold mb-2">
              {formatPrice(booking.agreedPrice)}
            </p>
            <Button onClick={() => handlePay(booking.id)}>
              Payer
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## Exemple 6 : Gestion d'Erreurs Stripe

### Composant de gestion d'erreurs

```typescript
// components/StripeErrorDisplay.tsx
interface StripeErrorDisplayProps {
  error: any
}

export function StripeErrorDisplay({ error }: StripeErrorDisplayProps) {
  const getErrorMessage = (err: any): string => {
    // Erreurs Stripe spécifiques
    if (err.type === 'card_error') {
      switch (err.code) {
        case 'card_declined':
          return 'Votre carte a été refusée. Veuillez utiliser une autre carte.'
        case 'insufficient_funds':
          return 'Fonds insuffisants sur cette carte.'
        case 'expired_card':
          return 'Cette carte a expiré. Veuillez mettre à jour vos informations.'
        case 'incorrect_cvc':
          return 'Le code de sécurité (CVC) est incorrect.'
        case 'processing_error':
          return 'Une erreur est survenue lors du traitement. Veuillez réessayer.'
        default:
          return err.message || 'Erreur de carte bancaire'
      }
    }

    // Erreur générique
    return err.message || 'Une erreur est survenue'
  }

  return (
    <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
      <div className="flex items-start">
        <svg
          className="w-5 h-5 mr-2 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <p className="font-semibold">Erreur de paiement</p>
          <p className="text-sm mt-1">{getErrorMessage(error)}</p>
        </div>
      </div>
    </div>
  )
}
```

---

## Variables d'Environnement Frontend

```env
# .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Notes Importantes

1. **Sécurité** : Ne jamais exposer `STRIPE_SECRET_KEY` côté frontend
2. **Webhooks** : Les webhooks gèrent la confirmation finale du paiement
3. **Redirection** : Toujours prévoir une page de retour après paiement
4. **Erreurs** : Gérer tous les cas d'erreur possibles
5. **Loading states** : Afficher des états de chargement pour améliorer l'UX
6. **Mobile** : Stripe Elements est responsive par défaut

---

## Ressources

- [Stripe.js Reference](https://stripe.com/docs/js)
- [Stripe Elements](https://stripe.com/docs/stripe-js/react)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Payment Intents](https://stripe.com/docs/payments/payment-intents)
