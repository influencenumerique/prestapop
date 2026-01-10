# Diagramme d'architecture - Authentification API

## Flux d'authentification général

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Frontend)                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTP Request + Cookie (session token)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API Route Handler                         │
│  (/api/jobs, /api/jobs/[id], /api/bookings, etc.)             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ 1. Appel requireAuth() ou requireRole()
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   /lib/api-auth/index.ts                        │
│                   (Helper d'authentification)                   │
├─────────────────────────────────────────────────────────────────┤
│  1. getAuthSession() → Récupère session via next-auth          │
│  2. getAuthenticatedUser() → Enrichit avec role + profils      │
│  3. Vérifie le rôle requis (COMPANY, DRIVER, ADMIN)            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
        ✅ Autorisé            ❌ Non autorisé
                │                       │
                │                       └──► 401/403 Error
                │
                └──► Continue vers la logique métier
```

---

## Matrice des permissions par route

```
╔══════════════════════════════╦═════════════╦═════════════╗
║         Route                ║   COMPANY   ║   DRIVER    ║
╠══════════════════════════════╬═════════════╬═════════════╣
║ GET  /api/jobs               ║      ✅     ║      ✅     ║
║ POST /api/jobs               ║      ✅     ║      ❌     ║
║ GET  /api/jobs/[id]          ║      ✅     ║      ✅     ║
║ PATCH /api/jobs/[id]         ║  ✅ (owner) ║      ❌     ║
║ DELETE /api/jobs/[id]        ║  ✅ (owner) ║      ❌     ║
║ POST /api/jobs/[id]/apply    ║      ❌     ║      ✅     ║
║ GET  /api/bookings           ║  ✅ (own)   ║  ✅ (own)   ║
║ GET  /api/bookings/[id]      ║  ✅ (owner) ║  ✅ (owner) ║
║ PATCH /api/bookings/[id]     ║  ✅ (owner) ║  ✅ (owner) ║
╚══════════════════════════════╩═════════════╩═════════════╝

Légende:
✅ Autorisé
❌ Interdit (403)
(owner) = Propriétaire de la ressource uniquement
(own) = Ses propres données uniquement
```

---

## Flux d'une requête POST /api/jobs (COMPANY)

```
┌──────────────────┐
│  Frontend        │
│  (Role: COMPANY) │
└────────┬─────────┘
         │
         │ POST /api/jobs + session token
         ▼
┌────────────────────────────────────────────┐
│  API Handler: POST /api/jobs              │
├────────────────────────────────────────────┤
│  1. const authResult = requireRole("COMPANY")
│     ↓
│     ├─ getAuthSession()
│     │  └─ NextAuth vérifie le token
│     │
│     ├─ getAuthenticatedUser(session)
│     │  └─ Prisma query User + include company
│     │
│     └─ hasRole(user, "COMPANY")
│        └─ user.role === "COMPANY" ?
│
│  2. if ("error" in authResult)
│     └─ return 401/403
│
│  3. const { user } = authResult
│
│  4. if (!user.company)
│     └─ return 400 "Profil incomplet"
│
│  5. Validation Zod du payload
│
│  6. Prisma: db.job.create({
│       companyId: user.company.id,
│       ...data
│     })
│
│  7. return NextResponse.json(job)
└────────────────────────────────────────────┘
```

---

## Flux d'une requête POST /api/jobs/[id]/apply (DRIVER)

```
┌──────────────────┐
│  Frontend        │
│  (Role: DRIVER)  │
└────────┬─────────┘
         │
         │ POST /api/jobs/{jobId}/apply + session token
         ▼
┌────────────────────────────────────────────┐
│  API Handler: POST /api/jobs/[id]/apply   │
├────────────────────────────────────────────┤
│  1. const authResult = requireRole("DRIVER")
│     ↓
│     ├─ getAuthSession()
│     ├─ getAuthenticatedUser(session)
│     └─ hasRole(user, "DRIVER")
│
│  2. if ("error" in authResult)
│     └─ return 401/403
│
│  3. const { user } = authResult
│
│  4. if (!user.driverProfile)
│     └─ return 400 "Profil incomplet"
│
│  5. if (!user.driverProfile.isAvailable)
│     └─ return 400 "Non disponible"
│
│  6. const job = db.job.findUnique({
│       where: { id: jobId }
│     })
│
│  7. if (job.status !== "OPEN")
│     └─ return 400 "Mission fermée"
│
│  8. Vérifier candidature existante
│     └─ if exists: return 400 "Déjà postulé"
│
│  9. db.booking.create({
│       jobId,
│       driverId: user.driverProfile.id,
│       status: "ASSIGNED"
│     })
│
│  10. return NextResponse.json(booking)
└────────────────────────────────────────────┘
```

---

## Flux d'une requête PATCH /api/jobs/[id] (COMPANY owner)

```
┌──────────────────┐
│  Frontend        │
│  (Role: COMPANY) │
└────────┬─────────┘
         │
         │ PATCH /api/jobs/{jobId} + session token
         ▼
┌────────────────────────────────────────────┐
│  API Handler: PATCH /api/jobs/[id]        │
├────────────────────────────────────────────┤
│  1. const authResult = requireRole("COMPANY")
│     └─ Vérifie Role.COMPANY
│
│  2. if ("error" in authResult)
│     └─ return 401/403
│
│  3. const { user } = authResult
│
│  4. const job = db.job.findUnique({
│       where: { id: jobId },
│       include: { company: true }
│     })
│
│  5. if (!job)
│     └─ return 404 "Mission non trouvée"
│
│  6. if (!isCompanyOwner(user, job.companyId))
│     └─ return 403 "Non propriétaire"
│        ↓
│        user.role === "COMPANY" &&
│        user.company?.id === companyId
│
│  7. Validation Zod du payload
│
│  8. db.job.update({
│       where: { id: jobId },
│       data: validatedData
│     })
│
│  9. return NextResponse.json(updatedJob)
└────────────────────────────────────────────┘
```

---

## Flux d'une requête GET /api/bookings (rôle-based filtering)

```
┌──────────────────┐
│  Frontend        │
│  (Any role)      │
└────────┬─────────┘
         │
         │ GET /api/bookings?status=ASSIGNED
         ▼
┌────────────────────────────────────────────┐
│  API Handler: GET /api/bookings           │
├────────────────────────────────────────────┤
│  1. const authResult = requireAuth()
│     └─ Vérifie authentification de base
│
│  2. if ("error" in authResult)
│     └─ return 401
│
│  3. const { user } = authResult
│
│  4. Filtre selon user.role:
│     ↓
│     ├─ if (user.role === "DRIVER")
│     │  └─ where: { driverId: user.driverProfile.id }
│     │
│     └─ if (user.role === "COMPANY")
│        └─ where: { job: { companyId: user.company.id } }
│
│  5. db.booking.findMany({
│       where: roleBasedFilter,
│       include: { job, driver/company, review }
│     })
│
│  6. return NextResponse.json({ bookings })
└────────────────────────────────────────────┘
```

---

## Architecture des helpers d'authentification

```
┌─────────────────────────────────────────────────────────┐
│                /lib/api-auth/index.ts                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌────────────────────────────────────────────┐        │
│  │  getAuthSession()                          │        │
│  │  └─ auth() from NextAuth                   │        │
│  │     └─ Retourne Session | null             │        │
│  └────────────────────────────────────────────┘        │
│                        ↓                                │
│  ┌────────────────────────────────────────────┐        │
│  │  getAuthenticatedUser(session)             │        │
│  │  └─ db.user.findUnique({                   │        │
│  │       include: { company, driverProfile }  │        │
│  │     })                                      │        │
│  │  └─ Retourne AuthenticatedUser enrichi     │        │
│  └────────────────────────────────────────────┘        │
│                        ↓                                │
│  ┌────────────────────────────────────────────┐        │
│  │  requireAuth()                             │        │
│  │  └─ Combine getAuthSession() +             │        │
│  │     getAuthenticatedUser()                 │        │
│  │  └─ Retourne { user } ou { error }         │        │
│  └────────────────────────────────────────────┘        │
│                        ↓                                │
│  ┌────────────────────────────────────────────┐        │
│  │  requireRole(role)                         │        │
│  │  └─ requireAuth() +                        │        │
│  │     hasRole(user, role)                    │        │
│  │  └─ Retourne { user } ou { error }         │        │
│  └────────────────────────────────────────────┘        │
│                        ↓                                │
│  ┌────────────────────────────────────────────┐        │
│  │  Helpers utilitaires                       │        │
│  │  ├─ isCompanyOwner(user, companyId)        │        │
│  │  ├─ isDriver(user, driverId)               │        │
│  │  └─ hasAnyRole(user, roles[])              │        │
│  └────────────────────────────────────────────┘        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Codes de retour HTTP par scénario

```
╔════════════════════════════════════╦═══════╦════════════════════════════════╗
║          Scénario                  ║ Code  ║         Message                ║
╠════════════════════════════════════╬═══════╬════════════════════════════════╣
║ Pas de session                     ║  401  ║ "Non authentifié..."           ║
║ Token invalide/expiré              ║  401  ║ "Non authentifié..."           ║
║ Mauvais rôle                       ║  403  ║ "Accès réservé aux..."         ║
║ Non propriétaire                   ║  403  ║ "Non autorisé à modifier..."   ║
║ Ressource introuvable              ║  404  ║ "Mission non trouvée"          ║
║ Validation Zod échoue              ║  400  ║ "Données invalides"            ║
║ Driver non disponible              ║  400  ║ "Pas disponible actuellement"  ║
║ Candidature en doublon             ║  400  ║ "Déjà postulé"                 ║
║ Mission fermée                     ║  400  ║ "Mission plus disponible"      ║
║ Profil incomplet                   ║  400  ║ "Profil non trouvé"            ║
║ Succès                             ║  200  ║ { data }                       ║
║ Erreur serveur                     ║  500  ║ "Erreur lors de..."            ║
╚════════════════════════════════════╩═══════╩════════════════════════════════╝
```

---

## Séquence de vérifications (ordre d'exécution)

```
Requête entrante
       ↓
1. ✅ Session existe ?
   └─ ❌ → 401 "Non authentifié"
       ↓
2. ✅ User existe dans DB ?
   └─ ❌ → 404 "Utilisateur non trouvé"
       ↓
3. ✅ Rôle correct ?
   └─ ❌ → 403 "Accès réservé aux..."
       ↓
4. ✅ Profil (Company/Driver) existe ?
   └─ ❌ → 400 "Profil non trouvé"
       ↓
5. ✅ Ressource existe ?
   └─ ❌ → 404 "Ressource non trouvée"
       ↓
6. ✅ Propriétaire de la ressource ?
   └─ ❌ → 403 "Non autorisé"
       ↓
7. ✅ Validation métier (isAvailable, status, etc.) ?
   └─ ❌ → 400 "Erreur métier"
       ↓
8. ✅ Validation Zod du payload ?
   └─ ❌ → 400 "Données invalides"
       ↓
9. ✅ Opération DB réussie ?
   └─ ❌ → 500 "Erreur serveur"
       ↓
10. ✅ 200 OK + données
```

---

## Diagramme de dépendances

```
API Routes
    │
    ├── /api/jobs/route.ts
    │   └── requireAuth(), requireRole("COMPANY")
    │
    ├── /api/jobs/[id]/route.ts
    │   └── requireAuth(), requireRole("COMPANY"), isCompanyOwner()
    │
    ├── /api/jobs/[id]/apply/route.ts
    │   └── requireRole("DRIVER")
    │
    ├── /api/bookings/route.ts
    │   └── requireAuth()
    │
    └── /api/bookings/[id]/route.ts
        └── requireAuth(), isDriver(), isCompanyOwner()
                    │
                    ▼
        ┌────────────────────────┐
        │  /lib/api-auth/        │
        │                        │
        │  - requireAuth()       │
        │  - requireRole()       │
        │  - isCompanyOwner()    │
        │  - isDriver()          │
        └────────┬───────────────┘
                 │
                 ├── NextAuth (/lib/auth.ts)
                 │   └── auth()
                 │
                 └── Prisma (/lib/db.ts)
                     └── db.user.findUnique()
```

---

## Évolution future suggérée

```
Phase Actuelle (API_JOBS)
    └── Authentification basée sur les rôles
         └── Role.COMPANY vs Role.DRIVER
              └── Vérification ownership

Phase Suivante (suggérée)
    ├── Rate Limiting
    │   └── Limiter les requêtes par utilisateur/IP
    │
    ├── Audit Logging
    │   └── Logger toutes les actions sensibles
    │
    ├── Webhooks
    │   └── Notifier sur événements (nouvelle candidature, etc.)
    │
    ├── Permissions granulaires
    │   └── Au-delà des rôles: permissions spécifiques
    │       (ex: "jobs.create", "jobs.delete", etc.)
    │
    └── API Versioning
        └── /api/v1/jobs, /api/v2/jobs
```
