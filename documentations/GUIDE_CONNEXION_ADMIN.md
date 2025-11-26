# Guide de Connexion Admin

**Date de création** : 2024  
**Version** : 1.0.0

---

## 🎯 Objectif

Ce guide explique comment créer un compte administrateur et se connecter pour accéder à toutes les fonctionnalités admin de l'application Aurora Society.

---

## 📋 Étapes pour se connecter en tant qu'admin

### Étape 1 : Créer un compte admin

1. **Accéder à la page de création admin**
   - Ouvrir votre navigateur
   - Aller à : `http://localhost:8080/create-admin` (ou `https://aurorasociety.ch/create-admin` en production)

2. **Remplir le formulaire**
   - **Prénom** : Votre prénom (ex: "Admin")
   - **Nom** : Votre nom (ex: "User")
   - **Email** : Votre adresse email (ex: `admin@aurorasociety.ch`)
   - **Nom d'utilisateur** : Optionnel (sera généré depuis l'email si vide)
   - **Téléphone mobile** : Optionnel (ex: `+0000000000`)
   - **Mot de passe** : Minimum 6 caractères
   - **Confirmation du mot de passe** : Doit correspondre au mot de passe

3. **Soumettre le formulaire**
   - Cliquer sur le bouton "Créer un nouvel administrateur"
   - Attendre la confirmation de succès

4. **Vérifier le résultat**
   - Un message de succès s'affiche avec :
     - L'email créé
     - L'ID utilisateur
   - Un bouton "Se connecter" apparaît

### Étape 2 : Se connecter avec le compte admin

1. **Accéder à la page de connexion**
   - Cliquer sur le bouton "Se connecter" après la création
   - Ou aller à : `http://localhost:8080/login`

2. **Entrer les identifiants**
   - **Email** : L'email utilisé lors de la création (ex: `admin@aurorasociety.ch`)
   - **Mot de passe** : Le mot de passe défini

3. **Se connecter**
   - Cliquer sur "Se connecter"
   - Vous serez automatiquement redirigé vers `/member-card` si la connexion réussit

### Étape 3 : Accéder au dashboard admin

Une fois connecté en tant qu'admin, vous pouvez accéder aux pages admin :

1. **Dashboard Admin** : `http://localhost:8080/admin/dashboard`
   - Vue d'ensemble des statistiques
   - Nombre d'utilisateurs, admins, membres
   - Activités récentes

2. **Gestion des Membres** : `http://localhost:8080/admin/members`
   - Liste de tous les membres
   - Créer, modifier, supprimer des membres
   - Créer de nouveaux admins

3. **Gestion des Rôles** : `http://localhost:8080/admin/roles`
   - Attribuer ou retirer le rôle admin à un utilisateur
   - Gérer les permissions

4. **Modération** : `http://localhost:8080/admin/moderation`
   - Bannir/débannir des utilisateurs
   - Gérer les sanctions

5. **Analytics** : `http://localhost:8080/admin/analytics`
   - Statistiques détaillées
   - Graphiques et analyses

---

## 🔐 Vérification du statut admin

### Comment vérifier si vous êtes admin ?

1. **Via l'interface**
   - Si vous pouvez accéder aux pages `/admin/*`, vous êtes admin
   - Les pages admin redirigent automatiquement les non-admins

2. **Via la base de données**
   - Ouvrir le Supabase Dashboard
   - Aller dans **Table Editor** → `user_roles`
   - Vérifier qu'il existe une ligne avec :
     - `user_id` = votre ID utilisateur
     - `role` = `admin`

---

## 🛠️ Dépannage

### Problème : "Vous n'avez pas les permissions"

**Solution** :
1. Vérifier que le compte a bien le rôle admin dans `user_roles`
2. Se déconnecter et se reconnecter
3. Vider le cache du navigateur

### Problème : "Could not find the function public.has_role"

**Solution** :
1. Vérifier que la migration `20251011170936_0f864b49-3e2d-4af9-b729-d14667e06c08.sql` a été appliquée
2. Appliquer la migration manuellement si nécessaire :
   ```sql
   CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
   RETURNS BOOLEAN
   LANGUAGE SQL
   STABLE
   SECURITY DEFINER
   SET search_path = public
   AS $$
     SELECT EXISTS (
       SELECT 1
       FROM public.user_roles
       WHERE user_id = _user_id
         AND role = _role
     )
   $$;
   ```

### Problème : L'Edge Function `create-admin` ne fonctionne pas

**Solution** :
1. Vérifier que l'Edge Function est déployée :
   ```bash
   npx supabase functions deploy create-admin
   ```
2. Vérifier les variables d'environnement dans Supabase Dashboard :
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (automatiquement disponible)

### Problème : Impossible de créer un admin (premier admin)

**Solution** :
- L'Edge Function `create-admin` utilise `SERVICE_ROLE_KEY` pour bypasser RLS
- Elle devrait fonctionner même sans admin existant
- Si ça ne fonctionne pas, vérifier les logs de l'Edge Function dans Supabase Dashboard

---

## 📝 Notes importantes

1. **Sécurité** :
   - La page `/create-admin` est accessible à tous
   - En production, considérer de la protéger ou la désactiver après la création du premier admin

2. **Premier admin** :
   - Le premier admin peut être créé via `/create-admin` sans authentification
   - Les admins suivants peuvent être créés via `/admin/members` (nécessite d'être admin)

3. **Conversion d'utilisateur existant** :
   - Si vous utilisez un email déjà existant, l'utilisateur sera converti en admin
   - Le rôle `member` sera supprimé et remplacé par `admin`

---

## 🔗 Liens utiles

- **Page de création admin** : `/create-admin`
- **Page de connexion** : `/login`
- **Dashboard admin** : `/admin/dashboard`
- **Documentation Create Admin** : `documentations/DOCUMENTATION_CREATE_ADMIN.md`
- **Documentation Admin Dashboard** : `documentations/DOCUMENTATION_ADMIN_DASHBOARD.md`

---

## ✅ Checklist de vérification

- [ ] Compte admin créé via `/create-admin`
- [ ] Message de succès affiché avec email et ID
- [ ] Connexion réussie avec les identifiants admin
- [ ] Accès au dashboard admin (`/admin/dashboard`)
- [ ] Vérification du rôle dans `user_roles` (optionnel)
- [ ] Accès aux autres pages admin fonctionnel

---

**Dernière mise à jour** : 2024

