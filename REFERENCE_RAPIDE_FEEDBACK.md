# Référence Rapide - Système Feedback & Badges

## Composants disponibles

### 1. CompactFeedbackTags
**Fichier :** `/src/components/driver-feedback-tags.tsx`
**Usage :** Affichage compact des top tags avec pourcentages

```tsx
import { CompactFeedbackTags } from "@/components/driver-feedback-tags"

<CompactFeedbackTags
  tags={[
    { tag: "PUNCTUAL", percentage: 89 },
    { tag: "CAREFUL", percentage: 85 }
  ]}
  maxDisplay={3}  // Optionnel, défaut: 3
/>
```

**Rendu :** `👍 Ponctuel 89%` `📦 Soigneux 85%`

---

### 2. DriverFeedbackTags
**Fichier :** `/src/components/driver-feedback-tags.tsx`
**Usage :** Interface de sélection des tags (lecture/écriture)

```tsx
import { DriverFeedbackTags } from "@/components/driver-feedback-tags"

<DriverFeedbackTags
  jobId="job-123"              // Optionnel
  driverId="driver-456"        // Optionnel
  selectedTags={selectedTags}  // Array<FeedbackTag>
  onSubmit={(tags) => {...}}   // Callback avec tags sélectionnés
  readonly={false}             // true = affichage seul
/>
```

---

### 3. DriverBadges
**Fichier :** `/src/components/driver-badges.tsx`
**Usage :** Affichage des badges avec tooltips

```tsx
import { DriverBadges } from "@/components/driver-badges"

<DriverBadges
  badges={["PUNCTUALITY_CHAMPION", "TOP_3_REGION"]}
  size="sm"            // "sm" | "md" | "lg"
  maxDisplay={3}       // Optionnel
  showTooltips={true}  // Optionnel, défaut: true
/>
```

**Rendu :** `🏆 Champion Ponctualité` `👑 Top 3`

---

### 4. RegionalRankingBadge
**Fichier :** `/src/components/driver-badges.tsx`
**Usage :** Badge de classement régional

```tsx
import { RegionalRankingBadge } from "@/components/driver-badges"

<RegionalRankingBadge
  position={3}
  region="Paris"  // Optionnel
  size="md"       // "sm" | "md" | "lg"
/>
```

**Rendu :** `🥉 #3 Paris`

---

### 5. MissionFeedbackModal
**Fichier :** `/src/components/mission-feedback-modal.tsx`
**Usage :** Modal complète de notation post-mission

```tsx
import { MissionFeedbackModal } from "@/components/mission-feedback-modal"

<MissionFeedbackModal
  jobId="job-123"
  driverId="driver-456"
  driverName="Marc Dupont"
  onSubmit={async (feedback) => {
    // feedback = { rating: 1-5, tags: [...], comment?: string }
    await api.post('/feedback', feedback)
  }}
  onClose={() => router.back()}  // Optionnel
/>
```

---

### 6. FeaturedDriversSection
**Fichier :** `/src/components/featured-drivers-section.tsx`
**Usage :** Section complète d'affichage des chauffeurs

```tsx
import { FeaturedDriversSection } from "@/components/featured-drivers-section"

<FeaturedDriversSection drivers={featuredDrivers} />
```

**Props driver :**
```typescript
interface Driver {
  id: string
  name: string
  city: string
  rating: number
  reviewCount: number
  totalDeliveries: number
  yearsExperience: number
  vehicleTypes: string[]
  vehicleDetails: string
  bio: string
  availability: string
  verified: boolean
  superDriver: boolean
  topTags?: Array<{ tag: FeedbackTag; percentage: number }>
  badges?: BadgeType[]
  regionalRanking?: { position: number; region: string }
}
```

---

## Types TypeScript

### FeedbackTag (enum)
```typescript
type FeedbackTag =
  | "PUNCTUAL"       // 👍 Ponctuel
  | "CAREFUL"        // 📦 Soigneux
  | "COMMUNICATIVE"  // 💬 Communicatif
  | "FAST"           // ⚡ Rapide
  | "PRECISE"        // 🎯 Précis
  | "FRIENDLY"       // 😊 Souriant
  | "RESOURCEFUL"    // 🔧 Débrouillard
  | "RESPONSIVE"     // 📱 Réactif
  | "PROFESSIONAL"   // 👔 Professionnel
  | "RELIABLE"       // ✅ Fiable
```

