# Guide de test manuel - Home CTA Urgent + Social Proof

## 🎯 Objectif
Valider l'implémentation du badge "MISSION URGENTE" et de la section témoignages sur la page d'accueil.

---

## ⚙️ Prérequis

- ✅ Serveur dev lancé : `npm run dev`
- ✅ URL de test : **http://localhost:3001/**
- ✅ Navigateurs recommandés : Chrome, Firefox, Safari

---

## 📋 Checklist de tests

### 1. Badge MISSION URGENTE

#### Test 1.1 : Présence du badge
- [ ] Aller sur http://localhost:3001/
- [ ] Scroller jusqu'à la section "Missions disponibles" (fond vert clair)
- [ ] **VÉRIFIER** : La première mission (Tournée express Paris 11e, 12e, 20e) affiche un badge rouge-orange en haut à droite
- [ ] **VÉRIFIER** : Le badge contient "🚨 URGENT +50€"

**Résultat attendu** :
```
┌─────────────────────────────────────────────┐
│  [URBAIN]              [Entreprise vérifiée]│
│                          ┌─────────────────┐ │
│  Tournée express...     │ 🚨 URGENT +50€ │ │ ← BADGE ICI
│                          └─────────────────┘ │
│  📍 Paris 11e, 12e, 20e                     │
└─────────────────────────────────────────────┘
```

---

#### Test 1.2 : Animation pulse
- [ ] Observer le badge "URGENT +50€" pendant 5 secondes
- [ ] **VÉRIFIER** : Le badge pulse (agrandissement léger + glow effect)
- [ ] **VÉRIFIER** : L'animation se répète en boucle (toutes les 2 secondes environ)

**Si l'animation ne fonctionne pas** :
- Vérifier le fichier `src/app/globals.css` contient bien `@keyframes urgent-pulse`
- Ouvrir DevTools (F12) → Console → Vérifier aucune erreur CSS

---

#### Test 1.3 : Hover sur le badge
- [ ] Survoler le badge "URGENT +50€" avec la souris
- [ ] **VÉRIFIER** : Le badge grossit légèrement (scale 1.1x)
- [ ] **VÉRIFIER** : Transition smooth (pas de saut)

---

#### Test 1.4 : Prix ajusté
- [ ] Regarder le prix en bas à droite de la première mission
- [ ] **VÉRIFIER** : Prix affiché = **200€** (et non 150€)
- [ ] **VÉRIFIER** : Background du prix = rouge-orange (et non vert)
- [ ] **VÉRIFIER** : Le prix a un scale légèrement agrandi (1.05x)

**Calcul attendu** :
```
dayRate = 15000 centimes = 150€
urgentBonus = 50€
Total = 150€ + 50€ = 200€ ✅
```

---

#### Test 1.5 : Missions non-urgentes (contrôle)
- [ ] Scroller pour voir les missions 2 et 3 (Nanterre-Versailles et Rungis-Paris Sud)
- [ ] **VÉRIFIER** : Ces missions n'ont PAS de badge "URGENT"
- [ ] **VÉRIFIER** : Leur prix a un background vert (et non rouge)

---

### 2. Section Social Proof - Témoignages

#### Test 2.1 : Position de la section
- [ ] Depuis le top de la page, scroller vers le bas
- [ ] **VÉRIFIER** : La section témoignages apparaît APRÈS les stats (500+, 10K+, 98%, 4.8/5)
- [ ] **VÉRIFIER** : La section témoignages apparaît AVANT "Choisissez votre type de mission"

**Ordre attendu** :
```
Hero
  ↓
Stats
  ↓
🚀 TÉMOIGNAGES ← ICI
  ↓
Types de zones (URBAN / INTER-URBAIN)
```

---

#### Test 2.2 : Design de la section
- [ ] Observer la section témoignages
- [ ] **VÉRIFIER** : Fond sombre (gris ardoise foncé)
- [ ] **VÉRIFIER** : Badge jaune "🚀 RÉSULTATS RÉELS" en haut
- [ ] **VÉRIFIER** : Titre blanc "Ils ont optimisé leurs livraisons"
- [ ] **VÉRIFIER** : 3 cards de témoignages visibles

---

#### Test 2.3 : Contenu des témoignages

**Témoignage 1 (gauche)** :
- [ ] **VÉRIFIER** : 5 étoiles jaunes ⭐⭐⭐⭐⭐
- [ ] **VÉRIFIER** : Badge vert "-35%"
- [ ] **VÉRIFIER** : Citation contient "35% sur nos livraisons urgentes"
- [ ] **VÉRIFIER** : Avatar bleu avec "EC"
- [ ] **VÉRIFIER** : Nom "ExpressColis" + "E-commerce • 1 semaine"

