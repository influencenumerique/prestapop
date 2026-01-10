# Implémentation No-Show + Sanctions + Refund - Résumé

## Objectif

Ajouter la gestion complète des no-shows (chauffeur absent) avec :
- Signalement par l'entreprise
- Confirmation/contestation par admin ou chauffeur
- Sanctions automatiques progressives (3 strikes)
- Remboursement Stripe automatique
- Webhooks pour suivi des refunds

## Contraintes respectées

1. **Aucune modification du schema Prisma** : Utilisation des champs existants (notes, bio)
2. **Pas de changement UI** : API uniquement
3. **Modifications limitées** : Seulement `app/api/bookings/**` et `app/api/stripe/webhook/**`
4. **npm run dev fonctionnel** : Pas de breaking changes

## Fichiers modifiés/créés

### 1. Nouveaux endpoints (3 routes)

#### `/api/bookings/[id]/report-no-show/route.ts`
**Path complet** : `/Users/malik/Desktop/prestapop/src/app/api/bookings/[id]/report-no-show/route.ts`

**Fonctionnalité** :
- Entreprise signale un no-show
- Ajoute marqueur "NO_SHOW_REPORTED:" dans `companyNotes`
- Notification au chauffeur (TODO: email)

**Méthode HTTP** : `POST`

**Authentification** : `Role.COMPANY` uniquement

**Body** :
```json
{
  "comment": "string (min 10 caractères)",
  "evidence": "url (optionnel)"
}
```

**Response** :
```json
{
  "success": true,
  "message": "No-show signalé avec succès",
  "booking": { ... },
  "nextStep": "..."
}
```

---

#### `/api/bookings/[id]/confirm-no-show/route.ts`
**Path complet** : `/Users/malik/Desktop/prestapop/src/app/api/bookings/[id]/confirm-no-show/route.ts`

**Fonctionnalité** :
- Admin/Chauffeur confirme ou conteste le no-show
- Si confirmé :
  - Booking → `CANCELLED`
  - Incrémenter `strikeCount` (stocké dans `DriverProfile.bio`)
  - Appliquer sanction automatique :
    - Strike 1 : Avertissement
    - Strike 2 : Suspension 7 jours (`isAvailable = false`)
    - Strike 3+ : Ban permanent (`isAvailable = false`)
- Si contesté :
  - Ajoute "NO_SHOW_CONTESTED:" dans `driverNotes`
  - Investigation manuelle nécessaire

**Méthode HTTP** : `PATCH`

**Authentification** : `Role.ADMIN` ou `Role.DRIVER` (son propre booking)

**Body** :
```json
{
  "confirmed": true,
  "adminComment": "string (optionnel)"
}
```

**Response (confirmé)** :
```json
{
  "success": true,
  "message": "No-show confirmé. Sanction appliquée: ...",
  "booking": { ... },
  "sanction": {
    "strikeCount": 2,
    "message": "SUSPENSION 7 JOURS - 2ème no-show",
    "isBanned": false,
    "suspensionUntil": "2026-01-17T11:00:00.000Z"
  },
  "nextStep": "..."
}
```

---

#### `/api/bookings/[id]/refund/route.ts`
**Path complet** : `/Users/malik/Desktop/prestapop/src/app/api/bookings/[id]/refund/route.ts`

**Fonctionnalité** :
- Entreprise ou Admin demande un remboursement Stripe
- Vérifie que no-show est confirmé
- Vérifie que paiement existe et est "succeeded"
- Crée un `Refund` via Stripe API
- Ajoute "REFUND_INITIATED:" dans `companyNotes`
- Webhook Stripe confirmera le remboursement

**Méthode HTTP** : `PATCH`

**Authentification** : `Role.ADMIN` ou `Role.COMPANY` (propriétaire)

**Body** (optionnel) :
```json
{
  "reason": "requested_by_customer",
  "comment": "string (optionnel)"
}
```

**Response** :
```json
{
  "success": true,
  "message": "Remboursement initié avec succès. Le montant sera crédité sous 5-10 jours.",
  "booking": { ... },
  "refund": {
    "id": "re_1ABC123",
    "amount": 15000,
    "currency": "eur",
    "status": "pending",
    "reason": "requested_by_customer"
  },
  "nextStep": "Le webhook Stripe confirmera le remboursement une fois traité."
}
```