### BadgeType (enum)
```typescript
type BadgeType =
  | "PUNCTUALITY_CHAMPION"    // 🏆 Champion Ponctualité
  | "CAREFUL_EXPERT"          // 📦 Expert Colis Fragiles
  | "SPEED_DEMON"             // 🚀 Éclair
  | "COMMUNICATION_STAR"      // ⭐ Star Communication
  | "TOP_10_REGION"           // 🥇 Top 10
  | "TOP_3_REGION"            // 👑 Top 3
  | "FIRST_100_DELIVERIES"    // 💯 100 Livraisons
  | "FIRST_500_DELIVERIES"    // 🎖️ 500 Livraisons
  | "PERFECT_RATING"          // 💎 Note Parfaite
  | "RISING_STAR"             // 🌟 Étoile Montante
```

### MissionFeedback (interface)
```typescript
interface MissionFeedback {
  rating: number        // 1-5
  tags: FeedbackTag[]   // Au moins 1 requis
  comment?: string      // Max 500 caractères
}
```

---

## Configuration des tags

**Fichier :** `/src/components/driver-feedback-tags.tsx`

```typescript
export const feedbackTags: FeedbackTagConfig[] = [
  { tag: "PUNCTUAL", emoji: "👍", label: "Ponctuel" },
  { tag: "CAREFUL", emoji: "📦", label: "Soigneux" },
  { tag: "COMMUNICATIVE", emoji: "💬", label: "Communicatif" },
  { tag: "FAST", emoji: "⚡", label: "Rapide" },
  { tag: "PRECISE", emoji: "🎯", label: "Précis" },
  { tag: "FRIENDLY", emoji: "😊", label: "Souriant" },
  { tag: "RESOURCEFUL", emoji: "🔧", label: "Débrouillard" },
  { tag: "RESPONSIVE", emoji: "📱", label: "Réactif" },
  { tag: "PROFESSIONAL", emoji: "👔", label: "Professionnel" },
  { tag: "RELIABLE", emoji: "✅", label: "Fiable" },
]
```

---

## Configuration des badges

**Fichier :** `/src/components/driver-badges.tsx`

```typescript
export const badgeConfig: Record<BadgeType, BadgeConfig> = {
  PUNCTUALITY_CHAMPION: {
    emoji: "🏆",
    label: "Champion Ponctualité",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    description: "95%+ des livraisons à l'heure",
  },
  CAREFUL_EXPERT: {
    emoji: "📦",
    label: "Expert Colis Fragiles",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    description: "Reconnu pour manipuler avec soin",
  },
  // ... autres badges
}
```

---

## Pages

### Page de feedback
**Route :** `/app/jobs/[id]/feedback/page.tsx`
**URL :** `/jobs/abc123/feedback`
**Accès :** Entreprise propriétaire de la mission

**Composants utilisés :**
- MissionFeedbackModal
- Card (informations mission)
- Avatar (chauffeur)

---

### Page d'accueil (vue entreprise)
**Route :** `/app/page.tsx`
**Composants utilisés :**
- FeaturedDriversSection (wrapper client)
  - CompactFeedbackTags
  - DriverBadges
  - RegionalRankingBadge

---

## Fichiers de types

### `/src/lib/types/driver-feedback.ts`

```typescript
// API Request/Response types
export interface CreateFeedbackRequest {
  bookingId: string
  rating: number
  tags: FeedbackTag[]
  comment?: string
}

export interface DriverStatsResponse {
  driver: { ... }
  performance: { rating, totalReviews, ... }
  topTags: Array<{ tag, count, percentage }>
  badges: Array<{ type, earnedAt }>
  ranking: { regionalRank, region }
  recentFeedbacks: Array<{ ... }>
}

// Descriptions
export const TAG_DESCRIPTIONS: Record<FeedbackTag, string>
export const BADGE_DESCRIPTIONS: Record<BadgeType, string>
```

---

## Données fictives

**Fichier :** `/src/app/page.tsx`

```typescript
const featuredDrivers = [
  {
    id: "1",
    name: "Marc Dupont",
    // ... autres champs
    topTags: [
      { tag: "PUNCTUAL", percentage: 89 },
      { tag: "CAREFUL", percentage: 85 },
      { tag: "PROFESSIONAL", percentage: 82 },
    ],
    badges: ["PUNCTUALITY_CHAMPION", "FIRST_100_DELIVERIES", "TOP_3_REGION"],
    regionalRanking: { position: 3, region: "Paris" },
  },
  // ... 3 autres chauffeurs
]
```