**Témoignage 2 (centre)** :
- [ ] **VÉRIFIER** : 5 étoiles jaunes
- [ ] **VÉRIFIER** : Badge bleu "150 missions"
- [ ] **VÉRIFIER** : Citation contient "150 missions complétées en 7 jours"
- [ ] **VÉRIFIER** : Avatar vert émeraude avec "TP"
- [ ] **VÉRIFIER** : Nom "Transporteur Pro" + "Transport • 1 semaine"

**Témoignage 3 (droite)** :
- [ ] **VÉRIFIER** : 5 étoiles jaunes
- [ ] **VÉRIFIER** : Badge jaune "+12K€"
- [ ] **VÉRIFIER** : Citation contient "CA +12K€ en commissions"
- [ ] **VÉRIFIER** : Avatar violet avec "LT"
- [ ] **VÉRIFIER** : Nom "LogiTrans" + "Logistique • 1 semaine"

---

#### Test 2.4 : Hover sur les témoignages
- [ ] Survoler chaque card de témoignage
- [ ] **VÉRIFIER** : Bordure devient jaune au hover
- [ ] **VÉRIFIER** : Shadow jaune apparaît (glow effect)
- [ ] **VÉRIFIER** : Transition smooth

---

#### Test 2.5 : Trust badge final
- [ ] Scroller en bas de la section témoignages
- [ ] **VÉRIFIER** : Texte "+200 entreprises nous font confiance" visible
- [ ] **VÉRIFIER** : "+200 entreprises" est en jaune

---

### 3. Tests Responsive

#### Test 3.1 : Desktop (> 1024px)
- [ ] Ouvrir http://localhost:3001/ en plein écran (desktop)
- [ ] **VÉRIFIER** : Stats affichées en 4 colonnes (500+ | 10K+ | 98% | 4.8/5)
- [ ] **VÉRIFIER** : Témoignages affichés en 3 colonnes côte à côte
- [ ] **VÉRIFIER** : Badge URGENT visible en top-right de la card mission

---

#### Test 3.2 : Tablette (768px - 1024px)
- [ ] Ouvrir DevTools (F12) → Mode responsive → 768px
- [ ] **VÉRIFIER** : Témoignages toujours en 3 colonnes (mais plus petites)
- [ ] **VÉRIFIER** : Badge URGENT toujours visible

---

#### Test 3.3 : Mobile (< 768px)
- [ ] Ouvrir DevTools → Mode responsive → 375px (iPhone SE)
- [ ] **VÉRIFIER** : Stats en 2 colonnes (2x2 grid)
- [ ] **VÉRIFIER** : Témoignages empilés en 1 colonne
- [ ] **VÉRIFIER** : Badge URGENT toujours visible (ne déborde pas)
- [ ] **VÉRIFIER** : Texte des témoignages lisible (pas de texte coupé)

**Ordre mobile attendu** :
```
┌─────────────┐
│ Témoignage 1│
├─────────────┤
│ Témoignage 2│
├─────────────┤
│ Témoignage 3│
└─────────────┘
```

---

### 4. Tests Accessibilité

#### Test 4.1 : Navigation clavier
- [ ] Appuyer sur Tab plusieurs fois depuis le top de la page
- [ ] **VÉRIFIER** : Les cards de missions sont sélectionnables (focus visible)
- [ ] **VÉRIFIER** : Les cards de témoignages sont sélectionnables (si liens)
- [ ] Appuyer sur Enter sur une mission → **VÉRIFIER** : Redirection vers /jobs/[id]

---

#### Test 4.2 : Contraste couleurs
- [ ] Utiliser un outil de contraste (ex: WebAIM Contrast Checker)
- [ ] **VÉRIFIER** : Badge rouge-orange sur fond blanc = Ratio > 4.5:1 ✅
- [ ] **VÉRIFIER** : Texte blanc sur fond slate-900 = Ratio > 7:1 ✅

---

### 5. Tests Performance

#### Test 5.1 : Lighthouse
- [ ] Ouvrir DevTools → Onglet "Lighthouse"
- [ ] Lancer un audit (Performance + Accessibility)
- [ ] **VÉRIFIER** : Performance Score > 90
- [ ] **VÉRIFIER** : Accessibility Score > 90
- [ ] **VÉRIFIER** : Aucune erreur de CLS (Cumulative Layout Shift)

---

#### Test 5.2 : Network throttling
- [ ] DevTools → Network → Throttling → "Slow 3G"
- [ ] Recharger la page
- [ ] **VÉRIFIER** : Le badge URGENT est visible rapidement (< 3s)
- [ ] **VÉRIFIER** : Les témoignages se chargent sans bloquer le reste de la page

---

### 6. Tests Navigateurs (Cross-browser)