---

### 2. Webhook Stripe modifié

#### `/api/stripe/webhook/route.ts`
**Path complet** : `/Users/malik/Desktop/prestapop/src/app/api/stripe/webhook/route.ts`

**Modifications** :
- Ajout de handlers pour `refund.created` et `refund.updated`
- Lorsque `refund.status = "succeeded"` :
  - Met à jour `booking.stripePaymentStatus = "refunded"`
  - Ajoute log dans `companyNotes`
  - Assure que `booking.status = CANCELLED` et `job.status = CANCELLED`

**Nouveaux événements gérés** :
- `refund.created` : Log création du refund
- `refund.updated` : Mise à jour status, log si succès

---

## Structure des données

### Tracking des no-shows (sans modifier schema)

Puisque les champs `strikeCount`, `isBanned`, `suspensionUntil`, `lastStrikeAt` n'existent pas dans `DriverProfile`, on les stocke dans le champ `bio` :

**Format** :
```
[SANCTION] STRIKE_COUNT:2 | LAST_STRIKE:2026-01-10T11:00:00.000Z | SUSPENDED_UNTIL:2026-01-17T11:00:00.000Z
```

**Exemple dans la DB** :
```sql
DriverProfile {
  id: "driver123",
  bio: "Chauffeur expérimenté...\n\n[SANCTION] STRIKE_COUNT:2 | LAST_STRIKE:2026-01-10T11:00:00.000Z | SUSPENDED_UNTIL:2026-01-17T11:00:00.000Z",
  isAvailable: false,
  ...
}
```

### Tracking des événements dans notes

**Booking.companyNotes** (utilisé par Company et Admin) :
```
NO_SHOW_REPORTED: [2026-01-10T10:30:00.000Z] Le chauffeur ne s'est pas présenté...
Preuve: https://example.com/proof.jpg

NO_SHOW_CONFIRMED: [2026-01-10T11:00:00.000Z] Par ADMIN admin@example.com
Commentaire: Après investigation, le no-show est confirmé.
Sanction: AVERTISSEMENT - 1er no-show

REFUND_INITIATED: [2026-01-10T11:30:00.000Z] Par COMPANY company@example.com
Stripe Refund ID: re_1ABC123
Montant: 150.00€
Statut: pending

[2026-01-10T11:35:00.000Z] Stripe webhook: Refund mis à jour (ID: re_1ABC123, Statut: succeeded)
```

**Booking.driverNotes** (utilisé par Driver) :
```
NO_SHOW_CONTESTED: [2026-01-10T11:00:00.000Z] Par DRIVER driver@example.com
Commentaire: J'ai eu un accident de voiture et j'ai tenté d'appeler l'entreprise sans succès.
```

---

## Workflow complet

```
1. Mission assignée
   ├─ Booking.status = ASSIGNED
   └─ Job.status = ASSIGNED

2. Chauffeur ne se présente pas
   └─ Entreprise : POST /api/bookings/:id/report-no-show
      ├─ companyNotes += "NO_SHOW_REPORTED:"
      └─ Notification → chauffeur

3. Confirmation/Contestation
   ├─ Option A: Admin confirme (PATCH /api/bookings/:id/confirm-no-show)
   │  ├─ Booking.status = CANCELLED
   │  ├─ Job.status = CANCELLED
   │  ├─ strikeCount += 1 (dans bio)
   │  ├─ Sanction appliquée (warning/suspension/ban)
   │  └─ companyNotes += "NO_SHOW_CONFIRMED:"
   │
   └─ Option B: Chauffeur conteste
      ├─ driverNotes += "NO_SHOW_CONTESTED:"
      └─ Investigation manuelle requise

4. Remboursement (si confirmé)
   └─ Company/Admin : PATCH /api/bookings/:id/refund
      ├─ Stripe.refunds.create(paymentIntentId)
      ├─ companyNotes += "REFUND_INITIATED:"
      └─ stripePaymentStatus = "refund_pending"

5. Confirmation webhook Stripe
   └─ Webhook : refund.updated (status = succeeded)
      ├─ stripePaymentStatus = "refunded"
      ├─ companyNotes += "Stripe webhook: Refund mis à jour..."
      └─ Montant crédité sur compte entreprise (5-10 jours)
```

