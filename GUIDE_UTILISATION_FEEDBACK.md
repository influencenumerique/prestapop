# Guide d'utilisation - Système de Feedback et Badges

## Vue d'ensemble

Le système de feedback et badges permet aux entreprises d'évaluer les chauffeurs et de visualiser leurs performances à travers des tags visuels et des badges de reconnaissance.

---

## 1. Page d'accueil - Vue Entreprise

### URL
`/` (connecté en tant qu'entreprise)

### Affichage des chauffeurs

Chaque carte de chauffeur affiche :

```
┌────────────────────────────────────────────────────────┐
│  🌟 Super Chauffeur          ✓ Vérifié                │
│                                                         │
│   [M]  Marc Dupont                                     │
│        📍 Paris 11e                                    │
└────────────────────────────────────────────────────────┘
│                                                         │
│  ⭐ 4.9  · 47 avis · 156 livraisons                   │
│                                                         │
│  👑 #3 Paris                                           │  <- Position régionale (si Top 10)
│                                                         │
│  Points forts :                                        │
│  👍 Ponctuel 89%  📦 Soigneux 85%  👔 Professionnel 82% │  <- Top 3 tags
│                                                         │
│  Badges :                                              │
│  🏆 Champion Ponctualité  💯 100 Livraisons  👑 Top 3  │  <- Badges obtenus
│                                                         │
│  Chauffeur-livreur expérimenté. Ponctuel, soigneux    │
│  et professionnel...                                   │
│                                                         │
│  🕐 5 ans d'expérience    🚐 Renault Master 12m³      │
│                                                         │
│  [Utilitaire] [Camion]                                │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  [Disponible maintenant]              [Voir le profil→]│
└────────────────────────────────────────────────────────┘
```

### Légende des badges

| Badge | Emoji | Signification |
|-------|-------|---------------|
| Champion Ponctualité | 🏆 | 95%+ des livraisons à l'heure |
| Expert Colis Fragiles | 📦 | Reconnu pour manipulation soignée |
| Éclair | 🚀 | Livraisons ultra-rapides |
| Star Communication | ⭐ | Excellente communication client |
| Top 10 | 🥇 | Top 10 de sa région |
| Top 3 | 👑 | Top 3 de sa région |
| 100 Livraisons | 💯 | 100 livraisons effectuées |
| 500 Livraisons | 🎖️ | 500 livraisons effectuées |
| Note Parfaite | 💎 | 10 missions consécutives à 5/5 |
| Étoile Montante | 🌟 | Nouveau talent prometteur |

---

## 2. Page de notation post-mission

### URL
`/jobs/[id]/feedback`

### Accessible par
- Entreprises après une mission terminée
- Lien depuis le dashboard ou email de confirmation

### Étape 1 : Informations de la mission

```
┌────────────────────────────────────────────────────────┐
│  Informations de la mission                            │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Mission                                               │
│  Tournée express Paris 11e, 12e, 20e                  │
│                                                         │
│  Chauffeur                                             │
│  [M] Marc Dupont                                       │
│      [Mission terminée]                                │
│                                                         │
│  Terminée le                                           │
│  jeudi 9 janvier 2026 à 18:30                         │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Étape 2 : Notation par étoiles (obligatoire)

```
┌────────────────────────────────────────────────────────┐
│  Notez votre expérience avec Marc Dupont              │
│  Votre avis aide les autres entreprises à choisir     │
├────────────────────────────────────────────────────────┤
│                                                         │
│               ⭐ ⭐ ⭐ ⭐ ⭐                            │
│                 (cliquez pour noter)                   │
│                                                         │
│                    Excellent !                         │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Labels selon la note :**
- 5 étoiles : "Excellent !"
- 4 étoiles : "Très bien"
- 3 étoiles : "Bien"
- 2 étoiles : "Moyen"
- 1 étoile : "Décevant"

### Étape 3 : Sélection des qualités (obligatoire)

```
┌────────────────────────────────────────────────────────┐
│  Comment s'est passée la mission ?                     │
│  Sélectionnez les qualités du chauffeur               │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌────────┐  ┌────────┐  ┌────────┐                  │
│  │   👍   │  │   📦   │  │   💬   │                  │
│  │Ponctuel│  │Soigneux│  │Communi-│                  │
│  │        │  │        │  │catif   │                  │
│  └────────┘  └────────┘  └────────┘                  │
│                                                         │
│  ┌────────┐  ┌────────┐  ┌────────┐                  │
│  │   ⚡   │  │   🎯   │  │   😊   │                  │
│  │ Rapide │  │ Précis │  │Souriant│                  │
│  └────────┘  └────────┘  └────────┘                  │
│                                                         │
│  ┌────────┐  ┌────────┐  ┌────────┐                  │
│  │   🔧   │  │   📱   │  │   👔   │                  │
│  │Débrou- │  │ Réactif│  │Profes- │                  │
│  │illard  │  │        │  │sionnel │                  │
│  └────────┘  └────────┘  └────────┘                  │
│                                                         │
│  ┌────────┐                                            │
│  │   ✅   │                                            │
│  │ Fiable │                                            │
│  └────────┘                                            │
│                                                         │
│                       [Valider ma notation (3 qualités)]│
└────────────────────────────────────────────────────────┘
```

**Interaction :**
- Clic sur une bulle : sélectionne/désélectionne
- Bulles sélectionnées : bordure bleue + fond bleu clair
- Multi-sélection autorisée
- Minimum 1 qualité requise
- Le bouton affiche le nombre de qualités sélectionnées

### Étape 4 : Commentaire (facultatif)

```
┌────────────────────────────────────────────────────────┐
│  Commentaire (facultatif)                              │
│  Partagez plus de détails sur votre expérience        │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Ex: Excellent chauffeur, ponctuel et très        │ │
│  │ professionnel. Communication au top tout au      │ │
│  │ long de la mission.                              │ │
│  │                                                   │ │
│  └──────────────────────────────────────────────────┘ │
│                                          125/500 caractères │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Étape 5 : Validation

```
┌────────────────────────────────────────────────────────┐
│                                                         │
│                    [Annuler]  [Valider mon avis]      │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Bouton désactivé si :**
- Aucune étoile sélectionnée
- Aucune qualité sélectionnée

### Étape 6 : Confirmation

```
┌────────────────────────────────────────────────────────┐
│                                                         │
│                    ✓                                   │
│                                                         │
│              Merci pour votre avis !                   │
│                                                         │
│  Votre évaluation aide les autres entreprises à       │
│  choisir les meilleurs chauffeurs et contribue à      │
│  améliorer la qualité du service.                     │
│                                                         │
│  [Retour au tableau de bord]  [Voir les missions]     │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## 3. Utilisation programmatique

### Afficher les tags d'un chauffeur (lecture seule)

```tsx
import { CompactFeedbackTags } from "@/components/driver-feedback-tags"

const tags = [
  { tag: "PUNCTUAL", percentage: 89 },
  { tag: "CAREFUL", percentage: 85 },
  { tag: "PROFESSIONAL", percentage: 82 },
]

<CompactFeedbackTags tags={tags} maxDisplay={3} />
```

### Afficher les badges d'un chauffeur

```tsx
import { DriverBadges } from "@/components/driver-badges"

const badges = [
  "PUNCTUALITY_CHAMPION",
  "FIRST_100_DELIVERIES",
  "TOP_3_REGION"
]

<DriverBadges
  badges={badges}
  size="sm"
  maxDisplay={3}
  showTooltips={true}
/>
```

### Afficher le classement régional

```tsx
import { RegionalRankingBadge } from "@/components/driver-badges"

<RegionalRankingBadge
  position={3}
  region="Paris"
  size="md"
/>
```

### Formulaire de feedback interactif

```tsx
import { DriverFeedbackTags } from "@/components/driver-feedback-tags"

const [selectedTags, setSelectedTags] = useState([])

<DriverFeedbackTags
  jobId="job-123"
  driverId="driver-456"
  selectedTags={selectedTags}
  onSubmit={(tags) => setSelectedTags(tags)}
  readonly={false}
/>
```

### Modal complète de feedback

```tsx
import { MissionFeedbackModal } from "@/components/mission-feedback-modal"

<MissionFeedbackModal
  jobId="job-123"
  driverId="driver-456"
  driverName="Marc Dupont"
  onSubmit={async (feedback) => {
    // feedback.rating : 1-5
    // feedback.tags : Array<FeedbackTag>
    // feedback.comment : string | undefined
    await submitToAPI(feedback)
  }}
  onClose={() => router.back()}
/>
```

---

## 4. Types TypeScript

### FeedbackTag

```typescript
type FeedbackTag =
  | "PUNCTUAL"
  | "CAREFUL"
  | "COMMUNICATIVE"
  | "FAST"
  | "PRECISE"
  | "FRIENDLY"
  | "RESOURCEFUL"
  | "RESPONSIVE"
  | "PROFESSIONAL"
  | "RELIABLE"
```

### BadgeType

```typescript
type BadgeType =
  | "PUNCTUALITY_CHAMPION"
  | "CAREFUL_EXPERT"
  | "SPEED_DEMON"
  | "COMMUNICATION_STAR"
  | "TOP_10_REGION"
  | "TOP_3_REGION"
  | "FIRST_100_DELIVERIES"
  | "FIRST_500_DELIVERIES"
  | "PERFECT_RATING"
  | "RISING_STAR"
```

### MissionFeedback

```typescript
interface MissionFeedback {
  rating: number        // 1-5
  tags: FeedbackTag[]   // Au moins 1
  comment?: string      // Facultatif, max 500 caractères
}
```

---

## 5. Exemple de flux complet

### Scénario : Entreprise LogiExpress note Marc Dupont

1. **Mission terminée**
   - LogiExpress a publié "Tournée express Paris 11e"
   - Marc Dupont a effectué la livraison
   - Mission marquée comme COMPLETED

2. **Navigation vers feedback**
   - LogiExpress accède à `/jobs/abc123/feedback`
   - Voit les infos de la mission et Marc Dupont

3. **Évaluation**
   - Sélectionne 5 étoiles → "Excellent !"
   - Sélectionne les tags : Ponctuel, Soigneux, Professionnel
   - Ajoute commentaire : "Excellent chauffeur, très pro"
   - Clique sur "Valider mon avis"

4. **Soumission**
   - Données envoyées :
     ```json
     {
       "rating": 5,
       "tags": ["PUNCTUAL", "CAREFUL", "PROFESSIONAL"],
       "comment": "Excellent chauffeur, très pro"
     }
     ```

5. **Impact sur Marc Dupont**
   - Ses stats se mettent à jour :
     - Tag PUNCTUAL : +1 vote
     - Tag CAREFUL : +1 vote
     - Tag PROFESSIONAL : +1 vote
   - Si 50+ votes PUNCTUAL → Badge "Champion Ponctualité"
   - Si 10 missions à 5/5 → Badge "Note Parfaite"
   - Classement régional recalculé

6. **Affichage mis à jour**
   - Page d'accueil montre les nouveaux stats
   - Profil de Marc affiche les nouveaux badges
   - Autres entreprises voient les tags actualisés

---

## 6. Conseils UX

### Pour les entreprises

**Soyez spécifique**
- Sélectionnez uniquement les qualités vraiment observées
- Un commentaire détaillé aide les autres entreprises

**Soyez équitable**
- Basez-vous sur les faits observés
- La note reflète l'expérience globale

**Évaluez rapidement**
- Notez juste après la mission
- Les détails sont encore frais

### Pour les chauffeurs

**Gagnez des badges**
- Badges visibles par toutes les entreprises
- Attirent plus de missions
- Augmentent votre crédibilité

**Maintenez vos points forts**
- Top 3 tags affichés en premier
- Plus vous recevez un tag, plus il monte
- Concentrez-vous sur vos forces

**Visez le classement**
- Top 3 région = badge spécial
- Top 10 région = visibilité accrue
- Basé sur note moyenne + nombre de livraisons

---

## 7. Points techniques

### Performance
- Composants optimisés pour SSR
- FeaturedDriversSection en "use client"
- Page principale reste server-side

### Accessibilité
- Boutons cliquables avec feedback visuel
- Labels descriptifs
- Tooltips informatifs sur les badges

### Responsive
- Grid adaptatif pour les tags
- Cartes chauffeurs : 1 colonne mobile, 2 desktop
- Badges s'adaptent à la taille d'écran

### Validation
- Rating obligatoire (1-5)
- Au moins 1 tag obligatoire
- Commentaire limité à 500 caractères
- Bouton désactivé si validation échoue

---

## 8. Données fictives actuelles

Les 4 chauffeurs affichés sur la page d'accueil ont des données de démonstration :

**Marc Dupont (Paris 11e)**
- Note : 4.9/5 (47 avis)
- Tags : Ponctuel 89%, Soigneux 85%, Professionnel 82%
- Badges : Champion Ponctualité, 100 Livraisons, Top 3 région
- Classement : #3 Paris

**Sophie Martin (Lyon 3e)**
- Note : 4.8/5 (89 avis)
- Tags : Soigneux 94%, Communicatif 88%, Fiable 86%
- Badges : Expert Colis Fragiles, Star Communication, 500 Livraisons
- Classement : #1 Lyon

**Ahmed Benali (Paris 20e)**
- Note : 4.7/5 (32 avis)
- Tags : Rapide 92%, Réactif 87%, Souriant 84%
- Badges : Éclair, 100 Livraisons, Étoile Montante
- Classement : #7 Paris

**Fatou Diallo (Nanterre)**
- Note : 5.0/5 (28 avis)
- Tags : Souriant 96%, Professionnel 93%, Ponctuel 90%
- Badges : Note Parfaite, Star Communication, Étoile Montante
- Classement : #2 Île-de-France Ouest

---

## Prochaines étapes

1. **Connexion API** : Remplacer les données fictives par de vraies données
2. **Authentification** : Vérifier que seule l'entreprise propriétaire peut noter
3. **Calcul automatique** : Mettre à jour les stats et badges en temps réel
4. **Notifications** : Alerter les chauffeurs lors de nouveaux feedbacks
