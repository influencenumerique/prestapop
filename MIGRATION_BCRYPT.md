# 🔐 Migration des mots de passe vers bcrypt

Ce document explique comment migrer les mots de passe existants de votre base de données vers un système de hashing sécurisé avec bcrypt.

## ⚠️ IMPORTANT - À LIRE AVANT DE COMMENCER

- ✅ Cette migration est **OBLIGATOIRE** avant le déploiement en production
- ⚠️  Le script doit être exécuté **UNE SEULE FOIS**
- 💾 **Créez un backup de votre base de données avant d'exécuter le script**
- 🔒 Après la migration, les anciens mots de passe en clair ne fonctionneront plus

## 📋 Ce qui a été modifié

### 1. Installation de bcrypt
```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

### 2. Fichiers modifiés

#### `src/lib/auth.ts`
- ✅ Ajout de l'import bcrypt
- ✅ Utilisation de `bcrypt.compare()` pour vérifier les mots de passe
- ✅ Suppression des logs sensibles (mots de passe en clair)

#### `src/app/api/auth/register/route.ts`
- ✅ Ajout de l'import bcrypt
- ✅ Hashing automatique avec `bcrypt.hash()` lors de l'inscription
- ✅ Les nouveaux utilisateurs auront automatiquement un mot de passe hashé

#### `scripts/hash-existing-passwords.ts`
- ✅ Script de migration pour hasher les mots de passe existants
- ✅ Détecte automatiquement les mots de passe déjà hashés
- ✅ Affiche un rapport détaillé de la migration

## 🚀 Procédure de migration

### Étape 1: Créer un backup de la base de données

**Option A: Avec pg_dump (PostgreSQL)**
```bash
pg_dump $DATABASE_URL > backup_before_bcrypt_$(date +%Y%m%d_%H%M%S).sql
```

**Option B: Depuis Neon.tech (votre hébergeur)**
1. Aller sur https://console.neon.tech
2. Sélectionner votre projet
3. Onglet "Backups" → "Create backup"

### Étape 2: Tester en développement LOCAL d'abord

```bash
# 1. Assurez-vous d'utiliser la base de données de développement
echo $DATABASE_URL
# Doit pointer vers localhost ou une base de test

# 2. Exécuter le script de migration
npx tsx scripts/hash-existing-passwords.ts
```

**Résultat attendu:**
```
🔐 Début de la migration des mots de passe...

📊 3 utilisateur(s) trouvé(s) avec un mot de passe

✅ user1@example.com - Mot de passe hashé avec succès
✅ user2@example.com - Mot de passe hashé avec succès
✅ user3@example.com - Mot de passe hashé avec succès

==================================================
📊 RÉSULTAT DE LA MIGRATION:
==================================================
✅ Migrés:  3
⏭️  Ignorés:  0
❌ Erreurs:  0
📊 Total:    3
==================================================

⚠️  IMPORTANT: Testez la connexion avec vos utilisateurs avant de déployer!

✅ Migration terminée avec succès
```

### Étape 3: Tester la connexion

1. Démarrer votre serveur de développement:
   ```bash
   npm run dev
   ```

2. Tester la connexion avec les utilisateurs migrés:
   - Aller sur http://localhost:3000/login
   - Se connecter avec les identifiants existants
   - ✅ La connexion doit fonctionner normalement

3. Tester l'inscription d'un nouvel utilisateur:
   - Créer un nouveau compte
   - Se connecter avec ce nouveau compte
   - ✅ Doit fonctionner

### Étape 4: Migrer la production

**⚠️ ATTENTION: Ne faites cette étape qu'après avoir testé en développement!**

```bash
# 1. Se connecter à la base de production
# Remplacer DATABASE_URL par votre URL de production
DATABASE_URL="postgresql://..." npx tsx scripts/hash-existing-passwords.ts

# 2. Vérifier le résultat dans les logs
```

### Étape 5: Déployer le nouveau code

```bash
# 1. Committer les changements
git add .
git commit -m "feat: implement bcrypt password hashing for security"

# 2. Pusher vers le dépôt
git push origin main

# 3. Vercel déploiera automatiquement
```

### Étape 6: Vérification post-déploiement

1. ✅ Tester la connexion en production avec plusieurs comptes
2. ✅ Tester l'inscription d'un nouveau compte
3. ✅ Vérifier les logs Vercel pour s'assurer qu'il n'y a pas d'erreurs

## 🔍 Vérification manuelle en base de données

Pour vérifier que les mots de passe sont bien hashés:

```sql
-- Se connecter à votre base de données
SELECT
  email,
  LEFT(password, 10) as password_preview,
  CASE
    WHEN password LIKE '$2a$%' OR password LIKE '$2b$%'
    THEN '✅ Hashé'
    ELSE '❌ En clair'
  END as status
FROM users
WHERE password IS NOT NULL;
```

**Résultat attendu:**
```
email               | password_preview | status
--------------------|------------------|--------
user@example.com    | $2b$10$abc     | ✅ Hashé
admin@example.com   | $2b$10$def     | ✅ Hashé
```

## 🆘 En cas de problème

### Problème: Les utilisateurs ne peuvent plus se connecter

**Cause probable:** Le script n'a pas été exécuté sur la bonne base de données

**Solution:**
```bash
# 1. Restaurer le backup
psql $DATABASE_URL < backup_before_bcrypt_XXXXXX.sql

# 2. Vérifier la variable DATABASE_URL
echo $DATABASE_URL

# 3. Ré-exécuter le script avec la bonne URL
```

### Problème: "Cannot find module 'bcryptjs'"

**Solution:**
```bash
npm install bcryptjs @types/bcryptjs
```

### Problème: Erreur de connexion à la base

**Solution:**
```bash
# Vérifier que la base est accessible
npx prisma db push

# Si ça marche, relancer le script
npx tsx scripts/hash-existing-passwords.ts
```

## 📝 Notes techniques

### Format des mots de passe hashés

- **Algorithme:** bcrypt
- **Rounds:** 10 (bon équilibre sécurité/performance)
- **Format:** `$2b$10$[salt][hash]`
- **Longueur:** 60 caractères

### Pourquoi 10 rounds ?

- 10 rounds = ~70ms de temps de hashing
- Suffisant pour bloquer les attaques par force brute
- Pas trop lent pour ne pas impacter l'expérience utilisateur

### Compatibilité

- ✅ Compatible avec tous les utilisateurs existants
- ✅ Les nouveaux utilisateurs ont automatiquement bcrypt
- ✅ Pas besoin de redemander les mots de passe aux utilisateurs

## ✅ Checklist finale

Avant de considérer la migration comme terminée:

- [ ] Backup de la base de données créé
- [ ] Script testé en développement local
- [ ] Connexion testée avec plusieurs comptes
- [ ] Inscription de nouveaux comptes testée
- [ ] Script exécuté en production
- [ ] Code déployé sur Vercel
- [ ] Connexion testée en production
- [ ] Vérification manuelle en base de données
- [ ] Logs Vercel vérifiés (pas d'erreurs d'authentification)

## 🔒 Sécurité

### Avant (❌ DANGEREUX)
```typescript
// Mot de passe stocké en clair
password: "monmotdepasse123"

// Comparaison simple
if (credentials.password !== user.password) {
  return null
}
```

### Après (✅ SÉCURISÉ)
```typescript
// Mot de passe hashé
password: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

// Comparaison sécurisée
const isValid = await bcrypt.compare(credentials.password, user.password)
if (!isValid) {
  return null
}
```

---

**Date de création:** 2026-01-17
**Version:** 1.0.0
**Auteur:** Migration automatisée pour sécuriser PrestaPop