---

## Sanctions automatiques

| Strike | Sanction | Durée | isAvailable | isBanned |
|--------|----------|-------|-------------|----------|
| 1 | Avertissement | - | true | false |
| 2 | Suspension | 7 jours | false | false |
| 3+ | Ban permanent | ∞ | false | true |

**Détails** :
- **Strike 1** : Simple avertissement, pas d'impact opérationnel
- **Strike 2** : Chauffeur suspendu 7 jours, ne peut plus accepter de missions (`isAvailable = false`)
- **Strike 3+** : Ban définitif, compte chauffeur désactivé de manière permanente

**Calcul de `suspensionUntil`** :
```javascript
const suspensionDays = 7
const suspensionUntil = new Date(Date.now() + suspensionDays * 24 * 60 * 60 * 1000)
```

---

## Champs utilisés du modèle Prisma

### Booking (modèle existant)
```prisma
model Booking {
  id                  String    @id @default(cuid())
  status              JobStatus // ASSIGNED → CANCELLED après no-show confirmé
  companyNotes        String?   // Tracking no-show + refund
  driverNotes         String?   // Contestation chauffeur
  stripePaymentId     String?   // ID PaymentIntent pour refund
  stripePaymentStatus String?   // "succeeded" → "refunded"
  paidAt              DateTime?
  updatedAt           DateTime
  ...
}
```

### DriverProfile (modèle existant)
```prisma
model DriverProfile {
  id              String  @id @default(cuid())
  bio             String? // Stockage temporaire des strikes (à migrer)
  isAvailable     Boolean // false si suspendu ou banni
  ...
}
```

**Note** : Aucun nouveau champ n'a été ajouté au schema Prisma, conformément aux contraintes.

---

## Tests et validation

### Tests manuels (Postman/cURL)

Voir documentation complète : `/Users/malik/Desktop/prestapop/docs/NO_SHOW_API_TESTING.md`

**Exemples de payloads** :

```bash
# 1. Report no-show
curl -X POST http://localhost:3000/api/bookings/booking123/report-no-show \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer COMPANY_TOKEN" \
  -d '{"comment": "Chauffeur absent, aucune réponse.", "evidence": "https://example.com/proof.jpg"}'

# 2. Confirm no-show
curl -X PATCH http://localhost:3000/api/bookings/booking123/confirm-no-show \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"confirmed": true, "adminComment": "No-show confirmé."}'

# 3. Request refund
curl -X PATCH http://localhost:3000/api/bookings/booking123/refund \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer COMPANY_TOKEN" \
  -d '{"reason": "requested_by_customer"}'
```

### Tests webhook Stripe (local)

```bash
# 1. Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# 2. Login
stripe login

# 3. Forward events vers localhost
stripe listen --forward-to http://localhost:3000/api/stripe/webhook

# 4. Trigger refund event
stripe trigger refund.succeeded
```

---

## Logs et debugging

Tous les endpoints loggent dans la console :

```javascript
// report-no-show
console.log(`[NO-SHOW] Notification à envoyer au chauffeur ${email}`, { ... })

// confirm-no-show (confirmé)
console.log(`[NO-SHOW CONFIRMED] Sanction appliquée au chauffeur ${email}`, { strikeCount, sanction, ... })

// confirm-no-show (contesté)
console.log(`[NO-SHOW CONTESTED] Le chauffeur ${email} conteste le no-show`, { ... })

// refund
console.log(`[REFUND INITIATED] Remboursement initié pour booking ${id}`, { amount, refundId, ... })

// webhook
console.log(`[Webhook] Refund succeeded for booking ${id} - Amount: ${amount}€`)
```

---

## Limitations et TODOs

### 1. Schema Prisma non optimal

**Problème** : Les champs de sanction (`strikeCount`, `isBanned`, `suspensionUntil`) sont stockés dans le champ texte `bio`, ce qui est fragile et non indexable.

**Solution recommandée** : Migration Prisma pour ajouter ces champs au modèle `DriverProfile` :

```prisma
model DriverProfile {
  // Existing fields...
  strikeCount     Int       @default(0)
  lastStrikeAt    DateTime?
  isBanned        Boolean   @default(false)
  suspensionUntil DateTime?

  // Index for queries
  @@index([isBanned])
  @@index([suspensionUntil])
}
```

