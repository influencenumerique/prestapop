# Phase API Jobs - Candidatures et Annulation

## Objectif
Création de deux nouvelles routes API pour gérer les candidatures aux missions et l'annulation de missions.

## Routes créées

### 1. `/api/jobs/[id]/candidatures` - GET

**Fichier**: `src/app/api/jobs/[id]/candidatures/route.ts`

**Description**: Liste des candidatures (bookings) pour une mission spécifique.

**Authentification**: Role.COMPANY uniquement

**Autorisation**: L'entreprise doit être propriétaire de la mission (job.companyId === user.company.id)

**Réponse**:
```typescript
{
  jobId: string
  jobTitle: string
  candidatures: [
    {
      bookingId: string
      driverId: string
      driverName: string | null
      driverProfilePicture: string | null
      vehicle: VehicleType[]
      rating: number
      totalDeliveries: number
      appliedAt: Date
      status: JobStatus
      agreedPrice: number
      driverNotes: string | null
      stripePaymentStatus: string | null
      driverCity: string | null
      driverIsVerified: boolean
      driverIsAvailable: boolean
    }
  ]
  total: number
}
```

**Codes de réponse**:
- `200`: Succès - Liste des candidatures
- `400`: Profil entreprise non trouvé
- `401`: Non authentifié
- `403`: Accès refusé (pas le propriétaire de la mission ou pas Role.COMPANY)
- `404`: Mission non trouvée
- `500`: Erreur serveur

**Utilisation**:
```typescript
// Récupérer les candidatures pour une mission
const response = await fetch(`/api/jobs/${jobId}/candidatures`)
const data = await response.json()
```

---

### 2. `/api/jobs/[id]/cancel` - PATCH

**Fichier**: `src/app/api/jobs/[id]/cancel/route.ts`

**Description**: Annuler une mission (changement de statut vers CANCELLED).

**Authentification**: Role.COMPANY uniquement

**Autorisation**:
- L'entreprise doit être propriétaire de la mission
- Le statut actuel doit permettre l'annulation (DRAFT ou OPEN uniquement)

**Réponse succès**:
```typescript
{
  success: true
  job: Job // Mission complète avec relations
  message: "Mission annulée avec succès"
  pendingBookingsCount: number
}
```

**Réponse erreur (statut invalide)**:
```typescript
{
  error: string
  currentStatus: string
  allowedStatuses: ["DRAFT", "OPEN"]
}
```

**Codes de réponse**:
- `200`: Succès - Mission annulée
- `400`: Statut invalide pour annulation ou profil entreprise non trouvé
- `401`: Non authentifié
- `403`: Accès refusé (pas le propriétaire de la mission ou pas Role.COMPANY)
- `404`: Mission non trouvée
- `500`: Erreur serveur

**Utilisation**:
```typescript
// Annuler une mission
const response = await fetch(`/api/jobs/${jobId}/cancel`, {
  method: 'PATCH',
})
const data = await response.json()
```

---

## Sécurité et autorisations

### Vérifications implémentées

1. **Authentification**: Utilisation de `requireRole("COMPANY")` pour les deux routes
2. **Profil existant**: Vérification que `user.company` existe
3. **Propriété**: Vérification avec `isCompanyOwner(user, job.companyId)`
4. **État de la mission**: Pour l'annulation, vérification que le statut est DRAFT ou OPEN

### Helpers d'authentification utilisés

```typescript
import { requireRole, isCompanyOwner } from "@/lib/api-auth"
```

- `requireRole("COMPANY")`: Vérifie que l'utilisateur est authentifié et a le rôle COMPANY
- `isCompanyOwner(user, companyId)`: Vérifie que l'utilisateur est propriétaire de l'entreprise

---

## Modèles Prisma utilisés

### Job
```prisma
model Job {
  id               String          @id @default(cuid())
  companyId        String
  title            String
  status           JobStatus       @default(DRAFT)
  // ... autres champs
  bookings         Booking[]
  company          Company
}
```

### Booking
```prisma
model Booking {
  id                  String          @id @default(cuid())
  jobId               String
  driverId            String
  status              JobStatus       @default(ASSIGNED)
  agreedPrice         Int
  driverNotes         String?
  stripePaymentStatus String?
  // ... autres champs
  driver              DriverProfile
  job                 Job
}
```

### JobStatus (enum)
```prisma
enum JobStatus {
  DRAFT          // Brouillon
  OPEN           // Ouverte aux candidatures
  ASSIGNED       // Chauffeur assigné
  IN_PROGRESS    // En cours
  DELIVERED      // Livrée
  COMPLETED      // Complétée
  CANCELLED      // Annulée
  PENDING        // En attente de paiement
}
```

---

## Logique métier

### Route candidatures
1. Vérifie l'authentification et le rôle COMPANY
2. Vérifie que la mission existe
3. Vérifie que l'entreprise est propriétaire
4. Récupère tous les bookings avec les détails du chauffeur
5. Formate les données pour une réponse structurée

