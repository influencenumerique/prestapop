# Flow d'inscription et gestion des documents KBIS

## Vue d'ensemble

Le système sépare clairement l'inscription (rapide) de la vérification des documents (avant première action).

## Architecture

```
┌─────────────────┐
│ Register Page   │  → Choix driver/company + Email/Password
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Onboarding Page │  → Cases à cocher + Infos de base (NO KBIS)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Dashboard      │  → Alerte si pas de KBIS
└────────┬────────┘
         │
         │ (Première action)
         ▼
┌─────────────────┐
│  Modal KBIS     │  → Upload document (PDF/JPG/PNG)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Verification   │  → Admin valide sous 24h
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Accès complet  │  → Peut postuler/publier
└─────────────────┘
```

## Détail des étapes

### 1. Register (`/register`)

**Fichier :** `/Users/malik/Desktop/prestapop/src/app/register/page.tsx`

**Actions :**
- Sélection du type de compte (Driver ou Company)
- Formulaire : nom, email, password
- Appel à `/api/auth/register` (NextAuth)
- Redirection vers `/onboarding/driver` ou `/onboarding/company`

**Pas de KBIS demandé ici.**

---

### 2. Onboarding

#### Chauffeur (`/onboarding/driver`)

**Fichier :** `/Users/malik/Desktop/prestapop/src/app/onboarding/driver/page.tsx`

**Informations collectées :**
- Téléphone
- Ville
- Région

**Cases à cocher :**
- [ ] CGU + politique no-show
- [ ] Commission 15%
- [ ] Modalités de paiement (48h)
- [ ] Véhicule assuré

**Validation :**
- Toutes les cases doivent être cochées
- Bouton "Accéder au tableau de bord" activé seulement si tout est validé

**API appelée :** `POST /api/driver/onboarding`

**Pas de KBIS demandé ici.**

---

#### Entreprise (`/onboarding/company`)

**Fichier :** `/Users/malik/Desktop/prestapop/src/app/onboarding/company/page.tsx`

**Informations collectées :**
- Nom de l'entreprise
- SIRET (14 chiffres)
- Téléphone
- Adresse
- Ville
- Description (optionnel)

**Cases à cocher :**
- [ ] CGU + politique litiges
- [ ] Délai de validation 48h

**Validation :**
- Toutes les cases doivent être cochées
- Format SIRET validé (14 chiffres)
- Bouton "Accéder au tableau de bord" activé seulement si tout est validé

**API appelée :** `POST /api/company/onboarding`

**Pas de KBIS demandé ici.**

---

### 3. Dashboard (`/dashboard`)

**Fichier :** `/Users/malik/Desktop/prestapop/src/app/dashboard/page.tsx`

**Affichage selon le rôle :**

#### Dashboard Chauffeur
**Composant :** `/Users/malik/Desktop/prestapop/src/components/dashboard-driver.tsx`

**Si pas de KBIS uploadé :**
- Alerte jaune en haut : "Document requis pour postuler"
- Bouton "Télécharger mon KBIS"
- Boutons d'action protégés : "Trouver une mission"

**Comportement :**
- Clic sur "Trouver une mission" → Modal KBIS s'affiche
- Clic sur "Télécharger mon KBIS" → Modal KBIS s'affiche

---

#### Dashboard Entreprise
**Composant :** `/Users/malik/Desktop/prestapop/src/components/dashboard-company.tsx`

**Si pas de KBIS uploadé :**
- Alerte jaune en haut : "Document requis pour publier"
- Bouton "Télécharger mon KBIS"
- Boutons d'action protégés : "Publier nouvelle mission"

**Comportement :**
- Clic sur "Publier mission" → Modal KBIS s'affiche
- Clic sur "Télécharger mon KBIS" → Modal KBIS s'affiche

---

### 4. Modal KBIS

**Composant :** `/Users/malik/Desktop/prestapop/src/components/kbis-upload-modal.tsx`

**Interface :**
```
┌──────────────────────────────────────┐
│ Document requis                  [X] │
│                                      │
│ Pour [action], veuillez télécharger  │
│ votre KBIS [type] (moins de 3 mois)  │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ Choisir un fichier...          │  │
│ └────────────────────────────────┘  │
│ Format: PDF, JPG, PNG (max 5MB)     │
│                                      │
│ ⓘ Important: Votre KBIS doit avoir  │
│   moins de 3 mois. Documents plus    │
│   anciens seront refusés.            │
│                                      │
│ [Plus tard]           [Envoyer]     │
└──────────────────────────────────────┘
```

**Actions :**
1. Sélection du fichier → Validation locale (type + taille)
2. Clic sur "Envoyer" :
   - Upload vers `/api/upload/kbis` → Sauvegarde fichier + retourne URL
   - Mise à jour profil via `/api/driver/update-kbis` ou `/api/company/update-kbis`
   - Message de succès : "Documents reçus, validation sous 24h"

**États :**
- Loading : Envoi en cours
- Success : Documents reçus
- Error : Erreur upload (format, taille, serveur)

---

### 5. Composant ProtectedActionButton

**Fichier :** `/Users/malik/Desktop/prestapop/src/components/protected-action-button.tsx`

**Logique :**