### 2. Notifications non implémentées

**TODOs** :
- Envoyer email au chauffeur lors du signalement no-show
- Envoyer email à l'entreprise lors de la confirmation/contestation
- Envoyer email à l'entreprise lors du remboursement réussi
- Notifications in-app (si système existant)

**Services recommandés** : SendGrid, Resend, AWS SES

### 3. Gestion Stripe Connect

**Problème** : Si le paiement a déjà été transféré au chauffeur via Stripe Connect (transfer), le remboursement simple échouera.

**Solution** : Implémenter une logique de "reverse transfer" pour récupérer les fonds du compte chauffeur avant de rembourser l'entreprise.

**Code à ajouter** (dans `/api/bookings/[id]/refund/route.ts`) :
```typescript
// Check if transfer was made to driver
const transfers = await stripe.transfers.list({
  destination: driver.stripeAccountId,
})

const transfer = transfers.data.find(t => t.metadata.bookingId === bookingId)

if (transfer) {
  // Reverse the transfer first
  await stripe.transfers.createReversal(transfer.id, {
    amount: transfer.amount,
  })
}

// Then refund the company
await createRefund(paymentIntentId, metadata)
```

### 4. Tests unitaires manquants

**TODOs** :
- Tests Jest pour chaque endpoint
- Tests d'intégration pour le workflow complet
- Tests webhook avec mocks Stripe

**Exemple structure** :
```
__tests__/
  api/
    bookings/
      report-no-show.test.ts
      confirm-no-show.test.ts
      refund.test.ts
    stripe/
      webhook.test.ts
```

### 5. Dashboard admin

**Fonctionnalités à implémenter** :
- Visualiser tous les no-shows signalés
- Interface pour confirmer/contester manuellement
- Historique des sanctions par chauffeur
- Analytics : taux de no-show par chauffeur, région, etc.

---

## Migration recommandée (Schema Prisma)

Pour passer d'un stockage texte (bio) à des champs structurés :

### 1. Créer migration

```bash
cd /Users/malik/Desktop/prestapop
npx prisma migrate dev --name add-driver-sanctions
```

### 2. Modifier `prisma/schema.prisma`

```prisma
model DriverProfile {
  id              String      @id @default(cuid())
  userId          String      @unique
  phone           String?
  bio             String?     @db.Text
  city            String?
  region          String?
  vehicleTypes    VehicleType[]
  licenseNumber   String?
  insuranceNumber String?
  stripeAccountId String?
  isVerified      Boolean     @default(false)
  isAvailable     Boolean     @default(true)
  rating          Float       @default(0)
  totalDeliveries Int         @default(0)
  totalReviews    Int         @default(0)

  // NOUVEAUX CHAMPS
  strikeCount     Int         @default(0)
  lastStrikeAt    DateTime?
  isBanned        Boolean     @default(false)
  suspensionUntil DateTime?

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  bookings        Booking[]         @relation("DriverBookings")
  feedbacks       DriverFeedback[]
  badges          DriverBadge[]
  tagStats        DriverTagStats[]

  @@index([isBanned])
  @@index([suspensionUntil])
  @@map("driver_profiles")
}
```

### 3. Mettre à jour `confirm-no-show/route.ts`

Remplacer la logique de parsing du champ `bio` par :

```typescript
// Ancien code (parsing bio)
const driverNotes = booking.driver.bio || ""
let strikeCount = 0
const strikeMatch = driverNotes.match(/STRIKE_COUNT:(\d+)/)
if (strikeMatch) {
  strikeCount = parseInt(strikeMatch[1], 10)
}

// Nouveau code (champs structurés)
let strikeCount = booking.driver.strikeCount || 0
strikeCount += 1

// Update driver
await db.driverProfile.update({
  where: { id: booking.driverId },
  data: {
    strikeCount,
    lastStrikeAt: new Date(),
    isBanned: strikeCount >= 3,
    suspensionUntil: strikeCount === 2 ? suspensionUntilDate : null,
    isAvailable: strikeCount < 2,
  },
})
```

### 4. Migrer les données existantes

Script de migration pour parser les anciennes données du champ `bio` :