---

## Styling

### Tailles de badges
```typescript
size="sm"  // Petit (texte xs, padding réduit)
size="md"  // Moyen (texte sm, padding normal)
size="lg"  // Grand (texte base, padding large)
```

### Couleurs de badges
- **Jaune** : Champion Ponctualité, Top 3
- **Bleu** : Expert Colis Fragiles
- **Violet** : Éclair
- **Orange** : Star Communication
- **Doré** : Top 10, Top 3
- **Vert** : Milestones (100, 500 livraisons)
- **Cyan** : Note Parfaite
- **Rose** : Étoile Montante

### Classement régional
- Position 1 : 🥇 + gradient jaune-or
- Position 2 : 🥈 + gradient jaune-or
- Position 3 : 🥉 + gradient jaune-or
- Position 4-10 : 🏅 + fond ambre

---

## Exemples d'intégration

### Ajouter feedback à une carte chauffeur simple

```tsx
import { CompactFeedbackTags } from "@/components/driver-feedback-tags"
import { DriverBadges } from "@/components/driver-badges"

function DriverCard({ driver }) {
  return (
    <div className="border rounded-lg p-4">
      <h3>{driver.name}</h3>
      <p>⭐ {driver.rating}/5</p>

      {/* Tags */}
      {driver.topTags && (
        <CompactFeedbackTags tags={driver.topTags} />
      )}

      {/* Badges */}
      {driver.badges && (
        <DriverBadges badges={driver.badges} size="sm" />
      )}
    </div>
  )
}
```

### Créer un formulaire de feedback personnalisé

```tsx
"use client"
import { useState } from "react"
import { DriverFeedbackTags } from "@/components/driver-feedback-tags"

function CustomFeedbackForm() {
  const [rating, setRating] = useState(0)
  const [tags, setTags] = useState([])

  return (
    <div>
      {/* Rating stars */}
      <StarRating value={rating} onChange={setRating} />

      {/* Tags */}
      <DriverFeedbackTags
        selectedTags={tags}
        onSubmit={setTags}
        readonly={false}
      />

      {/* Submit */}
      <button onClick={() => submitFeedback({ rating, tags })}>
        Valider
      </button>
    </div>
  )
}
```

---

## Checklist d'intégration API

- [ ] POST /api/drivers/[id]/feedback
  - Créer DriverFeedback dans DB
  - Mettre à jour DriverTagStats
  - Recalculer badges si nécessaire

- [ ] GET /api/drivers/[id]/stats
  - Retourner topTags avec percentages
  - Retourner badges obtenus
  - Retourner ranking régional

- [ ] Calcul automatique des badges
  - PUNCTUALITY_CHAMPION : 50+ tags PUNCTUAL
  - TOP_3_REGION : Calculer ranking régional
  - PERFECT_RATING : 10 missions consécutives 5/5

- [ ] Websockets ou polling pour mise à jour temps réel

---

## Commandes utiles

```bash
# Installer les dépendances
npm install @radix-ui/react-tooltip

# Build de production
npm run build

# Dev server
npm run dev

# Linter
npm run lint
```

---

## Notes importantes

1. **Composants "use client"**
   - DriverFeedbackTags
   - DriverBadges
   - MissionFeedbackModal
   - FeaturedDriversSection

2. **Pages server-side**
   - /app/page.tsx (utilise FeaturedDriversSection)
   - /app/jobs/[id]/page.tsx

3. **Validation**
   - Rating : 1-5 obligatoire
   - Tags : minimum 1 obligatoire
   - Comment : max 500 caractères, facultatif

4. **Performance**
   - CompactFeedbackTags limite à 3 tags par défaut
   - DriverBadges limite à 3 badges par défaut
   - Tooltips chargés à la demande

---

## Dépendances

```json
{
  "@radix-ui/react-tooltip": "^1.x.x",
  "lucide-react": "^0.456.0",
  "next": "^15.0.0",
  "react": "^19.0.0"
}
```

---

## Support

Pour toute question ou bug, référez-vous à :
- `/PHASE_UI_FEEDBACK_BADGES.md` : Documentation complète
- `/GUIDE_UTILISATION_FEEDBACK.md` : Guide utilisateur détaillé
- `/src/components/*.tsx` : Code source commenté
