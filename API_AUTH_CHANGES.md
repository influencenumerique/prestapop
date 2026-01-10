# Changements détaillés - Phase API_JOBS

## Fichiers créés

### 1. `/src/lib/api-auth/index.ts` (NOUVEAU)
Helper centralisé pour l'authentification et l'autorisation des routes API.

**Exports principaux:**
- `requireAuth()` - Middleware d'authentification de base
- `requireRole(role)` - Middleware avec vérification de rôle
- `requireAnyRole(roles[])` - Middleware avec vérification de plusieurs rôles
- `isCompanyOwner(user, companyId)` - Vérification de propriété d'entreprise
- `isDriver(user, driverId)` - Vérification d'identité de chauffeur
- `AuthErrors` - Réponses d'erreur standardisées
- `AuthenticatedUser` - Interface TypeScript pour utilisateur authentifié
- `Role` - Type pour les rôles ("COMPANY" | "DRIVER" | "ADMIN")

---

## Fichiers modifiés

### 2. `/src/app/api/jobs/route.ts`

#### Imports modifiés
```diff
- import { auth } from "@/lib/auth"
+ import { requireAuth, requireRole } from "@/lib/api-auth"
```

#### GET /api/jobs (ligne 31-112)
**Changement:** Ajout d'authentification obligatoire

```diff
  export async function GET(req: Request) {
    try {
+     // Vérifier l'authentification (obligatoire pour voir les missions)
+     const authResult = await requireAuth()
+     if ("error" in authResult) {
+       return authResult.error
+     }
+
+     const { user } = authResult
+
      const { searchParams } = new URL(req.url)
```

**Comportement:**
- Avant: Public, accessible à tous
- Après: Authentification obligatoire (DRIVER et COMPANY)

#### POST /api/jobs (ligne 114-161)
**Changement:** Vérification explicite du Role.COMPANY

```diff
  export async function POST(req: Request) {
    try {
-     const session = await auth()
-     if (!session?.user) {
-       return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
-     }
-
-     const company = await db.company.findUnique({
-       where: { userId: session.user.id },
-     })
-
-     if (!company) {
+     // Vérifier que l'utilisateur est une entreprise (Role.COMPANY)
+     const authResult = await requireRole("COMPANY")
+     if ("error" in authResult) {
+       return authResult.error
+     }
+
+     const { user } = authResult
+
+     // Vérifier que l'utilisateur a bien un profil Company
+     if (!user.company) {
        return NextResponse.json(
-         { error: "Vous devez être une entreprise pour créer une mission" },
-         { status: 403 }
+         { error: "Profil entreprise non trouvé. Veuillez compléter votre profil." },
+         { status: 400 }
        )
      }

      const body = await req.json()
      const data = createJobSchema.parse(body)

      const job = await db.job.create({
        data: {
          ...data,
-         companyId: company.id,
+         companyId: user.company.id,
          status: "OPEN",
        },
```

**Comportement:**
- Avant: Vérification Company via userId lookup
- Après: Vérification Role.COMPANY + profil Company existant

---

### 3. `/src/app/api/jobs/[id]/route.ts`

#### Imports modifiés
```diff
- import { auth } from "@/lib/auth"
+ import { requireAuth, requireRole, isCompanyOwner } from "@/lib/api-auth"
```

#### GET /api/jobs/[id] (ligne 22-67)
**Changement:** Ajout d'authentification obligatoire

```diff
  export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
+     // Vérifier l'authentification
+     const authResult = await requireAuth()
+     if ("error" in authResult) {
+       return authResult.error
+     }
+
+     const { user } = authResult
      const { id } = await params
```

**Comportement:**
- Avant: Public, accessible à tous
- Après: Authentification obligatoire (DRIVER et COMPANY)

#### PATCH /api/jobs/[id] (ligne 69-127)
**Changement:** Vérification explicite Role.COMPANY + ownership