```javascript
handleClick() {
  if (!hasKbis) {
    // Pas de KBIS → Afficher modal
    showKbisModal = true
  } else if (!kbisVerified) {
    // KBIS uploadé mais pas vérifié → Message temporaire
    showMessage("Vérification en cours")
  } else {
    // KBIS vérifié → Action normale
    executeAction()
  }
}
```

**Message "Vérification en cours" :**
```
┌──────────────────────────────────────┐
│ ⚠️ Vérification en cours             │
│                                      │
│ Votre KBIS est en cours de           │
│ vérification. Vous pourrez [action]  │
│ dès validation (sous 24h).           │
└──────────────────────────────────────┘
```

---

## API Routes

### `/api/auth/register` (POST)
Crée le compte utilisateur (déjà existant, non modifié).

### `/api/driver/onboarding` (POST)
**Input :**
```json
{
  "phone": "06 12 34 56 78",
  "city": "Paris",
  "region": "Île-de-France",
  "acceptedTerms": true,
  "acceptedCommission": true,
  "acceptedPaymentTerms": true
}
```

**Actions :**
- Vérifie authentification
- Crée le `DriverProfile`
- Met à jour `user.role` = "DRIVER"

### `/api/company/onboarding` (POST)
**Input :**
```json
{
  "companyName": "Transport Express",
  "siret": "12345678900010",
  "phone": "01 23 45 67 89",
  "address": "123 rue de la République",
  "city": "Paris",
  "description": "...",
  "acceptedTerms": true,
  "acceptedValidationDelay": true
}
```

**Actions :**
- Vérifie authentification
- Valide format SIRET (14 chiffres)
- Crée la `Company`
- Met à jour `user.role` = "COMPANY"

### `/api/upload/kbis` (POST)
**Input :** FormData avec champ `kbis` (File)

**Validation :**
- Type : PDF, JPG, PNG
- Taille : max 5MB

**Actions :**
- Sauvegarde dans `/public/uploads/kbis/`
- Nom du fichier : `kbis_{userId}_{timestamp}.{ext}`
- Retourne l'URL : `/uploads/kbis/kbis_xxx_yyy.pdf`

### `/api/driver/update-kbis` (POST)
**Input :**
```json
{
  "kbisUrl": "/uploads/kbis/kbis_xxx_yyy.pdf"
}
```

**Actions (après migration DB) :**
```javascript
await db.driverProfile.update({
  where: { userId: session.user.id },
  data: {
    kbisUrl,
    kbisUploadedAt: new Date(),
    kbisVerified: false
  }
})
```

### `/api/company/update-kbis` (POST)
Identique à `/api/driver/update-kbis` mais pour Company.

---

## États du KBIS

| État | `kbisUrl` | `kbisVerified` | Affichage | Action possible |
|------|-----------|----------------|-----------|-----------------|
| Pas uploadé | `null` | `false` | Alerte jaune | Modal s'affiche |
| En vérification | URL | `false` | Message temporaire | Bloqué temporairement |
| Vérifié | URL | `true` | Rien | Toutes actions possibles |
| Refusé | URL | `false` | Alerte rouge (à impl.) | Modal pour réupload |

---

## À implémenter (futures étapes)

### 1. Panneau Admin
- Liste des KBIS à vérifier
- Action : Approuver / Refuser
- Notification à l'utilisateur

### 2. Email de notification
- Après upload : "Document reçu, vérification en cours"
- Après validation : "KBIS validé, vous pouvez maintenant [action]"
- Si refus : "KBIS refusé, veuillez réuploader"

### 3. Gestion de l'expiration
- Job cron qui vérifie les KBIS > 3 mois
- Notification utilisateur : "Votre KBIS expire bientôt"
- Blocage automatique si KBIS expiré

### 4. Amélioration UX
- Preview du document uploadé
- OCR pour extraire la date du KBIS automatiquement
- Validation automatique si KBIS déjà vérifié (même SIRET)

---

## Checklist de déploiement

- [ ] Migrer le schéma Prisma (voir `KBIS_SCHEMA_TODO.md`)
- [ ] Décommenter le code dans `/api/driver/update-kbis/route.ts`
- [ ] Décommenter le code dans `/api/company/update-kbis/route.ts`
- [ ] Mettre à jour le dashboard pour lire les vraies valeurs KBIS
- [ ] Créer le dossier `/public/uploads/kbis/` en production
- [ ] Configurer les permissions du dossier uploads
- [ ] Tester le flow complet en staging
- [ ] Documenter le processus admin de validation

---

## Sécurité

### Upload de fichiers
- ✅ Validation du type MIME
- ✅ Validation de la taille (5MB max)
- ✅ Nom de fichier sécurisé (timestamp + userId)
- ⚠️ TODO: Scan antivirus des fichiers uploadés
- ⚠️ TODO: Stockage cloud (S3, Cloudinary) au lieu de `/public`

### Accès aux documents
- ⚠️ TODO: Les fichiers dans `/public` sont accessibles publiquement
- ⚠️ TODO: Implémenter un système d'URL signées ou stockage privé
- ⚠️ TODO: Watermark automatique avec "Confidentiel - PrestaPop"

---

## Performance

- Upload asynchrone avec barre de progression
- Compression d'image côté client avant upload (si JPG/PNG > 1MB)
- CDN pour servir les fichiers statiques
- Lazy loading des documents dans le panneau admin
