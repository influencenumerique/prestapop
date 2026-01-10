# Stripe Quick Start Guide

## Installation et Configuration Rapide

### 1. Variables d'Environnement

Copier `.env.example` vers `.env` et remplir les clés Stripe :

```bash
cp .env.example .env
```

Obtenir vos clés Stripe sur https://dashboard.stripe.com/apikeys

```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2. Installer Stripe CLI (pour tests locaux)

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin
```

### 3. Configurer le Webhook Local

```bash
# Se connecter à Stripe
stripe login

# Écouter les événements Stripe et les forwader à votre API
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copier le webhook secret affiché (`whsec_...`) dans votre `.env` :
```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 4. Démarrer l'Application

```bash
npm run dev
```

---

## Test Rapide du Flux de Paiement

### Scénario 1 : Paiement via Checkout Session

1. **Créer une mission** (en tant que Company)
   ```bash
   curl -X POST http://localhost:3000/api/jobs \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
     -d '{
       "title": "Livraison Paris 11e",
       "typeMission": "DAY",
       "missionZoneType": "URBAN",
       "secteurLivraison": "Paris 11e, 12e, 20e",
       "packageSize": "MIXED",
       "nombreColis": 50,
       "startTime": "2026-01-10T08:00:00Z",
       "estimatedEndTime": "2026-01-10T18:00:00Z",
       "vehicleVolume": "CUBE_12M",
       "needsTailLift": false,
       "dayRate": 15000,
       "status": "OPEN"
     }'
   ```

2. **Postuler à la mission** (en tant que Driver)
   ```bash
   curl -X POST http://localhost:3000/api/jobs/{jobId}/apply \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=YOUR_DRIVER_TOKEN" \
     -d '{
       "proposedPrice": 15000,
       "message": "Je suis disponible"
     }'
   ```

3. **Marquer comme livré** (en tant que Driver)
   ```bash
   curl -X PATCH http://localhost:3000/api/bookings/{bookingId} \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=YOUR_DRIVER_TOKEN" \
     -d '{
       "status": "DELIVERED",
       "deliveredAt": "2026-01-10T18:00:00Z"
     }'
   ```

4. **Créer le paiement** (en tant que Company)
   ```bash
   curl -X POST http://localhost:3000/api/stripe/checkout \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
     -d '{
       "bookingId": "booking_xxx"
     }'
   ```

   Réponse : `{ "url": "https://checkout.stripe.com/..." }`

5. **Accéder au Checkout** : Ouvrir l'URL dans un navigateur

6. **Payer avec une carte de test** :
   - Numéro : `4242 4242 4242 4242`
   - Date : n'importe quelle date future
   - CVC : n'importe quel 3 chiffres

7. **Vérifier le webhook** :
   Dans le terminal où Stripe CLI tourne, vous verrez :
   ```
   [200] POST http://localhost:3000/api/stripe/webhook [evt_xxx]
   ```

8. **Vérifier le statut** :
   ```bash
   curl http://localhost:3000/api/stripe/payment-intent?bookingId=booking_xxx \
     -H "Cookie: next-auth.session-token=YOUR_TOKEN"
   ```

   Réponse : `{ "status": "succeeded", "amount": 15000, "paidAt": "..." }`

---

### Scénario 2 : Paiement via PaymentIntent

Pour tester avec Stripe Elements (frontend personnalisé) :

1. **Créer le PaymentIntent**
   ```bash
   curl -X POST http://localhost:3000/api/stripe/payment-intent \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
     -d '{
       "bookingId": "booking_xxx"
     }'
   ```

   Réponse : `{ "clientSecret": "pi_xxx_secret_yyy", "paymentIntentId": "pi_xxx" }`

2. **Côté frontend** : Utiliser `clientSecret` avec Stripe Elements (voir `STRIPE_FRONTEND_EXAMPLES.md`)

---

### Scénario 3 : Remboursement

1. **Créer un remboursement**
   ```bash
   curl -X POST http://localhost:3000/api/stripe/refund \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
     -d '{
       "bookingId": "booking_xxx",
       "reason": "requested_by_customer"
     }'
   ```

   Réponse :
   ```json
   {
     "success": true,
     "refundId": "re_xxx",
     "amount": 15000,
     "status": "succeeded"
   }
   ```

