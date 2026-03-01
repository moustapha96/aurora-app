# Guide Complet de Configuration Stripe pour Aurora Marketplace

## 📋 Checklist de Configuration

### ✅ 1. Variables d'Environnement Backend (Supabase Edge Functions)

Dans votre projet Supabase, configurez les secrets suivants :

1. **STRIPE_SECRET_KEY**
   - Mode Test : `sk_test_...`
   - Mode Production : `sk_live_...`
   - Où trouver : [Stripe Dashboard > Developers > API keys](https://dashboard.stripe.com/apikeys)

2. **STRIPE_WEBHOOK_SECRET**
   - Mode Test : `whsec_...` (depuis le dashboard Stripe)
   - Mode Production : `whsec_...` (depuis le dashboard Stripe)
   - Où trouver : Après avoir créé le webhook dans Stripe Dashboard

3. **SUPABASE_URL**
   - Format : `https://[project-id].supabase.co`
   - Où trouver : Dashboard Supabase > Settings > API

4. **SUPABASE_ANON_KEY**
   - Clé publique anonyme
   - Où trouver : Dashboard Supabase > Settings > API

5. **SUPABASE_SERVICE_ROLE_KEY** ⚠️ **IMPORTANT**
   - Clé service role (bypass RLS)
   - Où trouver : Dashboard Supabase > Settings > API
   - ⚠️ **Ne jamais exposer cette clé dans le frontend**

### ✅ 2. Variables d'Environnement Frontend (.env)

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... ou pk_live_...
```

Où trouver : [Stripe Dashboard > Developers > API keys](https://dashboard.stripe.com/apikeys)

### ✅ 3. Configuration du Webhook Stripe

1. Allez sur [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Cliquez sur **"Add endpoint"**
3. **URL du Webhook** :
   ```
   https://lwfqselpqlliaxduxihu.supabase.co/functions/v1/stripe-webhook
   ```
4. Sélectionnez les événements :
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
5. Copiez le **Signing secret** (commence par `whsec_`)
6. Ajoutez-le dans les secrets Supabase comme `STRIPE_WEBHOOK_SECRET`

### ✅ 4. Base de Données

Assurez-vous que les migrations suivantes sont appliquées :

- ✅ `20250104121539_eacd53a5-1760-41be-8348-18b6130909c7.sql` (marketplace_items)
- ✅ `20250114205224_a1c8e66f-60b7-492c-9599-c144eeef2eda.sql` (marketplace_payments)
- ✅ `20250128000000_fix_marketplace_payments_rls.sql` (fix RLS policies)

### ✅ 5. Edge Functions

Assurez-vous que les fonctions suivantes sont déployées :

- ✅ `create-payment-intent` - Crée les PaymentIntents
- ✅ `stripe-webhook` - Gère les notifications Stripe

## 🔧 Vérification de la Configuration

### Test 1 : Vérifier les Variables d'Environnement

Dans Supabase Dashboard > Edge Functions > `create-payment-intent` :
- Vérifiez que tous les secrets sont configurés
- Testez la fonction avec un appel de test

### Test 2 : Vérifier le Webhook

1. Dans Stripe Dashboard > Webhooks
2. Cliquez sur votre webhook
3. Vérifiez que l'URL est correcte
4. Testez en envoyant un événement de test

### Test 3 : Tester un Paiement

Utilisez les cartes de test Stripe :

| Type | Numéro | Résultat |
|------|--------|----------|
| ✅ Succès | `4242 4242 4242 4242` | Paiement réussi |
| ❌ Échec | `4000 0000 0000 0002` | Paiement refusé |
| 🔐 3D Secure | `4000 0025 0000 3155` | Authentification requise |

**Informations de test :**
- Date d'expiration : n'importe quelle date future (ex: 12/34)
- CVC : n'importe quel 3 chiffres (ex: 123)
- Code postal : n'importe quel code (ex: 12345)

## 🐛 Résolution des Problèmes

### Erreur 500 : "STRIPE_NOT_CONFIGURED"
- ✅ Vérifiez que `STRIPE_SECRET_KEY` est configuré dans Supabase
- ✅ Vérifiez que la clé commence par `sk_test_` ou `sk_live_`

### Erreur 500 : "SUPABASE_NOT_CONFIGURED"
- ✅ Vérifiez que `SUPABASE_URL` et `SUPABASE_ANON_KEY` sont configurés
- ✅ Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est configuré (important pour les insertions)

### Erreur 401 : "UNAUTHORIZED"
- ✅ Vérifiez que l'utilisateur est connecté
- ✅ Vérifiez que le token JWT est valide

### Erreur 500 : "DATABASE_INSERT_ERROR"
- ✅ Vérifiez que la table `marketplace_payments` existe
- ✅ Vérifiez que les RLS policies sont correctement configurées
- ✅ Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est utilisé pour les insertions

### Erreur : "Payment Intent creation error"
- ✅ Vérifiez que la clé Stripe est valide
- ✅ Vérifiez que le compte Stripe est actif
- ✅ Vérifiez les logs Stripe Dashboard pour plus de détails

## 📊 Flux de Paiement

1. **Création du Payment Intent**
   - L'utilisateur clique sur "Acheter"
   - Le frontend appelle `create-payment-intent`
   - La fonction crée un PaymentIntent Stripe
   - La fonction enregistre le paiement dans `marketplace_payments` avec le statut "pending"

2. **Confirmation du Paiement**
   - L'utilisateur saisit ses informations de carte
   - Stripe confirme le paiement
   - Si 3D Secure est requis, redirection puis retour

3. **Webhook Stripe**
   - Stripe envoie un événement `payment_intent.succeeded`
   - Le webhook met à jour le statut à "completed"
   - Le webhook marque l'article comme "sold"
   - Le webhook crée des notifications pour l'acheteur et le vendeur

## 🚀 Passage en Production

1. **Stripe**
   - Passez en mode **Live** dans Stripe Dashboard
   - Récupérez les clés live (`sk_live_...` et `pk_live_...`)
   - Créez un nouveau webhook avec la même URL
   - Récupérez le nouveau signing secret

2. **Supabase**
   - Mettez à jour `STRIPE_SECRET_KEY` avec la clé live
   - Mettez à jour `STRIPE_WEBHOOK_SECRET` avec le nouveau secret
   - Vérifiez que toutes les variables sont configurées

3. **Frontend**
   - Mettez à jour `VITE_STRIPE_PUBLISHABLE_KEY` avec la clé live

4. **Test**
   - Testez avec une vraie carte (petit montant)
   - Vérifiez que les webhooks fonctionnent
   - Vérifiez que les notifications sont créées

## 📝 Notes Importantes

- ⚠️ **Ne jamais** exposer `STRIPE_SECRET_KEY` ou `SUPABASE_SERVICE_ROLE_KEY` dans le frontend
- ⚠️ **Toujours** utiliser HTTPS en production
- ⚠️ **Valider** les montants côté serveur (déjà fait dans l'Edge Function)
- ⚠️ **Vérifier** les webhooks avec le secret pour éviter les fraudes
- ⚠️ **Tester** régulièrement les webhooks pour s'assurer qu'ils fonctionnent

## 🔗 Liens Utiles

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