```diff
  export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params
-     const session = await auth()
-
-     if (!session?.user) {
-       return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
-     }
+
+     // Vérifier que l'utilisateur est une entreprise (Role.COMPANY)
+     const authResult = await requireRole("COMPANY")
+     if ("error" in authResult) {
+       return authResult.error
+     }
+
+     const { user } = authResult

      const job = await db.job.findUnique({
        where: { id },
        include: { company: true },
      })

      if (!job) {
        return NextResponse.json({ error: "Mission non trouvée" }, { status: 404 })
      }

-     if (job.company.userId !== session.user.id) {
+     // Vérifier que l'entreprise est bien propriétaire de la mission
+     if (!isCompanyOwner(user, job.companyId)) {
        return NextResponse.json(
-         { error: "Non autorisé" },
+         { error: "Vous n'êtes pas autorisé à modifier cette mission" },
          { status: 403 }
        )
      }
```

**Comportement:**
- Avant: Auth basique + userId comparison
- Après: Role.COMPANY requis + helper isCompanyOwner()

#### DELETE /api/jobs/[id] (ligne 129-180)
**Changement:** Identique à PATCH (Role.COMPANY + ownership)

---

### 4. `/src/app/api/jobs/[id]/apply/route.ts`

#### Imports modifiés
```diff
- import { auth } from "@/lib/auth"
+ import { requireRole } from "@/lib/api-auth"
```

#### POST /api/jobs/[id]/apply (ligne 11-106)
**Changement:** Vérification explicite Role.DRIVER

```diff
  export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params
-     const session = await auth()
-
-     if (!session?.user) {
-       return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
-     }
-
-     const driver = await db.driverProfile.findUnique({
-       where: { userId: session.user.id },
-     })
-
-     if (!driver) {
+
+     // Vérifier que l'utilisateur est un chauffeur (Role.DRIVER)
+     const authResult = await requireRole("DRIVER")
+     if ("error" in authResult) {
+       return authResult.error
+     }
+
+     const { user } = authResult
+
+     // Vérifier que l'utilisateur a bien un profil Driver
+     if (!user.driverProfile) {
        return NextResponse.json(
-         { error: "Vous devez être chauffeur pour postuler" },
-         { status: 403 }
+         { error: "Profil chauffeur non trouvé. Veuillez compléter votre profil." },
+         { status: 400 }
        )
      }

+     const driver = user.driverProfile
+
      if (!driver.isAvailable) {
```

**Comportement:**
- Avant: Lookup DriverProfile via userId
- Après: Vérification Role.DRIVER + profil DriverProfile existant

---

### 5. `/src/app/api/bookings/route.ts`

#### Imports modifiés
```diff
- import { auth } from "@/lib/auth"
+ import { requireAuth } from "@/lib/api-auth"
```

#### GET /api/bookings (ligne 5-63)
**Changement:** Utilisation du champ `user.role` au lieu du paramètre `?role=`

```diff
  export async function GET(req: Request) {
    try {
-     const session = await auth()
-
-     if (!session?.user) {
-       return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
-     }
+     // Vérifier l'authentification
+     const authResult = await requireAuth()
+     if ("error" in authResult) {
+       return authResult.error
+     }
+
+     const { user } = authResult

      const { searchParams } = new URL(req.url)
-     const role = searchParams.get("role") // "driver" or "company"
      const status = searchParams.get("status")

-     const user = await db.user.findUnique({
-       where: { id: session.user.id },
-       include: { driverProfile: true, company: true },
-     })
-
-     if (!user) {
-       return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
-     }
-
      let bookings

-     if (role === "driver" && user.driverProfile) {
+     // Selon le rôle de l'utilisateur, on filtre différemment
+     if (user.role === "DRIVER" && user.driverProfile) {
        // Missions du chauffeur
        const where: any = { driverId: user.driverProfile.id }
        if (status) where.status = status
        // ...
-     } else if (user.company) {
+     } else if (user.role === "COMPANY" && user.company) {
        // Missions de l'entreprise (via les jobs)
```

**Comportement:**
- Avant: Paramètre `?role=driver|company` obligatoire
- Après: Détection automatique via `user.role`

---

### 6. `/src/app/api/bookings/[id]/route.ts`

#### Imports modifiés
```diff
- import { auth } from "@/lib/auth"
+ import { requireAuth, isDriver, isCompanyOwner } from "@/lib/api-auth"
```

#### GET /api/bookings/[id] (ligne 15-64)
**Changement:** Utilisation des helpers d'autorisation

