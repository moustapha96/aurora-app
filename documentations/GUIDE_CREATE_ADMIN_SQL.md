# Guide : Créer un Admin via SQL

**Date de création** : 2024  
**Version** : 1.0.0

---

## 🎯 Objectif

Ce guide explique comment créer un compte administrateur directement via SQL dans Supabase, sans utiliser l'Edge Function.

---

## 📋 Méthode 1 : Via Supabase Dashboard (Recommandé)

### Étape 1 : Créer l'utilisateur dans Authentication

1. **Ouvrir le Supabase Dashboard**
   - Aller à : https://supabase.com/dashboard
   - Sélectionner votre projet : `snxhqxsbncmlusymvkwo`

2. **Créer l'utilisateur**
   - Menu de gauche → **Authentication** → **Users**
   - Cliquer sur **Add User** (ou **Invite User**)
   - Remplir :
     - **Email** : `admin@aurorasociety.ch` (ou votre email)
     - **Password** : Votre mot de passe (minimum 6 caractères)
     - **Auto Confirm User** : ✅ Cocher cette case
   - Cliquer sur **Create User**

3. **Copier l'ID utilisateur**
   - Une fois l'utilisateur créé, copier son **UUID** (ex: `123e4567-e89b-12d3-a456-426614174000`)

### Étape 2 : Exécuter le script SQL

1. **Ouvrir le SQL Editor**
   - Menu de gauche → **SQL Editor**
   - Cliquer sur **New Query**

2. **Exécuter le script**
   - Ouvrir le fichier : `documentations/SCRIPT_CREATE_ADMIN_SIMPLE.sql`
   - Remplacer `YOUR_USER_ID_HERE` par l'UUID copié à l'étape 1
   - Remplacer les autres valeurs si nécessaire (first_name, last_name, etc.)
   - Cliquer sur **Run** (ou `Ctrl+Enter`)

3. **Vérifier**
   - Le script devrait afficher "SUCCÈS: L'utilisateur ... est maintenant administrateur"

---

## 📋 Méthode 2 : Script SQL Complet (Alternative)

Si vous préférez tout faire en SQL, utilisez le script `SCRIPT_CREATE_ADMIN.sql` qui :
- Vérifie si l'utilisateur existe
- Crée/met à jour le profil
- Attribue le rôle admin

**Note** : Cette méthode nécessite que l'utilisateur existe déjà dans `auth.users`.

---

## 🔧 Script SQL Simple (Recommandé)

```sql
-- Remplacez YOUR_USER_ID_HERE par l'UUID de l'utilisateur créé dans Authentication
DO $$
DECLARE
  v_user_id UUID := 'YOUR_USER_ID_HERE';  -- MODIFIEZ ICI
  v_email TEXT := 'admin@aurorasociety.ch';
  v_first_name TEXT := 'Admin';
  v_last_name TEXT := 'User';
  v_username TEXT := 'admin';
  v_mobile_phone TEXT := '+0000000000';
BEGIN
  -- Créer ou mettre à jour le profil
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    username,
    mobile_phone,
    updated_at
  )
  VALUES (
    v_user_id,
    v_first_name,
    v_last_name,
    v_username,
    v_mobile_phone,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    username = COALESCE(EXCLUDED.username, profiles.username),
    mobile_phone = EXCLUDED.mobile_phone,
    updated_at = now();
  
  -- Supprimer le rôle member s'il existe
  DELETE FROM public.user_roles
  WHERE user_id = v_user_id
    AND role = 'member';
  
  -- Ajouter le rôle admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE 'SUCCÈS: L''utilisateur % est maintenant administrateur', v_email;
END $$;

-- Vérification
SELECT 
  u.email,
  u.id,
  p.first_name,
  p.last_name,
  ur.role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.id = 'YOUR_USER_ID_HERE'  -- MODIFIEZ ICI
  AND ur.role = 'admin';
```

---

## ✅ Vérification

### Vérifier que l'admin a été créé

Exécutez cette requête SQL :

```sql
SELECT 
  u.email,
  u.id,
  p.first_name,
  p.last_name,
  p.username,
  ur.role,
  u.email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE ur.role = 'admin';
```

Vous devriez voir votre utilisateur avec le rôle `admin`.

---

## 🔐 Se connecter

1. **Aller à la page de connexion**
   - `http://localhost:8081/login`

2. **Entrer les identifiants**
   - Email : Celui utilisé lors de la création
   - Mot de passe : Celui défini dans Authentication

3. **Accéder au dashboard admin**
   - Une fois connecté, aller à : `http://localhost:8081/admin/dashboard`

---

## 🛠️ Dépannage

### Problème : "L'utilisateur n'existe pas"

**Solution** :
1. Vérifier que l'utilisateur a bien été créé dans **Authentication** → **Users**
2. Vérifier que l'UUID utilisé dans le script correspond bien à l'ID de l'utilisateur

### Problème : "Rôle admin non attribué"

**Solution** :
1. Vérifier que la table `user_roles` existe
2. Vérifier que le type `app_role` existe avec la valeur `'admin'`
3. Exécuter manuellement :
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('YOUR_USER_ID', 'admin')
   ON CONFLICT (user_id, role) DO NOTHING;
   ```

### Problème : "Profil non créé"

**Solution** :
1. Vérifier que la table `profiles` existe
2. Vérifier que les colonnes `first_name`, `last_name`, etc. existent
3. Exécuter manuellement :
   ```sql
   INSERT INTO public.profiles (id, first_name, last_name, mobile_phone)
   VALUES ('YOUR_USER_ID', 'Admin', 'User', '+0000000000')
   ON CONFLICT (id) DO UPDATE SET
     first_name = EXCLUDED.first_name,
     last_name = EXCLUDED.last_name;
   ```

---

## 📝 Notes importantes

1. **Sécurité** :
   - Le mot de passe doit être défini dans **Authentication** → **Users**
   - Le script SQL ne peut pas créer le mot de passe directement

2. **Email confirmé** :
   - Cochez **Auto Confirm User** lors de la création pour éviter de devoir confirmer l'email

3. **Premier admin** :
   - Cette méthode fonctionne même s'il n'y a pas encore d'admin existant

---

## 🔗 Fichiers associés

- **SCRIPT_CREATE_ADMIN.sql** : Script complet avec vérifications
- **SCRIPT_CREATE_ADMIN_SIMPLE.sql** : Script simple (à créer)
- **GUIDE_CONNEXION_ADMIN.md** : Guide de connexion admin

---

**Dernière mise à jour** : 2024