```typescript
// scripts/migrate-driver-sanctions.ts
import { db } from "@/lib/db"

async function migrateDriverSanctions() {
  const drivers = await db.driverProfile.findMany()

  for (const driver of drivers) {
    if (!driver.bio) continue

    const strikeMatch = driver.bio.match(/STRIKE_COUNT:(\d+)/)
    const lastStrikeMatch = driver.bio.match(/LAST_STRIKE:([^\s\|]+)/)
    const bannedMatch = driver.bio.match(/BANNED:true/)
    const suspensionMatch = driver.bio.match(/SUSPENDED_UNTIL:([^\s\|]+)/)

    if (strikeMatch) {
      const strikeCount = parseInt(strikeMatch[1], 10)
      const lastStrikeAt = lastStrikeMatch ? new Date(lastStrikeMatch[1]) : null
      const isBanned = !!bannedMatch
      const suspensionUntil = suspensionMatch ? new Date(suspensionMatch[1]) : null

      await db.driverProfile.update({
        where: { id: driver.id },
        data: {
          strikeCount,
          lastStrikeAt,
          isBanned,
          suspensionUntil,
          isAvailable: !isBanned && (!suspensionUntil || suspensionUntil < new Date()),
        },
      })

      console.log(`Migrated driver ${driver.id}: ${strikeCount} strikes`)
    }
  }

  console.log("Migration completed")
}

migrateDriverSanctions()
```

Exécuter :
```bash
npx tsx scripts/migrate-driver-sanctions.ts
```

---

## Sécurité

### Authentification et autorisations

Tous les endpoints utilisent les helpers d'auth :
- `requireRole(role)` : Vérifie le rôle requis
- `requireAnyRole([roles])` : Vérifie plusieurs rôles possibles
- `isCompanyOwner(user, companyId)` : Vérifie la propriété
- `isDriver(user, driverId)` : Vérifie l'identité du chauffeur

### Validation des données

Tous les payloads sont validés avec Zod :
```typescript
const reportNoShowSchema = z.object({
  comment: z.string().min(10),
  evidence: z.string().url().optional(),
})

const data = reportNoShowSchema.parse(body) // Throws ZodError si invalide
```

### Protection Stripe

Le webhook vérifie la signature Stripe :
```typescript
const signature = headersList.get("Stripe-Signature")
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET!
)
```

---

## Résumé des routes

| Endpoint | Méthode | Rôle | Description |
|----------|---------|------|-------------|
| `/api/bookings/:id/report-no-show` | POST | COMPANY | Signaler un no-show |
| `/api/bookings/:id/confirm-no-show` | PATCH | ADMIN, DRIVER | Confirmer ou contester |
| `/api/bookings/:id/refund` | PATCH | ADMIN, COMPANY | Demander remboursement |
| `/api/stripe/webhook` | POST | Public | Webhook Stripe (signature) |

---

## Dépendances

Toutes les dépendances utilisées sont déjà présentes dans le projet :
- `stripe` : SDK Stripe
- `zod` : Validation
- `@prisma/client` : ORM
- `next-auth` : Authentification

Aucune nouvelle dépendance n'a été ajoutée.

---

## Contact et support

Pour toute question ou bug :
1. Consulter les logs serveur (console)
2. Vérifier la documentation de test : `/docs/NO_SHOW_API_TESTING.md`
3. Tester avec Stripe CLI en mode test
4. Contacter l'équipe technique

---

## Checklist de déploiement

Avant de déployer en production :

- [ ] Migrer le schema Prisma (ajouter champs de sanction)
- [ ] Exécuter le script de migration des données
- [ ] Configurer `STRIPE_WEBHOOK_SECRET` dans les variables d'environnement
- [ ] Configurer le webhook Stripe dans le dashboard (URL : `https://domain.com/api/stripe/webhook`)
- [ ] Implémenter les notifications email
- [ ] Ajouter tests unitaires Jest
- [ ] Tester le workflow complet en environnement staging
- [ ] Documenter les processus pour l'équipe support
- [ ] Créer un dashboard admin pour visualiser les no-shows
- [ ] Former l'équipe support sur la gestion des contestations
- [ ] Monitorer les logs Stripe et les remboursements

---

**Implémentation terminée le** : 2026-01-10

**Développeur** : AGENT_TRANSPORT_API_JOBS (Claude Code)

**Version** : 1.0.0
