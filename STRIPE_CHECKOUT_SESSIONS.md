# Guide Stripe Checkout Sessions - Aurora Marketplace

## 📋 Vue d'Ensemble

L'application utilise maintenant **Stripe Checkout Sessions** au lieu de Payment Intents. Cette approche est plus simple et plus sécurisée.

## 🔄 Flux de Paiement

### 1. Création de la Session (Frontend → Edge Function)

**Frontend** appelle `create-payment-intent` avec :
```json
{
  "itemId": "uuid-de-l-article",
  "amount": 100.00,
  "currency": "EUR"
}
```

**Edge Function** crée une Checkout Session Stripe et retourne :
```json
{
  "sessionId": "cs_test_a1b2c3d4e5f6g7h8i9j0",
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "amount": 100.00,
  "currency": "EUR"
}
```

### 2. Redirection vers Stripe

Le frontend redirige l'utilisateur vers `session.url` pour effectuer le paiement.

### 3. Paiement et Retour

- L'utilisateur paie sur la page Stripe
- Après succès, redirection vers `success_url` : `/marketplace?payment=success&session_id={CHECKOUT_SESSION_ID}`
- En cas d'annulation, redirection vers `cancel_url` : `/marketplace?payment=cancelled`

### 4. Webhook Stripe

Stripe envoie un événement `checkout.session.completed` au webhook avec :
```json
{
  "id": "evt_...",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_...",
      "payment_status": "paid",
      "status": "complete",
      "amount_total": 2000,
      "currency": "eur",
      "customer_email": "client@example.com",
      "payment_intent": "pi_...",
      "metadata": {
        "itemId": "uuid",
        "buyerId": "uuid",
        "sellerId": "uuid"
      }
    }
  }
}
```

Le webhook met à jour :
- ✅ Statut du paiement dans `marketplace_payments` → `completed`
- ✅ Statut de l'article dans `marketplace_items` → `sold`
- ✅ Crée des notifications pour l'acheteur et le vendeur

## 📝 Configuration Requise

### Variables d'Environnement (.env)

```env
# Frontend (optionnel avec Checkout Sessions)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Secrets Supabase (Edge Functions)

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://lwfqselpqlliaxduxihu.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... ⚠️ IMPORTANT
```

## 🔔 Configuration du Webhook

Dans [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks) :

1. **URL** : `https://lwfqselpqlliaxduxihu.supabase.co/functions/v1/stripe-webhook`
2. **Événements à sélectionner** :
   - ✅ `checkout.session.completed`
   - ✅ `checkout.session.async_payment_succeeded`
   - ✅ `checkout.session.async_payment_failed`
3. **Signing secret** : Copiez et ajoutez dans `STRIPE_WEBHOOK_SECRET`

## 🧪 Test

### Cartes de Test Stripe

| Type | Numéro | Résultat |
|------|--------|----------|
| ✅ Succès | `4242 4242 4242 4242` | Paiement réussi |
| ❌ Échec | `4000 0000 0000 0002` | Paiement refusé |
| 🔐 3D Secure | `4000 0025 0000 3155` | Authentification requise |

**Informations de test** :
- Date d'expiration : n'importe quelle date future (ex: 12/34)
- CVC : n'importe quel 3 chiffres (ex: 123)
- Code postal : n'importe quel code (ex: 12345)

## 🔍 Structure de la Réponse

### Réponse de `create-payment-intent`

```typescript
{
  sessionId: string;      // ID de la session (cs_test_...)
  url: string;            // URL de redirection Stripe
  amount: number;         // Montant en unité (ex: 100.00)
  currency: string;       // Devise (ex: "EUR")
}
```

### Payload Webhook `checkout.session.completed`

```typescript
{
  id: string;                    // ID de l'événement
  type: "checkout.session.completed";
  data: {
    object: {
      id: string;                 // ID de la session
      payment_status: "paid";
      status: "complete";
      amount_total: number;       // Montant en centimes
      currency: string;          // Devise (ex: "eur")
      customer_email: string;    // Email du client
      payment_intent: string;    // ID du PaymentIntent
      metadata: {
        itemId: string;
        buyerId: string;
        sellerId: string;
      }
    }
  }
}
```

## 🚀 Avantages de Checkout Sessions

1. ✅ **Plus simple** : Pas besoin de gérer PaymentElement dans le frontend
2. ✅ **Plus sécurisé** : Le paiement se fait sur les serveurs Stripe
3. ✅ **Meilleure UX** : Interface Stripe optimisée et traduite
4. ✅ **Moins de code** : Moins de code à maintenir
5. ✅ **Support natif** : Support automatique de 3D Secure, Apple Pay, etc.

## 🐛 Dépannage

### La session n'est pas créée
- Vérifiez que `STRIPE_SECRET_KEY` est configuré
- Vérifiez les logs de l'Edge Function dans Supabase Dashboard

### Le webhook ne reçoit pas les événements
- Vérifiez que l'URL du webhook est correcte dans Stripe Dashboard
- Vérifiez que `STRIPE_WEBHOOK_SECRET` est configuré
- Vérifiez que les événements sont bien sélectionnés

### Le paiement ne se met pas à jour
- Vérifiez les logs du webhook dans Supabase Dashboard
- Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est configuré
- Vérifiez que les métadonnées sont présentes dans la session

## 📚 Documentation Stripe

- [Checkout Sessions](https://stripe.com/docs/payments/checkout)
- [Webhooks](https://stripe.com/docs/webhooks)
- [Testing](https://stripe.com/docs/testing)
