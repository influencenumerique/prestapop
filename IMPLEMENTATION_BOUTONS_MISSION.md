# Implémentation des boutons "Annuler" et "Voir les candidatures"

## Résumé

Les deux fonctionnalités ont été implémentées avec succès dans la page de détail de mission (`/jobs/[id]`).

## Fichiers modifiés/créés

### 1. Composants Client
- `/src/app/(main)/jobs/[id]/cancel-mission-button.tsx` (Client Component)
- `/src/app/(main)/jobs/[id]/view-candidates-button.tsx` (Client Component)
- `/src/app/(main)/jobs/[id]/page.tsx` (Server Component - importe les boutons)

### 2. Routes API
- `/src/app/api/jobs/[id]/cancel/route.ts` - PATCH pour annuler une mission
- `/src/app/api/jobs/[id]/candidatures/route.ts` - GET pour lister les candidatures
- `/src/app/api/bookings/[id]/accept/route.ts` - PATCH pour accepter un candidat

## Fonctionnalités implémentées

### Bouton "Annuler la mission"

**Conditions d'affichage:**
- `job.status === 'OPEN'`
- `userRole === 'owner'` (l'utilisateur est le propriétaire de la mission)

**Fonctionnement:**
1. Affiche un bouton rouge "Annuler cette mission" avec icône XCircle
2. Au clic, ouvre une Dialog de confirmation
3. Lors de la confirmation:
   - Affiche un toast de chargement
   - Envoie `PATCH /api/jobs/${jobId}/cancel`
   - En cas de succès: toast de succès + refresh de la page
   - En cas d'erreur: toast d'erreur avec le message
4. Spinner de chargement sur le bouton pendant la requête

**Restrictions API:**
- Seules les missions en statut `DRAFT` ou `OPEN` peuvent être annulées
- Seul le propriétaire de la mission (Company) peut l'annuler
- Les candidats en attente (PENDING bookings) sont notifiés conceptuellement

### Bouton "Voir les candidatures"

**Conditions d'affichage:**
- `job.status === 'OPEN'`
- `userRole === 'owner'`
- `job.bookings.length > 0` (au moins une candidature)

**Fonctionnement:**
1. Affiche un bouton "Voir les candidatures" avec icône Users
2. Au clic, ouvre une Dialog modale
3. Charge automatiquement les candidatures via `GET /api/jobs/${jobId}/candidatures`
4. Affiche pour chaque candidat:
   - Avatar et nom du chauffeur
   - Ville (si disponible)
   - Badges: Vérifié, Accepté
   - Véhicule (type + volume)
   - Rating + nombre de livraisons
   - Notes du chauffeur (si disponibles)
   - Date de candidature
   - Bouton "Accepter" (si statut PENDING)

**Actions:**
- Bouton "Accepter" sur chaque candidat PENDING
- Au clic sur Accepter:
  - Affiche un spinner sur le bouton
  - Envoie `PATCH /api/bookings/${bookingId}/accept`
  - En cas de succès:
    - Toast de succès avec nom du chauffeur
    - Ferme la modale
    - Refresh de la page (mission passe à ASSIGNED)
  - En cas d'erreur: toast d'erreur

**Restrictions API:**
- Seul le propriétaire de la mission peut voir les candidatures
- L'acceptation d'un candidat:
  - Change le booking à `ASSIGNED`
  - Change la mission à `ASSIGNED`
  - Rejette automatiquement tous les autres candidats (status `REJECTED`)

## Gestion des états

### Loading states
- Spinner global pendant le chargement des candidatures
- Spinner individuel sur chaque bouton "Accepter" pendant l'action
- Spinner sur le bouton "Annuler" pendant l'annulation
- Tous les boutons sont désactivés pendant les requêtes

### Error handling
- Tous les appels API sont dans des blocs try/catch
- Messages d'erreur affichés via toast (sonner)
- Les erreurs de l'API sont extraites du JSON response

### Success handling
- Toast de succès après chaque action réussie
- `router.refresh()` pour mettre à jour la page automatiquement
- Fermeture automatique des modales après succès

## Affichage conditionnel dans page.tsx

```tsx
{job.status === "OPEN" ? (
  <>
    {userRole === "owner" ? (
      // Company owner - can cancel and view candidates
      <div className="space-y-3">
        {job.bookings.length > 0 && (
          <ViewCandidatesButton jobId={job.id} />
        )}
        <CancelMissionButton jobId={job.id} />
        <p className="text-xs text-center text-muted-foreground">
          {job.bookings.length} candidature(s) reçue(s)
        </p>
      </div>
    ) : userRole === "driver" ? (
      // Driver - can apply
      <ApplyMissionButton ... />
    ) : (
      // Guest - must login
      <Link href="/login">...</Link>
    )}
  </>
) : job.status === "ASSIGNED" && userRole === "owner" ? (
  // Launch mission (Stripe payment)
  <LaunchMissionButton ... />
) : (
  // Other statuses - show badge
  <Badge>{status.label}</Badge>
)}
```

## Format des données API

### GET /api/jobs/[id]/candidatures
```json
{
  "jobId": "...",
  "jobTitle": "...",
  "candidatures": [
    {
      "bookingId": "...",
      "driverId": "...",
      "driverName": "...",
      "driverEmail": "...",
      "driverProfilePicture": "...",
      "vehicle": "...",
      "rating": 4.5,
      "totalDeliveries": 42,
      "appliedAt": "2026-01-14T...",
      "status": "PENDING",
      "agreedPrice": 150,
      "driverNotes": "...",
      "stripePaymentStatus": null,
      "driverCity": "Paris",
      "driverIsVerified": true,
      "driverIsAvailable": true
    }
  ],
  "total": 1
}
```

### PATCH /api/jobs/[id]/cancel
```json
{
  "success": true,
  "job": { ... },
  "message": "Mission annulée avec succès",
  "pendingBookingsCount": 2
}
```

### PATCH /api/bookings/[id]/accept
```json
{
  "success": true,
  "message": "Candidature acceptée avec succès",
  "booking": {
    "id": "...",
    "status": "ASSIGNED",
    "driver": {
      "name": "...",
      "email": "..."
    }
  }
}
```

## Tests manuels recommandés

1. **En tant qu'entreprise propriétaire:**
   - Créer une mission
   - Vérifier que le bouton "Annuler" apparaît
   - Annuler la mission et vérifier le changement de statut
   - Recevoir des candidatures
   - Vérifier que le bouton "Voir les candidatures" apparaît
   - Ouvrir la liste des candidats
   - Accepter un candidat
   - Vérifier que la mission passe à ASSIGNED

2. **En tant que chauffeur:**
   - Postuler à une mission OPEN
   - Vérifier que le bouton "Voir les candidatures" n'apparaît pas

3. **En tant que visiteur non connecté:**
   - Voir une mission OPEN
   - Vérifier qu'aucun bouton d'action n'apparaît (sauf "Connectez-vous")

## Points techniques

### Sécurité
- Toutes les routes API vérifient l'authentification (`requireRole`, `requireAuth`)
- Vérification du propriétaire via `isCompanyOwner(user, job.companyId)`
- Validation des statuts avant chaque action

### UX
- Toasts informatifs à chaque étape
- Spinners pendant les chargements
- Boutons désactivés pendant les actions
- Confirmation avant annulation
- Refresh automatique après succès

### Performance
- Server Components pour la page principale (pas de JS côté client pour l'affichage)
- Client Components uniquement pour les boutons interactifs
- Chargement lazy des candidatures (uniquement à l'ouverture de la modale)

## Améliorations futures possibles

1. **Notifications en temps réel:**
   - WebSocket pour notifier les chauffeurs de l'annulation
   - Notification push lors de l'acceptation/rejet

2. **Filtres et tri:**
   - Trier les candidats par rating, date, distance
   - Filtrer par véhicule, disponibilité

3. **Historique:**
   - Log des actions (qui a annulé, quand)
   - Raison de l'annulation

4. **Multi-acceptation:**
   - Possibilité d'accepter plusieurs chauffeurs pour une même mission
   - Gestion de sous-missions

5. **Chat intégré:**
   - Messagerie directe entre entreprise et candidat avant acceptation