2. **Vérifier le webhook** : Le webhook `charge.refunded` mettra à jour le booking à `CANCELLED`

---

## Cartes de Test Stripe

| Carte | Résultat |
|-------|----------|
| `4242 4242 4242 4242` | Paiement réussi |
| `4000 0000 0000 0002` | Carte refusée |
| `4000 0000 0000 9995` | Fonds insuffisants |
| `4000 0000 0000 9987` | Carte perdue |
| `4000 0000 0000 0069` | Carte expirée |
| `4000 0000 0000 0127` | CVC incorrect |

Pour plus de cartes de test : https://stripe.com/docs/testing

---

## Vérifications Rapides

### Vérifier que Stripe est configuré

```bash
node -e "console.log(require('stripe')(process.env.STRIPE_SECRET_KEY).VERSION)"
```

### Vérifier les webhooks

```bash
stripe events list --limit 5
```

### Vérifier les paiements

```bash
stripe payment_intents list --limit 5
```

### Vérifier les remboursements

```bash
stripe refunds list --limit 5
```

---

## Déboguer les Problèmes Courants

### Problème : Webhook signature invalide

**Solution :** Vérifier que `STRIPE_WEBHOOK_SECRET` est correct
```bash
# Obtenir le secret avec Stripe CLI
stripe listen --print-secret
```

### Problème : Paiement bloqué sur "pending"

**Cause :** Le webhook ne reçoit pas les événements

**Solution :**
1. Vérifier que Stripe CLI est en cours d'exécution
2. Vérifier les logs du webhook dans la console
3. Vérifier que l'URL du webhook est correcte

### Problème : "Cette mission ne peut pas être payée"

**Cause :** La mission n'est pas au statut `DELIVERED`

**Solution :** Mettre à jour le statut du booking :
```bash
curl -X PATCH http://localhost:3000/api/bookings/{bookingId} \
  -H "Content-Type: application/json" \
  -d '{"status": "DELIVERED"}'
```

### Problème : Double-paiement

**Cause :** Protection activée

**Solution :** C'est voulu ! Impossible de payer deux fois la même mission.

---

## Logs et Monitoring

### Voir les logs webhook

```bash
# Logs console
tail -f .next/server/app/api/stripe/webhook/route.js.map

# Ou dans la sortie de `npm run dev`
```

### Stripe Dashboard

Accéder à https://dashboard.stripe.com/test/payments pour voir :
- Tous les paiements
- Statuts des paiements
- Remboursements
- Webhooks events
- Logs

---

## Passer en Production

### 1. Obtenir les clés de production

Sur https://dashboard.stripe.com/apikeys, basculer vers "Production"

### 2. Configurer le webhook en production

1. Aller sur https://dashboard.stripe.com/webhooks
2. Cliquer "Add endpoint"
3. URL : `https://votredomaine.com/api/stripe/webhook`
4. Événements à écouter :
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `account.updated`
5. Copier le "Signing secret" (`whsec_...`)

### 3. Mettre à jour les variables d'environnement

```env
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_APP_URL="https://votredomaine.com"
```

### 4. Activer Stripe Connect pour les chauffeurs

Voir la section "Stripe Connect" dans `STRIPE_INTEGRATION.md`

---

## Ressources Utiles

- **Documentation complète** : `STRIPE_INTEGRATION.md`
- **Exemples frontend** : `STRIPE_FRONTEND_EXAMPLES.md`
- **Routes API** : `API_ROUTES_SUMMARY.md`
- **Phase complète** : `PHASE_API_JOBS_STRIPE.md`

- **Stripe Docs** : https://stripe.com/docs
- **Stripe Dashboard** : https://dashboard.stripe.com
- **Stripe CLI Docs** : https://stripe.com/docs/stripe-cli

---

## Support

Pour toute question :
1. Consulter la documentation dans les fichiers MD
2. Vérifier les logs de l'API et du webhook
3. Consulter le Stripe Dashboard
4. Contacter le support Stripe : https://support.stripe.com
