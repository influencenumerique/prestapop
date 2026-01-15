# Flow des boutons "Annuler" et "Voir les candidatures"

## Architecture globale

```
┌─────────────────────────────────────────────────────────────────┐
│                    /jobs/[id]/page.tsx                          │
│                   (Server Component)                            │
│                                                                 │
│  Récupère: job, user session, userRole                         │
│  Logique: Détermine quel bouton afficher                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Rend conditionnellement
                              ▼
        ┌─────────────────────────────────────────┐
        │   job.status === 'OPEN' ?               │
        │   && userRole === 'owner' ?             │
        └─────────────────────────────────────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
                 ▼                         ▼
    ┌─────────────────────┐   ┌─────────────────────────┐
    │ CancelMissionButton │   │ ViewCandidatesButton    │
    │  (Client Component) │   │  (Client Component)     │
    └─────────────────────┘   └─────────────────────────┘
```

## Flow 1: Annuler une mission

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. AFFICHAGE                                                     │
│    page.tsx vérifie:                                             │
│    - job.status === 'OPEN'                                       │
│    - userRole === 'owner'                                        │
│    ✓ Rend <CancelMissionButton jobId={job.id} />                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. INTERACTION UTILISATEUR                                       │
│    L'utilisateur clique sur "Annuler cette mission"             │
│    → setIsOpen(true)                                             │
│    → Dialog de confirmation s'ouvre                              │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. CONFIRMATION                                                  │
│    L'utilisateur clique sur "Confirmer l'annulation"            │
│    → handleCancel() est appelé                                   │
│    → setIsLoading(true)                                          │
│    → toast.loading("Annulation de la mission...")                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. APPEL API                                                     │
│    fetch(`/api/jobs/${jobId}/cancel`, { method: 'PATCH' })      │
│    ┌────────────────────────────────────────────────────────┐   │
│    │  Backend vérifie:                                      │   │
│    │  - Auth: requireRole('COMPANY')                        │   │
│    │  - Ownership: isCompanyOwner(user, job.companyId)     │   │
│    │  - Status: job.status in ['DRAFT', 'OPEN']            │   │
│    │  ✓ Update: job.status = 'CANCELLED'                   │   │
│    └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
            SUCCÈS (200)              ERREUR (4xx/5xx)
                 │                         │
                 ▼                         ▼
