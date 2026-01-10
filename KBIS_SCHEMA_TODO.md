# Champs KBIS à ajouter au schéma Prisma

## Modifications requises pour la gestion du KBIS

### 1. Model Company
Ajouter ces champs au modèle `Company` :
```prisma
model Company {
  // ... champs existants ...

  // KBIS Management
  kbisUrl          String?   // URL du document KBIS
  kbisVerified     Boolean   @default(false)  // KBIS vérifié par admin
  kbisUploadedAt   DateTime? // Date d'upload du KBIS
  kbisVerifiedAt   DateTime? // Date de vérification

  // ... relations existantes ...
}
```

### 2. Model DriverProfile
Ajouter ces champs au modèle `DriverProfile` :
```prisma
model DriverProfile {
  // ... champs existants ...

  // KBIS Management (Auto-entrepreneur)
  kbisUrl          String?   // URL du document KBIS auto-entrepreneur
  kbisVerified     Boolean   @default(false)  // KBIS vérifié par admin
  kbisUploadedAt   DateTime? // Date d'upload du KBIS
  kbisVerifiedAt   DateTime? // Date de vérification

  // ... relations existantes ...
}
```

## Migration SQL

Pour ajouter ces champs à la base de données existante :

```sql
-- Ajouter les champs KBIS à la table companies
ALTER TABLE companies
ADD COLUMN kbis_url TEXT,
ADD COLUMN kbis_verified BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN kbis_uploaded_at TIMESTAMP,
ADD COLUMN kbis_verified_at TIMESTAMP;

-- Ajouter les champs KBIS à la table driver_profiles
ALTER TABLE driver_profiles
ADD COLUMN kbis_url TEXT,
ADD COLUMN kbis_verified BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN kbis_uploaded_at TIMESTAMP,
ADD COLUMN kbis_verified_at TIMESTAMP;
```

## Commandes à exécuter

1. Modifier le fichier `prisma/schema.prisma` avec les champs ci-dessus
2. Générer la migration : `npx prisma migrate dev --name add_kbis_fields`
3. Appliquer en production : `npx prisma migrate deploy`

## Règles métier

- Le KBIS doit avoir moins de 3 mois
- La vérification se fait manuellement par un admin
- Sans KBIS vérifié, un chauffeur ne peut pas postuler
- Sans KBIS vérifié, une entreprise ne peut pas publier de mission
- Le KBIS est obligatoire avant la première action (pas à l'inscription)
