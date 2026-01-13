# Guide de Test - Authentification à Deux Facteurs (2FA)

Ce guide vous permet de vérifier que l'authentification à deux facteurs fonctionne correctement dans votre application.

## ✅ Vérifications Préalables

### 1. Base de données
- [ ] La table `two_factor_codes` existe dans Supabase
- [ ] La colonne `two_factor_enabled` existe dans la table `profiles`
- [ ] Les migrations ont été appliquées

### 2. Fonctions Edge Supabase
- [ ] La fonction `send-2fa-code` est déployée
- [ ] La fonction `verify-2fa-code` est déployée
- [ ] Les variables d'environnement SMTP sont configurées

### 3. Configuration SMTP
- [ ] Les variables d'environnement suivantes sont configurées dans Supabase :
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASSWORD`
  - `SMTP_FROM_EMAIL`
  - `SMTP_FROM_NAME`

## 🧪 Tests à Effectuer

### Test 1 : Activation de la 2FA

1. **Connectez-vous** à votre compte
2. **Allez dans** Paramètres → Sécurité (`/security-settings`)
3. **Activez** l'authentification à deux facteurs en basculant le switch
4. **Vérifiez** qu'un code de vérification est envoyé par email
5. **Entrez** le code à 6 chiffres reçu
6. **Vérifiez** que la 2FA est activée (badge vert "Activée")

**Résultat attendu :**
- ✅ Un email avec un code à 6 chiffres est reçu
- ✅ Le code peut être entré dans les 6 champs
- ✅ La vérification réussit
- ✅ Le statut passe à "2FA activée"

### Test 2 : Connexion avec 2FA activée

1. **Déconnectez-vous** de votre compte
2. **Connectez-vous** avec votre email et mot de passe
3. **Vérifiez** qu'après la connexion, un écran de vérification 2FA apparaît
4. **Vérifiez** qu'un code est automatiquement envoyé par email
5. **Entrez** le code reçu
6. **Vérifiez** que la connexion se complète après la vérification

**Résultat attendu :**
- ✅ Après la connexion, l'écran 2FA s'affiche
- ✅ Un email avec le code est reçu automatiquement
- ✅ La connexion se complète après vérification du code
- ✅ Vous êtes redirigé vers la page d'accueil

### Test 3 : Code invalide

1. **Tentez** de vous connecter avec la 2FA activée
2. **Entrez** un code incorrect (ex: 000000)
3. **Vérifiez** qu'un message d'erreur s'affiche
4. **Vérifiez** que vous pouvez réessayer

**Résultat attendu :**
- ✅ Message d'erreur : "Code invalide, veuillez réessayer"
- ✅ Les champs se réinitialisent
- ✅ Vous pouvez réessayer avec un nouveau code

### Test 4 : Code expiré

1. **Demandez** un code de vérification
2. **Attendez** plus de 5 minutes
3. **Tentez** d'utiliser le code expiré
4. **Vérifiez** qu'un message d'erreur s'affiche
5. **Demandez** un nouveau code

**Résultat attendu :**
- ✅ Message d'erreur : "Code invalide ou expiré"
- ✅ Vous pouvez demander un nouveau code
- ✅ Le nouveau code fonctionne

### Test 5 : Renvoyer le code

1. **Tentez** de vous connecter avec la 2FA activée
2. **Cliquez** sur "Renvoyer le code"
3. **Vérifiez** qu'un nouveau code est envoyé
4. **Vérifiez** qu'un compte à rebours de 60 secondes s'affiche
5. **Vérifiez** que le bouton est désactivé pendant le compte à rebours

**Résultat attendu :**
- ✅ Un nouveau code est reçu par email
- ✅ Le bouton affiche "Renvoyer le code (60s)" puis décompte
- ✅ Le bouton est désactivé pendant le compte à rebours
- ✅ Après 60 secondes, vous pouvez renvoyer un nouveau code

### Test 6 : Désactivation de la 2FA

1. **Allez dans** Paramètres → Sécurité
2. **Désactivez** la 2FA en basculant le switch
3. **Vérifiez** que la 2FA est désactivée
4. **Déconnectez-vous** et reconnectez-vous
5. **Vérifiez** qu'aucun code n'est demandé

**Résultat attendu :**
- ✅ La 2FA se désactive immédiatement
- ✅ Message de confirmation : "2FA désactivée"
- ✅ Lors de la reconnexion, aucun code n'est demandé
- ✅ La connexion se fait normalement

### Test 7 : Annulation de la vérification

1. **Tentez** de vous connecter avec la 2FA activée
2. **Cliquez** sur "Annuler" dans l'écran de vérification
3. **Vérifiez** que vous êtes déconnecté
4. **Vérifiez** qu'un message d'information s'affiche

**Résultat attendu :**
- ✅ Vous êtes déconnecté
- ✅ Message : "Connexion annulée"
- ✅ Vous pouvez réessayer de vous connecter

## 🔍 Vérifications Techniques

### Console du navigateur

Ouvrez la console du navigateur (F12) et vérifiez :

1. **Lors de l'envoi du code :**
   ```
   data: { success: true }
   error: null
   ```

2. **Lors de la vérification :**
   ```
   data: { success: true, valid: true }
   error: null
   ```

### Logs Supabase

Vérifiez les logs des fonctions Edge dans Supabase :

1. **Fonction `send-2fa-code` :**
   - Vérifiez qu'elle reçoit bien `userId`, `email`, `language`
   - Vérifiez qu'un code est inséré dans `two_factor_codes`
   - Vérifiez que l'email est envoyé avec succès

2. **Fonction `verify-2fa-code` :**
   - Vérifiez qu'elle reçoit bien `userId` et `code`
   - Vérifiez que le code est trouvé dans la base de données
   - Vérifiez que le code est marqué comme utilisé

### Base de données

Vérifiez dans Supabase :

1. **Table `two_factor_codes` :**
   ```sql
   SELECT * FROM two_factor_codes 
   WHERE user_id = 'VOTRE_USER_ID' 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```
   - Vérifiez que les codes sont créés
   - Vérifiez que les codes expirés sont supprimés
   - Vérifiez que les codes utilisés sont marqués `used = true`

2. **Table `profiles` :**
   ```sql
   SELECT id, two_factor_enabled 
   FROM profiles 
   WHERE id = 'VOTRE_USER_ID';
   ```
   - Vérifiez que `two_factor_enabled` est `true` quand activé
   - Vérifiez que `two_factor_enabled` est `false` quand désactivé

## 🐛 Problèmes Courants

### Le code n'est pas reçu par email

**Causes possibles :**
- Configuration SMTP incorrecte
- Email dans les spams
- Problème avec le service d'email

**Solutions :**
1. Vérifiez les variables d'environnement SMTP dans Supabase
2. Vérifiez les logs de la fonction `send-2fa-code`
3. Testez l'envoi d'email avec la fonction `test-email`

### Le code est toujours invalide

**Causes possibles :**
- Code expiré (valide 5 minutes)
- Code déjà utilisé
- Problème de synchronisation

**Solutions :**
1. Demandez un nouveau code
2. Vérifiez que le code n'a pas été utilisé
3. Vérifiez les logs de la fonction `verify-2fa-code`

### La 2FA ne s'active pas

**Causes possibles :**
- Erreur lors de la mise à jour du profil
- Problème de permissions RLS

**Solutions :**
1. Vérifiez les logs de la console
2. Vérifiez les permissions RLS sur la table `profiles`
3. Vérifiez que l'utilisateur est bien authentifié

## ✅ Checklist Complète

- [ ] Activation de la 2FA fonctionne
- [ ] Code reçu par email
- [ ] Vérification du code fonctionne
- [ ] Connexion avec 2FA fonctionne
- [ ] Code invalide rejeté
- [ ] Code expiré rejeté
- [ ] Renvoi de code fonctionne
- [ ] Désactivation de la 2FA fonctionne
- [ ] Annulation de la vérification fonctionne
- [ ] Pas d'erreurs dans la console
- [ ] Logs Supabase corrects
- [ ] Base de données mise à jour correctement

## 📝 Notes

- Les codes sont valides pendant **5 minutes**
- Il y a un délai de **60 secondes** entre chaque envoi de code
- Les codes expirés sont automatiquement nettoyés
- Les codes utilisés sont marqués comme `used = true`