┌─────────────────────────────┐ ┌────────────────────────┐
│ 5A. SUCCÈS                  │ │ 5B. ERREUR             │
│ toast.success(...)          │ │ toast.error(...)       │
│ setIsOpen(false)            │ │ Modale reste ouverte   │
│ router.refresh()            │ │ setIsLoading(false)    │
│ → Page se rafraîchit        │ │ Utilisateur peut retry │
│ → Badge "Annulée" s'affiche │ └────────────────────────┘
└─────────────────────────────┘
```

## Flow 2: Voir et accepter les candidatures

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. AFFICHAGE                                                     │
│    page.tsx vérifie:                                             │
│    - job.status === 'OPEN'                                       │
│    - userRole === 'owner'                                        │
│    - job.bookings.length > 0                                     │
│    ✓ Rend <ViewCandidatesButton jobId={job.id} />               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. INTERACTION UTILISATEUR                                       │
│    L'utilisateur clique sur "Voir les candidatures"             │
│    → handleOpenChange(true)                                      │
│    → Dialog s'ouvre                                              │
│    → loadCandidates() est appelé                                 │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. CHARGEMENT DES CANDIDATURES                                   │
│    setIsLoading(true)                                            │
│    toast.loading("Chargement des candidatures...")               │
│    fetch(`/api/jobs/${jobId}/candidatures`)                      │
│    ┌────────────────────────────────────────────────────────┐   │
│    │  Backend vérifie:                                      │   │
│    │  - Auth: requireRole('COMPANY')                        │   │
│    │  - Ownership: isCompanyOwner(user, job.companyId)     │   │
│    │  ✓ Retourne: liste des bookings avec driver info      │   │
│    └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
            SUCCÈS (200)              ERREUR (4xx/5xx)
                 │                         │
                 ▼                         ▼
┌─────────────────────────────┐ ┌────────────────────────┐
│ 4A. AFFICHAGE DES CANDIDATS │ │ 4B. ERREUR             │
│ setCandidates(data)         │ │ toast.error(...)       │
│ toast.dismiss()             │ │ Affiche message vide   │
│ Rend Card pour chaque       │ └────────────────────────┘
│ candidat avec:              │
│ - Info chauffeur            │
│ - Rating & badges           │
│ - Bouton "Accepter"         │
└─────────────────────────────┘
                 │
                 │ L'utilisateur clique sur "Accepter"
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. ACCEPTATION D'UN CANDIDAT                                     │
│    handleAcceptCandidate(bookingId, driverName)                  │
│    → setAcceptingId(bookingId)                                   │
│    → toast.loading("Acceptation du candidat...")                 │
│    fetch(`/api/bookings/${bookingId}/accept`, { method: 'PATCH' })│
│    ┌────────────────────────────────────────────────────────┐   │
│    │  Backend (Transaction atomique):                       │   │
│    │  1. Vérifie Auth: requireAuth()                        │   │
│    │  2. Vérifie Ownership: isCompanyOwner()                │   │
│    │  3. Vérifie: booking.status === 'PENDING'              │   │
│    │  4. Vérifie: job.status === 'OPEN'                     │   │
│    │  ✓ Update booking: status = 'ASSIGNED'                │   │
│    │  ✓ Update job: status = 'ASSIGNED'                    │   │
│    │  ✓ Reject autres: status = 'REJECTED'                 │   │
│    └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
            SUCCÈS (200)              ERREUR (4xx/5xx)
                 │                         │
                 ▼                         ▼
┌─────────────────────────────┐ ┌────────────────────────┐
│ 6A. SUCCÈS                  │ │ 6B. ERREUR             │
│ toast.success([Nom] accepté)│ │ toast.error(...)       │
│ setIsOpen(false)            │ │ setAcceptingId(null)   │
│ router.refresh()            │ │ Utilisateur peut retry │
│ → Page se rafraîchit        │ └────────────────────────┘
│ → Badge "Attribuée"         │
│ → Bouton "Lancer mission"   │
└─────────────────────────────┘
```

## États des composants

### CancelMissionButton

```typescript
{
  isOpen: boolean,        // Dialog ouverte/fermée
  isLoading: boolean      // Requête en cours
}
```

**Transitions d'état:**
```
IDLE → OPEN (Dialog) → LOADING (API call) → SUCCESS/ERROR → IDLE
```

### ViewCandidatesButton

```typescript
{
  isOpen: boolean,               // Dialog ouverte/fermée
  candidates: Candidate[],       // Liste des candidats
  isLoading: boolean,            // Chargement initial
  acceptingId: string | null     // ID du candidat en cours d'acceptation
}
```

**Transitions d'état:**
```
IDLE → OPEN → LOADING (fetch) → LOADED →
  → ACCEPTING (un candidat) → SUCCESS/ERROR → CLOSED → IDLE
```

## Sécurité - Vérifications en cascade

### Pour annuler une mission

```
┌───────────────────────────────────────────────┐
│ Frontend (page.tsx)                           │
│ ✓ Vérifie userRole === 'owner'                │
│ ✓ Vérifie job.status === 'OPEN'               │
│ → Affiche CancelMissionButton                 │
└───────────────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────┐
│ Frontend (cancel-mission-button.tsx)          │
│ → Envoie requête PATCH                        │
└───────────────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────┐
│ Backend (/api/jobs/[id]/cancel)               │
│ ✓ requireRole('COMPANY') - vérifie session    │
│ ✓ user.company existe                         │
│ ✓ isCompanyOwner(user, job.companyId)         │
│ ✓ job.status in ['DRAFT', 'OPEN']             │
│ → Update job.status = 'CANCELLED'             │
└───────────────────────────────────────────────┘
```

### Pour accepter un candidat

