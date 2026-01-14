# Configuration Stripe pour le Marketplace Aurora Society

## ✅ Statut de Configuration

### ✅ Secrets Backend (Configurés)

Les secrets suivants sont configurés dans Lovable Cloud :

- `STRIPE_SECRET_KEY` - Clé secrète Stripe
- `STRIPE_WEBHOOK_SECRET` - Secret du webhook

### ✅ Edge Functions (Déployées)

- `create-payment-intent` - Crée un PaymentIntent pour les achats
- `stripe-webhook` - Reçoit les notifications Stripe

### ✅ Table Database (Créée)

La table `marketplace_payments` est créée avec :
- Référence à `marketplace_items`
- Tracking acheteur/vendeur
- Statut du paiement (pending, completed, failed, refunded)
- Indexes pour les performances
- RLS policies pour la sécurité

---

## 🔔 Configuration du Webhook Stripe (Action Requise)

Dans votre [Dashboard Stripe](https://dashboard.stripe.com/webhooks) :

1. Cliquez sur **Add endpoint**
2. **URL du Webhook** : 
   ```
   https://lwfqselpqlliaxduxihu.supabase.co/functions/v1/stripe-webhook
   ```
3. Sélectionnez les événements :
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Le **Signing secret** a déjà été configuré dans `STRIPE_WEBHOOK_SECRET`

---

## 🧪 Test en Mode Test

Utilisez les cartes de test Stripe :

| Type | Numéro | Résultat |
|------|--------|----------|
| ✅ Succès | `4242 4242 4242 4242` | Paiement réussi |
| ❌ Échec | `4000 0000 0000 0002` | Paiement refusé |
| 🔐 3D Secure | `4000 0025 0000 3155` | Authentification requise |

- **Date d'expiration** : n'importe quelle date future (ex: 12/34)
- **CVC** : n'importe quel 3 chiffres (ex: 123)
- **Code postal** : n'importe quel code (ex: 12345)

---

## 🚀 Passage en Production

Pour passer en production :

1. Passez en mode **Live** dans [Stripe Dashboard](https://dashboard.stripe.com)
2. Mettez à jour `STRIPE_SECRET_KEY` avec la clé live (sk_live_...)
3. Créez un nouveau webhook avec la même URL
4. Mettez à jour `STRIPE_WEBHOOK_SECRET` avec le nouveau signing secret

---

## 📝 Notes de Sécurité

- ⚠️ **Ne jamais** exposer `STRIPE_SECRET_KEY` dans le frontend
- ⚠️ **Toujours** utiliser HTTPS en production
- ⚠️ **Valider** les montants côté serveur via l'Edge Function
- ⚠️ **Vérifier** les webhooks avec le secret pour éviter les fraudes


# webhook : 
https://lwfqselpqlliaxduxihu.supabase.co/functions/v1/stripe-webhook
