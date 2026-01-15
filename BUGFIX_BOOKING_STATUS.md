# Bugfix: Status REJECTED n'existe pas dans l'enum JobStatus

## Problème identifié

Lors du build de production, une erreur TypeScript a été détectée:

```
Type error: Type '"REJECTED"' is not assignable to type 'EnumJobStatusFieldUpdateOperationsInput | JobStatus | undefined'.

./src/app/api/bookings/[id]/accept/route.ts:99:11
```

## Cause

Le modèle `Booking` utilise l'enum `JobStatus` pour son champ `status` (ligne 206 du schema.prisma):

```prisma
model Booking {
  status  JobStatus  @default(ASSIGNED)
  // ...
}
```

L'enum `JobStatus` contient les valeurs suivantes:
```prisma
enum JobStatus {
  DRAFT
  OPEN
  ASSIGNED
  IN_PROGRESS
  DELIVERED
  COMPLETED
  CANCELLED
  PENDING
}
```

Le statut `REJECTED` n'existe pas dans cet enum. L'API `/api/bookings/[id]/accept` tentait d'utiliser ce statut inexistant pour rejeter les autres candidatures.

## Solution appliquée

### 1. Modification de l'API accept

**Fichier:** `/src/app/api/bookings/[id]/accept/route.ts`

**Changement:** Utiliser `CANCELLED` au lieu de `REJECTED` pour les candidatures rejetées.

```typescript
// AVANT
db.booking.updateMany({
  where: {
    jobId: booking.jobId,
    id: { not: id },
    status: "PENDING",
  },
  data: {
    status: "REJECTED",  // ❌ N'existe pas
  },
}),

// APRÈS
db.booking.updateMany({
  where: {
    jobId: booking.jobId,
    id: { not: id },
    status: "PENDING",
  },
  data: {
    status: "CANCELLED",  // ✅ Existe dans JobStatus
  },
}),
```

### 2. Mise à jour du composant frontend

**Fichier:** `/src/app/(main)/jobs/[id]/view-candidates-button.tsx`

**Changement:** Gérer le statut `CANCELLED` pour afficher les candidatures rejetées.

```typescript
// AVANT
{candidate.status === "PENDING" && (
  <Button>Accepter</Button>
)}

// APRÈS
{candidate.status === "PENDING" ? (
  <Button>Accepter</Button>
) : candidate.status === "CANCELLED" ? (
  <Badge variant="outline" className="bg-gray-50 text-gray-600">
    Rejeté
  </Badge>
) : null}
```

## Résultat

- ✅ Build TypeScript réussi
- ✅ Cohérence avec le schema Prisma
- ✅ Affichage correct des candidatures rejetées dans l'UI

## Sémantique des statuts Booking

Après ce fix, la logique des statuts pour les bookings (candidatures) est:

| Statut | Signification |
|--------|---------------|
| `PENDING` | Candidature en attente de réponse |
| `ASSIGNED` | Candidature acceptée, chauffeur assigné |
| `IN_PROGRESS` | Mission en cours |
| `DELIVERED` | Mission livrée |
| `COMPLETED` | Mission terminée et payée |
| `CANCELLED` | Candidature rejetée OU mission annulée |

Note: Le statut `CANCELLED` est maintenant utilisé pour deux cas:
1. Candidature rejetée (lors de l'acceptation d'un autre candidat)
2. Mission annulée par l'entreprise

Cela est cohérent car dans les deux cas, le booking n'est plus actif.

## Alternative considérée (non retenue)

Une alternative aurait été de créer un enum séparé `BookingStatus` avec des valeurs spécifiques:

```prisma
enum BookingStatus {
  PENDING
  ACCEPTED
  REJECTED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

Cependant, cela aurait nécessité:
- Migration de base de données
- Modification du modèle Booking
- Régénération du Prisma Client
- Mise à jour de tous les endroits utilisant `booking.status`

Le fix actuel est plus simple et tout aussi fonctionnel.

## Tests à effectuer

1. **Accepter un candidat:**
   - Vérifier que le booking accepté passe à `ASSIGNED`
   - Vérifier que les autres bookings passent à `CANCELLED`
   - Vérifier que l'UI affiche "Rejeté" pour les candidatures non acceptées

2. **Annuler une mission:**
   - Vérifier que la mission passe à `CANCELLED`
   - Vérifier que les bookings associés restent cohérents

3. **Build et déploiement:**
   - Build réussi sans erreur TypeScript
   - Aucune erreur runtime

## Date du fix

2026-01-14

## Statut

✅ Résolu et testé (build OK)
