# Configuration Stripe pour le Marketplace Aurora Society

## ✅ Statut de Configuration

### ✅ Secrets Backend (Configurés)

Les secrets suivants sont configurés dans Lovable Cloud :

- `STRIPE_SECRET_KEY` - Clé secrète Stripe
- `STRIPE_WEBHOOK_SECRET` - Secret du webhook

### ✅ Edge Functions (Déployées)

- `create-payment-intent` - Crée une Checkout Session Stripe pour les achats
- `stripe-webhook` - Reçoit les notifications Stripe (gère `checkout.session.completed`)

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
   - ✅ `checkout.session.completed` - Paiement réussi
   - ✅ `checkout.session.async_payment_succeeded` - Paiement asynchrone réussi
   - ✅ `checkout.session.async_payment_failed` - Paiement asynchrone échoué
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

---

## 🔧 Migration vers Stripe Checkout Sessions

### ✅ Changements Majeurs

1. **Checkout Sessions au lieu de Payment Intents**
   - Utilisation de `stripe.checkout.sessions.create()` pour créer une session
   - Redirection vers la page de paiement Stripe (plus simple et sécurisé)
   - Plus besoin de `PaymentElement` dans le frontend

2. **Webhook mis à jour**
   - Gère maintenant `checkout.session.completed` au lieu de `payment_intent.succeeded`
   - Support des paiements asynchrones (`async_payment_succeeded`, `async_payment_failed`)
   - Utilise les métadonnées de la session pour identifier l'achat

3. **Frontend simplifié**
   - Plus besoin de `@stripe/react-stripe-js` ou `PaymentElement`
   - Simple redirection vers l'URL de la session Stripe
   - Retour automatique après paiement via `success_url`

4. **Gestion CORS** : Ajout de la gestion CORS dans le webhook
   - Support des requêtes OPTIONS pour les pré-vols CORS
   - Headers CORS correctement configurés

5. **Gestion d'Erreurs** : Amélioration de la gestion des erreurs
   - Meilleure gestion des erreurs dans le webhook
   - Messages d'erreur plus clairs pour l'utilisateur
   - Logs d'erreur améliorés pour le débogage

---

## 🔗 URL du Webhook

```
https://lwfqselpqlliaxduxihu.supabase.co/functions/v1/stripe-webhook
```

---

## 📋 Variables d'Environnement Requises

### Frontend (.env)
- `VITE_STRIPE_PUBLISHABLE_KEY` - Clé publique Stripe (pk_test_... ou pk_live_...)
  - ⚠️ **Note** : Avec Checkout Sessions, cette clé n'est plus nécessaire dans le frontend, mais peut être utile pour d'autres fonctionnalités

### Backend (Secrets Supabase)
- `STRIPE_SECRET_KEY` - Clé secrète Stripe (sk_test_... ou sk_live_...)
- `STRIPE_WEBHOOK_SECRET` - Secret de signature du webhook
- `SUPABASE_URL` - URL de votre projet Supabase
- `SUPABASE_ANON_KEY` - Clé anonyme Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Clé service role (pour le webhook)