```
┌───────────────────────────────────────────────┐
│ Frontend (page.tsx)                           │
│ ✓ Vérifie userRole === 'owner'                │
│ ✓ Vérifie job.status === 'OPEN'               │
│ ✓ Vérifie job.bookings.length > 0             │
│ → Affiche ViewCandidatesButton                │
└───────────────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────┐
│ Backend (/api/jobs/[id]/candidatures)         │
│ ✓ requireRole('COMPANY')                      │
│ ✓ user.company existe                         │
│ ✓ isCompanyOwner(user, job.companyId)         │
│ → Retourne liste des candidatures             │
└───────────────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────┐
│ Frontend (view-candidates-button.tsx)         │
│ → Affiche liste avec bouton "Accepter"        │
│ → Envoie requête PATCH pour accepter          │
└───────────────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────┐
│ Backend (/api/bookings/[id]/accept)           │
│ ✓ requireAuth() - session valide              │
│ ✓ isCompanyOwner(user, job.companyId)         │
│ ✓ booking.status === 'PENDING'                │
│ ✓ job.status === 'OPEN'                       │
│ → Transaction: ASSIGNED + REJECT autres       │
└───────────────────────────────────────────────┘
```

## Gestion des erreurs - Stratégies

### Erreurs réseau
```
fetch() → catch(NetworkError) →
  toast.error("Erreur de connexion") →
  État reste inchangé →
  Utilisateur peut retry
```

### Erreurs API (4xx)
```
response.ok === false →
  Extract error message →
  toast.error(specific message) →
  État revient à précédent →
  Utilisateur informé de l'action à prendre
```

### Erreurs de permission (403)
```
Backend: isCompanyOwner() fails →
  Return 403 →
  Frontend: toast.error("Non autorisé") →
  Suggère de rafraîchir ou se reconnecter
```

### Erreurs de statut (400)
```
Backend: Statut invalide →
  Return 400 with details →
  Frontend: toast.error(details) →
  Explique pourquoi l'action n'est pas possible
```

## Performance - Optimisations

### Lazy loading
- Les candidatures ne sont chargées que lors de l'ouverture de la modale
- `if (open && candidates.length === 0) { loadCandidates() }`

### Refresh ciblé
- Utilisation de `router.refresh()` pour recharger seulement la page actuelle
- Pas de rechargement complet de l'application

### États de chargement
- Spinner global pendant le fetch initial
- Spinner individuel sur chaque bouton d'action
- Désactivation de tous les boutons pendant une action

### Optimistic UI (potentiel futur)
- Pourrait afficher "Annulée" immédiatement avant la réponse API
- Rollback si erreur

## Diagramme de séquence - Acceptation candidat

```
Utilisateur    Component     API Route     Database
    |              |             |             |
    | Clic "Accepter"           |             |
    |─────────────>|             |             |
    |              | setAcceptingId            |
    |              | toast.loading             |
    |              |─────────────>|            |
    |              |   PATCH      |            |
    |              |              | requireAuth|
    |              |              | isOwner?   |
    |              |              |───────────>|
    |              |              |  findUnique|
    |              |              |<───────────|
    |              |              | Validation |
    |              |              |───────────>|
    |              |              | Transaction|
    |              |              | - Update booking
    |              |              | - Update job
    |              |              | - Reject others
    |              |              |<───────────|
    |              |<─────────────|            |
    |              |   200 OK     |            |
    |              | toast.success            |
    |              | router.refresh           |
    |<─────────────|             |             |
    | Page updated |             |             |
```

## Points d'amélioration futurs

1. **WebSocket pour notifications en temps réel**
   - Notifier les chauffeurs de l'annulation
   - Notifier du rejet automatique

2. **Optimistic UI**
   - Feedback immédiat sans attendre la réponse API

3. **Undo/Redo**
   - Possibilité d'annuler une annulation dans les 30 secondes
   - Nécessite un statut intermédiaire "CANCELLING"

4. **Batch operations**
   - Accepter/rejeter plusieurs candidats à la fois
   - Utile pour missions nécessitant plusieurs chauffeurs

5. **Historique d'actions**
   - Logger toutes les actions dans une table Audit
   - Traçabilité complète
