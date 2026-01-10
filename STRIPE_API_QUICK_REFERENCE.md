# Stripe API - Référence Rapide

## Routes de paiement disponibles

### 1. Initier un paiement (recommandé)
```bash
POST /api/bookings/[id]/initiate-payment
```
**Usage**: Créer un PaymentIntent pour une mission acceptée
**Auth**: Company propriétaire uniquement
**Retour**: `clientSecret`, `paymentIntentId`, `amount`, `missionType`

### 2. Créer un PaymentIntent
```bash
POST /api/stripe/payment-intent
Body: { "bookingId": "xxx" }
```
**Usage**: Alternative à initiate-payment
**Auth**: Company propriétaire uniquement
**Retour**: `clientSecret`, `paymentIntentId`, `amount`, `missionType`

### 3. Créer une Checkout Session
```bash
POST /api/stripe/checkout
Body: { "bookingId": "xxx" }
```
**Usage**: Redirection vers page Stripe hébergée
**Auth**: Company propriétaire uniquement
**Retour**: `url`, `sessionId`, `amount`, `missionType`

### 4. Statut du paiement
```bash
GET /api/stripe/payment-intent?bookingId=xxx
GET /api/bookings/[id]/initiate-payment
```
**Usage**: Vérifier l'état d'un paiement existant
**Auth**: Company ou Driver concerné

### 5. Remboursement
```bash
POST /api/stripe/refund
Body: { "bookingId": "xxx", "reason": "requested_by_customer" }
```
**Usage**: Rembourser une mission payée
**Auth**: Company propriétaire uniquement

---

## Calcul des montants

### Formules par type de mission
```typescript
// Journée complète
typeMission === "DAY" → agreedPrice = dayRate

// Demi-journée
typeMission === "HALF_DAY" → agreedPrice = dayRate / 2

// Semaine (5 jours)
typeMission === "WEEK" → agreedPrice = dayRate * 5
```

### Exemple concret
```typescript
dayRate = 15000 (150€)

DAY      → 15000 (150€)
HALF_DAY →  7500 (75€)
WEEK     → 75000 (750€)
```

---

## Commission plateforme

### Transfert au chauffeur
```typescript
// PaymentIntent: Commission 10%
driverAmount = agreedPrice * 0.90
platformFee = agreedPrice * 0.10

// Checkout Session: Commission 0% (actuellement)
driverAmount = agreedPrice
```

### Modifier la commission
Fichier: `/src/app/api/stripe/webhook/route.ts`
```typescript
const platformFeePercentage = 0.10 // Ligne 147
```

---

## Flux de paiement

### États de la mission
```
1. OPEN          → Mission publiée
2. ASSIGNED      → Chauffeur accepté → Paiement possible ✓
3. IN_PROGRESS   → Mission en cours  → Paiement possible ✓
4. DELIVERED     → Livraison faite   → Paiement possible ✓
5. COMPLETED     → Paiement confirmé
6. CANCELLED     → Annulé/Remboursé
```

### Workflow typique
```
1. POST /api/jobs/[id]/apply
   → Driver postule

2. Company accepte
   → Booking status: ASSIGNED

3. POST /api/bookings/[id]/initiate-payment
   → PaymentIntent créé

4. Frontend: Confirmer avec Stripe Elements
   → Paiement processé

5. Webhook: payment_intent.succeeded
   → Status: COMPLETED
   → Transfert au driver (90%)
   → Job terminé
```

---

## Stripe Connect (Chauffeurs)

### Créer un compte
```typescript
import { createConnectAccount, createAccountLink } from "@/lib/stripe"

const account = await createConnectAccount(email)
const link = await createAccountLink(account.id, refreshUrl, returnUrl)
// Rediriger vers link.url
```

### Vérifier le compte
Webhook `account.updated` met automatiquement `isVerified: true`

---

## Webhooks gérés

```
checkout.session.completed    → Paiement Checkout réussi
payment_intent.succeeded      → Paiement PaymentIntent réussi
payment_intent.payment_failed → Paiement échoué
charge.refunded               → Remboursement effectué
account.updated               → Compte Connect mis à jour
```

---

## Variables d'environnement

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Cartes de test Stripe

```
Succès:           4242 4242 4242 4242
Échec:            4000 0000 0000 0002
3D Secure:        4000 0025 0000 3155
Insuffisant:      4000 0000 0000 9995

Date: N'importe quelle date future
CVC: N'importe quel 3 chiffres
```

---

## Erreurs courantes

### 400 - Mission doit être acceptée
```
La mission n'est pas en status ASSIGNED, IN_PROGRESS ou DELIVERED
```

### 400 - Déjà payée
```
booking.stripePaymentStatus === "succeeded" && booking.paidAt existe
```

### 403 - Non autorisé
```
L'utilisateur n'est pas la Company propriétaire de la mission
```

### 404 - Réservation non trouvée
```
Le bookingId n'existe pas dans la base de données
```

---

## Fichiers modifiés

### Routes Stripe
- `/src/app/api/stripe/payment-intent/route.ts` ✅
- `/src/app/api/stripe/checkout/route.ts` ✅
- `/src/app/api/stripe/webhook/route.ts` ✅
- `/src/app/api/stripe/refund/route.ts` (inchangé)

### Nouvelle route
- `/src/app/api/bookings/[id]/initiate-payment/route.ts` ✅

### Helpers
- `/src/lib/stripe.ts` (inchangé, helpers disponibles)

---

## Logs utiles

```bash
# Webhook events
[Webhook] Checkout completed for booking xxx
[Webhook] Payment succeeded for booking xxx
[Webhook] Transfer initiated to driver xxx - Amount: 135€ (Platform fee: 15€)
[Webhook] Driver xxx has no Stripe Connect account - transfer skipped
[Webhook] Transfer failed for booking xxx: error message

# Erreurs
Error creating payment intent: ...
Error creating checkout session: ...
Webhook signature verification failed: ...
```

---

## Tests rapides

### Test 1: PaymentIntent
```bash
curl -X POST http://localhost:3000/api/bookings/[id]/initiate-payment \
  -H "Cookie: session-token" \
  -H "Content-Type: application/json"
```

### Test 2: Checkout
```bash
curl -X POST http://localhost:3000/api/stripe/checkout \
  -H "Cookie: session-token" \
  -H "Content-Type: application/json" \
  -d '{"bookingId":"xxx"}'
```

### Test 3: Statut
```bash
curl http://localhost:3000/api/bookings/[id]/initiate-payment \
  -H "Cookie: session-token"
```

---

**Dernière mise à jour**: 2026-01-09
**Version**: 1.0
**Documentation complète**: `PHASE_API_JOBS_STRIPE_COMPLETE.md`
