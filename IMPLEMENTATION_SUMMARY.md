# Résumé des modifications - Système d'inscription et documents

## Problème résolu
Fix du bug d'inscription et implémentation du système de documents KBIS avant première mission (au lieu de l'inscription).

## Modifications effectuées

### 1. Pages d'onboarding (Checkboxes fonctionnelles)

#### `/Users/malik/Desktop/prestapop/src/app/onboarding/driver/page.tsx`
- Retiré l'obligation d'uploader le KBIS lors de l'onboarding
- Gardé les checkboxes CGU, commission, paiement, véhicule
- Les checkboxes utilisent le composant `@radix-ui/react-checkbox` (déjà installé)
- Bouton "Accéder au tableau de bord" activé uniquement si toutes les cases sont cochées

#### `/Users/malik/Desktop/prestapop/src/app/onboarding/company/page.tsx`
- Retiré l'obligation d'uploader le KBIS lors de l'onboarding
- Gardé les checkboxes CGU et délai de validation
- Même logique de validation

### 2. API Routes créées

#### `/Users/malik/Desktop/prestapop/src/app/api/driver/onboarding/route.ts`
- Crée le profil chauffeur avec phone, city, region
- Valide les acceptations de conditions
- Met à jour le rôle utilisateur à DRIVER

#### `/Users/malik/Desktop/prestapop/src/app/api/company/onboarding/route.ts`
- Crée le profil entreprise avec companyName, SIRET, phone, address, city
- Valide le format SIRET (14 chiffres)
- Met à jour le rôle utilisateur à COMPANY

#### `/Users/malik/Desktop/prestapop/src/app/api/upload/kbis/route.ts`
- Upload des fichiers KBIS (PDF, JPG, PNG max 5MB)
- Stockage dans `/public/uploads/kbis/`
- Validation du type et taille de fichier

#### `/Users/malik/Desktop/prestapop/src/app/api/driver/update-kbis/route.ts`
#### `/Users/malik/Desktop/prestapop/src/app/api/company/update-kbis/route.ts`
- Routes pour mettre à jour l'URL du KBIS dans les profils
- Contiennent du code commenté prêt à être activé après migration du schéma

### 3. Composants UI créés

#### `/Users/malik/Desktop/prestapop/src/components/ui/dialog.tsx`
- Composant Dialog de Radix UI
- Utilisé pour les modals KBIS

#### `/Users/malik/Desktop/prestapop/src/components/kbis-upload-modal.tsx`
- Modal réutilisable pour l'upload du KBIS
- Gère l'upload, la validation, les états de succès/erreur
- Messages adaptés selon le type d'utilisateur (driver/company)

#### `/Users/malik/Desktop/prestapop/src/components/protected-action-button.tsx`
- Bouton qui bloque les actions si KBIS non uploadé/vérifié
- Affiche le modal KBIS automatiquement si besoin
- Affiche un message "Vérification en cours" si KBIS uploadé mais pas vérifié

#### `/Users/malik/Desktop/prestapop/src/components/dashboard-driver.tsx`
- Dashboard chauffeur avec alerte KBIS si manquant
- Boutons protégés pour "Trouver une mission"

#### `/Users/malik/Desktop/prestapop/src/components/dashboard-company.tsx`
- Dashboard entreprise avec alerte KBIS si manquant
- Boutons protégés pour "Publier nouvelle mission"

### 4. Dashboard modifié

#### `/Users/malik/Desktop/prestapop/src/app/dashboard/page.tsx`
- Utilise les nouveaux composants DriverDashboard et CompanyDashboard
- Variables `hasKbis` et `kbisVerified` temporairement à `false`
- À remplacer par les vraies valeurs depuis la DB après migration

### 5. Documentation créée

#### `/Users/malik/Desktop/prestapop/KBIS_SCHEMA_TODO.md`
- Documente les champs à ajouter au schéma Prisma
- SQL de migration fourni
- Règles métier expliquées

## Flow utilisateur final

### Inscription Chauffeur
1. Register page → Choisir "Chauffeur"
2. Formulaire nom/email/password → Créer compte
3. Onboarding → Cases à cocher + infos (phone, city, region)
4. Redirection → Dashboard
5. **Première tentative de postuler** → Modal KBIS s'affiche
6. Upload KBIS → "Vérification en cours"
7. Admin valide → Peut postuler aux missions

### Inscription Entreprise
1. Register page → Choisir "Entreprise"
2. Formulaire nom/email/password → Créer compte
3. Onboarding → Cases à cocher + infos (companyName, SIRET, phone, address)
4. Redirection → Dashboard
5. **Première tentative de publier** → Modal KBIS s'affiche
6. Upload KBIS → "Vérification en cours"
7. Admin valide → Peut publier des missions

## À faire pour finaliser

### Migration Prisma (URGENT)
```bash
# 1. Modifier prisma/schema.prisma selon KBIS_SCHEMA_TODO.md
# 2. Générer la migration
npx prisma migrate dev --name add_kbis_fields

# 3. Appliquer en production
npx prisma migrate deploy
```

### Après migration
1. Dans `/Users/malik/Desktop/prestapop/src/app/dashboard/page.tsx` :
   - Remplacer `const hasKbis = false` par la vraie valeur depuis `user.driverProfile.kbisUrl` ou `user.company.kbisUrl`
   - Remplacer `const kbisVerified = false` par `user.driverProfile.kbisVerified` ou `user.company.kbisVerified`

2. Décommenter le code dans :
   - `/Users/malik/Desktop/prestapop/src/app/api/driver/update-kbis/route.ts`
   - `/Users/malik/Desktop/prestapop/src/app/api/company/update-kbis/route.ts`

### Panneau Admin (optionnel)
Créer une interface admin pour :
- Voir les KBIS uploadés
- Valider/refuser les documents
- Vérifier la date du KBIS (< 3 mois)

## Tests à effectuer

1. Inscription chauffeur → Onboarding → Dashboard
2. Inscription entreprise → Onboarding → Dashboard
3. Clic sur "Trouver une mission" sans KBIS → Modal s'affiche
4. Upload KBIS → Message de succès
5. Clic sur "Publier mission" sans KBIS → Modal s'affiche

## Notes importantes

- Les cases à cocher utilisent `@radix-ui/react-checkbox` (déjà installé)
- Le système fonctionne même sans les champs KBIS en DB (logs console)
- Les fichiers KBIS sont stockés dans `/public/uploads/kbis/`
- Format SIRET validé (14 chiffres)
- Taille max fichier : 5MB
- Formats acceptés : PDF, JPG, PNG