### Route cancel
1. Vérifie l'authentification et le rôle COMPANY
2. Vérifie que la mission existe
3. Vérifie que l'entreprise est propriétaire
4. Vérifie que le statut actuel permet l'annulation (DRAFT ou OPEN)
5. Met à jour le statut vers CANCELLED
6. Retourne les détails de la mission et le nombre de candidatures affectées

---

## Points d'attention

### Notifications (à implémenter)
Lorsqu'une mission est annulée, les chauffeurs ayant candidaté (bookings en status PENDING) devraient être notifiés. Cela pourrait être géré via:
- Webhooks
- Système de notifications en temps réel
- Emails de notification

### Gestion Stripe
Si des paiements sont en cours pour la mission annulée, il faudra gérer:
- Les remboursements éventuels
- L'annulation des PaymentIntents Stripe
- La mise à jour du `stripePaymentStatus`

### Restrictions d'annulation
Actuellement, seules les missions en DRAFT ou OPEN peuvent être annulées. Si une mission est déjà ASSIGNED, IN_PROGRESS ou au-delà, l'annulation est refusée. Cette logique pourrait être étendue avec:
- Frais d'annulation tardive
- Processus de remboursement
- Compensation pour le chauffeur

---

## Tests suggérés

### Route `/api/jobs/[id]/candidatures`
1. Accès par une entreprise propriétaire → 200
2. Accès par une entreprise non propriétaire → 403
3. Accès par un chauffeur → 403
4. Accès sans authentification → 401
5. Mission inexistante → 404
6. Mission sans candidatures → 200 avec tableau vide

### Route `/api/jobs/[id]/cancel`
1. Annulation par propriétaire, statut DRAFT → 200
2. Annulation par propriétaire, statut OPEN → 200
3. Annulation par propriétaire, statut ASSIGNED → 400
4. Annulation par non-propriétaire → 403
5. Annulation par chauffeur → 403
6. Annulation sans authentification → 401
7. Mission inexistante → 404

---

## Intégration frontend

### Exemple: Afficher les candidatures
```typescript
// Dans un composant React Server Component
async function MissionCandidatesPage({ params }: { params: { id: string } }) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${params.id}/candidatures`, {
    headers: {
      // NextAuth session cookie automatiquement inclus
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch candidates')
  }

  const data = await response.json()

  return (
    <div>
      <h1>Candidatures pour {data.jobTitle}</h1>
      <p>{data.total} candidature(s)</p>
      {data.candidatures.map(candidate => (
        <CandidateCard key={candidate.bookingId} candidate={candidate} />
      ))}
    </div>
  )
}
```

### Exemple: Annuler une mission
```typescript
// Dans un composant Client
'use client'

async function cancelMission(jobId: string) {
  const response = await fetch(`/api/jobs/${jobId}/cancel`, {
    method: 'PATCH',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to cancel mission')
  }

  const data = await response.json()
  return data
}

export function CancelMissionButton({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette mission ?')) return

    setLoading(true)
    try {
      await cancelMission(jobId)
      toast.success('Mission annulée avec succès')
      router.refresh()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleCancel} disabled={loading}>
      {loading ? 'Annulation...' : 'Annuler la mission'}
    </button>
  )
}
```

---

## Structure des fichiers

```
src/app/api/jobs/
├── route.ts                           # GET (liste) et POST (créer)
└── [id]/
    ├── route.ts                       # GET (détail), PATCH (modifier), DELETE
    ├── apply/
    │   └── route.ts                   # POST (candidater - Role.DRIVER)
    ├── candidatures/
    │   └── route.ts                   # GET (liste candidatures - Role.COMPANY) ✨ NEW
    └── cancel/
        └── route.ts                   # PATCH (annuler - Role.COMPANY) ✨ NEW
```

---

## Résumé des modifications

### Fichiers créés
1. `/src/app/api/jobs/[id]/candidatures/route.ts` (111 lignes)
2. `/src/app/api/jobs/[id]/cancel/route.ts` (113 lignes)

### Imports utilisés
- `NextResponse` from `next/server`
- `db` from `@/lib/db`
- `requireRole`, `isCompanyOwner` from `@/lib/api-auth`

### Dépendances
- Aucune nouvelle dépendance npm requise
- Utilise les helpers d'authentification existants
- Utilise le schéma Prisma existant

---

## Prochaines étapes suggérées

1. **Tests unitaires**: Ajouter des tests pour les deux routes
2. **Notifications**: Implémenter le système de notification pour les annulations
3. **Webhooks Stripe**: Gérer les annulations de paiement si nécessaire
4. **UI Dashboard**: Créer l'interface pour visualiser les candidatures
5. **UI Confirmation**: Ajouter une modale de confirmation pour l'annulation
6. **Logs**: Ajouter des logs métier pour tracer les annulations
7. **Métriques**: Suivre le taux d'annulation de missions