#### Test 6.1 : Chrome / Edge
- [ ] Tester sur Chrome ou Edge (Chromium)
- [ ] **VÉRIFIER** : Animation pulse fonctionne
- [ ] **VÉRIFIER** : Hover effects fonctionnent

#### Test 6.2 : Firefox
- [ ] Tester sur Firefox
- [ ] **VÉRIFIER** : Animation pulse fonctionne
- [ ] **VÉRIFIER** : Gradients CSS s'affichent correctement

#### Test 6.3 : Safari (macOS/iOS)
- [ ] Tester sur Safari
- [ ] **VÉRIFIER** : Animation pulse fonctionne
- [ ] **VÉRIFIER** : Aucun artefact visuel (shadows, borders)

---

## 🐛 Bugs potentiels à surveiller

### Bug 1 : Badge URGENT non visible
**Symptôme** : Aucun badge rouge-orange sur la première mission
**Cause probable** : Propriété `isUrgent` non définie ou `false`
**Solution** : Vérifier `featuredJobs[0].isUrgent === true` dans page.tsx (ligne 42)

---

### Bug 2 : Animation pulse ne fonctionne pas
**Symptôme** : Badge statique (pas de pulse)
**Cause probable** : CSS `@keyframes` non chargé
**Solution** :
1. Vérifier `src/app/globals.css` contient `@keyframes urgent-pulse` (ligne 68)
2. Vérifier `className="animate-urgent-pulse"` (pas `animate-pulse`)
3. Hard refresh : Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)

---

### Bug 3 : Prix non ajusté (toujours 150€)
**Symptôme** : Prix affiché = 150€ au lieu de 200€
**Cause probable** : Calcul `urgentBonus` non pris en compte
**Solution** : Vérifier ligne 799 de page.tsx :
```tsx
{(job.dayRate / 100 + (job.urgentBonus || 0)).toFixed(0)}€
```

---

### Bug 4 : Section témoignages invisible
**Symptôme** : Pas de section sombre avec témoignages
**Cause probable** : Code ajouté au mauvais endroit (vue entreprise au lieu de vue chauffeur/guest)
**Solution** : Vérifier que la section est APRÈS `{/* Stats */}` ligne 427 et AVANT `{/* Types de zones de mission */}` ligne 565

---

### Bug 5 : Témoignages non responsive (débordent sur mobile)
**Symptôme** : Scroll horizontal sur mobile
**Cause probable** : Grid non responsive
**Solution** : Vérifier `className="grid md:grid-cols-3 gap-6"` (pas juste `grid-cols-3`)

---

## ✅ Critères de validation finale

### Must-have (bloquants)
- [ ] Badge "URGENT +50€" visible sur mission 1
- [ ] Animation pulse visible
- [ ] Prix ajusté à 200€ (et non 150€)
- [ ] 3 témoignages visibles avec résultats chiffrés
- [ ] Responsive mobile (pas de débordement)

### Nice-to-have (non-bloquants)
- [ ] Hover effects fluides
- [ ] Lighthouse score > 90
- [ ] Compatible Safari/Firefox

---

## 📊 Résultats des tests

| Test | Status | Commentaires |
|------|--------|--------------|
| Badge URGENT présent | ⬜ À tester | |
| Animation pulse | ⬜ À tester | |
| Prix ajusté | ⬜ À tester | |
| Témoignages visibles | ⬜ À tester | |
| Responsive mobile | ⬜ À tester | |
| Accessibilité clavier | ⬜ À tester | |
| Performance Lighthouse | ⬜ À tester | |

**Légende** :
- ✅ Validé
- ❌ Échoué
- ⚠️ Partiel
- ⬜ Pas encore testé

---

## 🚀 Après validation

Une fois tous les tests passés :

1. **Commit les changements** :
   ```bash
   git add src/app/(main)/page.tsx src/app/globals.css
   git commit -m "feat(home): add urgent mission badge + social proof testimonials"
   ```

2. **Déployer en staging/prod** (selon votre process)

3. **Activer les analytics** :
   - Google Analytics : Event `click_urgent_mission`
   - Hotjar : Heatmap sur badge URGENT

4. **Monitorer les KPIs** (J+7, J+30, J+90) :
   - Taux de clic missions urgentes
   - Temps moyen sur page
   - Taux de conversion

---

## 📞 Support

**Problème technique ?**
Vérifier les fichiers de documentation :
- `PHASE_UI_HOME_URGENT_CTA.md` (détails techniques)
- `UI_HOME_VISUAL_SUMMARY.txt` (visuel ASCII)
- `UX_CHANGEMENTS_HOME_CTA.md` (stratégie UX)

**Fichiers modifiés** :
- `/Users/malik/Desktop/prestapop/src/app/(main)/page.tsx`
- `/Users/malik/Desktop/prestapop/src/app/globals.css`

**Serveur dev** : http://localhost:3001/
