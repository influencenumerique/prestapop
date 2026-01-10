# Authentification API - Guide rapide

## Utilisation des helpers

```typescript
import { requireAuth, requireRole, isCompanyOwner } from "@/lib/api-auth"

// Authentification de base
const authResult = await requireAuth()
if ("error" in authResult) return authResult.error
const { user } = authResult

// Rôle spécifique
const authResult = await requireRole("COMPANY")
if ("error" in authResult) return authResult.error
const { user } = authResult

// Vérifier ownership
if (!isCompanyOwner(user, companyId)) {
  return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
}
```

## Routes sécurisées

| Route | Role | Ownership |
|-------|------|-----------|
| GET /api/jobs | ANY | - |
| POST /api/jobs | COMPANY | - |
| PATCH /api/jobs/[id] | COMPANY | ✓ |
| DELETE /api/jobs/[id] | COMPANY | ✓ |
| POST /api/jobs/[id]/apply | DRIVER | - |
| GET /api/bookings | ANY | auto |
| GET /api/bookings/[id] | ANY | ✓ |
| PATCH /api/bookings/[id] | ANY | ✓ |

## Codes HTTP

- **200** Succès
- **400** Validation échouée
- **401** Non authentifié
- **403** Non autorisé (mauvais rôle ou ownership)
- **404** Ressource introuvable
- **500** Erreur serveur

## Documentation complète

- `API_AUTH_SUMMARY.md` - Vue d'ensemble
- `API_AUTH_TESTING.md` - Guide de test
- `API_AUTH_CHANGES.md` - Détail des modifications
- `API_AUTH_DIAGRAM.md` - Architecture
- `PHASE_API_JOBS_AUTH_COMPLETE.md` - Récapitulatif

## Tests rapides

```bash
# Authentifié
curl http://localhost:3000/api/jobs \
  -H "Cookie: next-auth.session-token=TOKEN"

# Company crée mission
curl -X POST http://localhost:3000/api/jobs \
  -H "Cookie: next-auth.session-token=COMPANY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test",...}'

# Driver postule
curl -X POST http://localhost:3000/api/jobs/ID/apply \
  -H "Cookie: next-auth.session-token=DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Disponible"}'
```

## Fichiers modifiés

```
src/
├── lib/
│   └── api-auth/
│       └── index.ts              (NOUVEAU - 221 lignes)
└── app/
    └── api/
        ├── jobs/
        │   ├── route.ts          (modifié - auth ajoutée)
        │   └── [id]/
        │       ├── route.ts      (modifié - auth ajoutée)
        │       └── apply/
        │           └── route.ts  (modifié - auth ajoutée)
        └── bookings/
            ├── route.ts          (modifié - auth ajoutée)
            └── [id]/
                └── route.ts      (modifié - auth ajoutée)
```

## Statut

✅ Phase complétée - Prêt pour production