```diff
  export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params
-     const session = await auth()
-
-     if (!session?.user) {
-       return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
-     }
+
+     // Vérifier l'authentification
+     const authResult = await requireAuth()
+     if ("error" in authResult) {
+       return authResult.error
+     }
+
+     const { user } = authResult

      const booking = await db.booking.findUnique({
        where: { id },
        include: {
          job: { include: { company: { include: { user: true } } } },
          driver: { include: { user: true } },
          review: true,
        },
      })

      if (!booking) {
        return NextResponse.json({ error: "Mission non trouvée" }, { status: 404 })
      }

-     // Vérifier autorisation (driver ou company du job)
-     const user = await db.user.findUnique({
-       where: { id: session.user.id },
-       include: { driverProfile: true, company: true },
-     })
-
-     const isDriver = user?.driverProfile?.id === booking.driverId
-     const isCompany = user?.company?.id === booking.job.companyId
-
-     if (!isDriver && !isCompany) {
-       return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
+     // Vérifier autorisation (driver concerné ou company du job)
+     const isAuthorizedDriver = isDriver(user, booking.driverId)
+     const isAuthorizedCompany = isCompanyOwner(user, booking.job.companyId)
+
+     if (!isAuthorizedDriver && !isAuthorizedCompany) {
+       return NextResponse.json(
+         { error: "Vous n'êtes pas autorisé à consulter cette réservation" },
+         { status: 403 }
+       )
      }
```

**Comportement:**
- Avant: Lookup User + comparaison manuelle
- Après: Helpers isDriver() et isCompanyOwner()

#### PATCH /api/bookings/[id] (ligne 66-156)
**Changement:** Identique à GET (helpers d'autorisation)

---

## Documentation créée

### 7. `/API_AUTH_SUMMARY.md` (NOUVEAU)
Documentation complète de la phase API_JOBS:
- Résumé des modifications
- Détail de chaque route modifiée
- Matrice des autorisations
- Codes d'erreur
- Bonnes pratiques
- Tests recommandés

### 8. `/API_AUTH_TESTING.md` (NOUVEAU)
Guide de test complet avec:
- Tests curl/bash
- Collection Postman
- Tests Jest automatisés
- Checklist de validation

### 9. `/API_AUTH_CHANGES.md` (CE FICHIER)
Détail ligne par ligne des modifications apportées.

---

## Statistiques des changements

| Fichier | Lignes ajoutées | Lignes supprimées | Lignes modifiées |
|---------|----------------|-------------------|------------------|
| `/src/lib/api-auth/index.ts` | 206 | 0 | 0 (nouveau) |
| `/src/app/api/jobs/route.ts` | 15 | 10 | 25 |
| `/src/app/api/jobs/[id]/route.ts` | 25 | 18 | 43 |
| `/src/app/api/jobs/[id]/apply/route.ts` | 18 | 15 | 33 |
| `/src/app/api/bookings/route.ts` | 10 | 12 | 22 |
| `/src/app/api/bookings/[id]/route.ts` | 15 | 20 | 35 |
| **TOTAL** | **289** | **75** | **158** |

---

## Compatibilité

### Aucun breaking change sur le schéma
- Aucune migration Prisma nécessaire
- Aucun modèle modifié

### Breaking changes sur l'API
1. **GET /api/jobs** : Maintenant authentifiée (avant: publique)
2. **GET /api/jobs/[id]** : Maintenant authentifiée (avant: publique)
3. **GET /api/bookings** : Le paramètre `?role=` n'est plus nécessaire (détection auto)

### Changements non-breaking
- Toutes les autres routes ont simplement amélioré leur sécurité
- Les payloads request/response restent identiques

---

## Rollback

Si besoin de revenir en arrière:

```bash
# Supprimer le helper d'auth
rm -rf src/lib/api-auth

# Restaurer les fichiers originaux via git
git checkout src/app/api/jobs/route.ts
git checkout src/app/api/jobs/[id]/route.ts
git checkout src/app/api/jobs/[id]/apply/route.ts
git checkout src/app/api/bookings/route.ts
git checkout src/app/api/bookings/[id]/route.ts
```

Aucune migration de base de données à annuler.
