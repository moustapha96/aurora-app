# Guide de Vérification - Configuration Supabase

Ce guide vous permet de vérifier que toutes les configurations nécessaires pour la fonctionnalité Network Content sont correctement en place sur Supabase.

## 📋 Méthodes de Vérification

### Méthode 1 : Script SQL de Vérification (Recommandé)

1. **Ouvrir le Supabase Dashboard**
   - Aller sur : https://supabase.com/dashboard
   - Sélectionner votre projet : `snxhqxsbncmlusymvkwo`

2. **Ouvrir le SQL Editor**
   - Menu de gauche → **SQL Editor**
   - Cliquer sur **"New query"**

3. **Exécuter le script de vérification**
   - Ouvrir le fichier : `documentations/SCRIPT_VERIFICATION.sql`
   - Copier tout le contenu
   - Coller dans l'éditeur SQL
   - Cliquer sur **"Run"** (ou `Ctrl+Enter`)

4. **Interpréter les résultats**
   - ✓ = Élément présent et correct
   - ✗ = Élément manquant
   - ? = Élément présent mais non vérifié dans le script

### Méthode 2 : Vérification Manuelle via l'Interface

#### 1. Vérifier la table `friendships`

1. **Table Editor** → Chercher `friendships`
2. Vérifier les colonnes suivantes :
   - `id` (UUID)
   - `user_id` (UUID)
   - `friend_id` (UUID)
   - `created_at` (TIMESTAMP)
   - `business_access` (BOOLEAN)
   - `family_access` (BOOLEAN)
   - `personal_access` (BOOLEAN)
   - `influence_access` (BOOLEAN)
   - **`network_access`** (BOOLEAN) ← **Important !**

#### 2. Vérifier la table `network_content`

1. **Table Editor** → Chercher `network_content`
2. Vérifier les colonnes suivantes :
   - `id` (UUID)
   - `user_id` (UUID)
   - `section_id` (TEXT)
   - `title` (TEXT)
   - `content` (TEXT)
   - `image_url` (TEXT)
   - `social_links` (JSONB)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

#### 3. Vérifier le bucket de stockage

1. **Storage** → Chercher `network-content`
2. Vérifier que :
   - Le bucket existe
   - Il est **privé** (public = false)
   - Les politiques de stockage sont configurées

#### 4. Vérifier les politiques RLS

1. **Table Editor** → Sélectionner `friendships`
2. Cliquer sur **"Policies"** (onglet en haut)
3. Vérifier les politiques :
   - "Users can view their friendships"
   - "Users can create friendships"

4. **Table Editor** → Sélectionner `network_content`
5. Cliquer sur **"Policies"**
6. Vérifier les politiques :
   - "Users can view their own network content"
   - "Users can view friends network content"
   - "Users can insert their own network content"
   - "Users can update their own network content"
   - "Users can delete their own network content"

#### 5. Vérifier les politiques de stockage

1. **Storage** → Sélectionner `network-content`
2. Cliquer sur **"Policies"**
3. Vérifier les politiques :
   - "Users can view their own network content images"
   - "Users can view friends network content images"
   - "Users can upload their own network content images"
   - "Users can update their own network content images"
   - "Users can delete their own network content images"

### Méthode 3 : Vérification via l'Application

1. **Se connecter à l'application**
   - Ouvrir l'application en local : `http://localhost:8080`
   - Se connecter avec un compte utilisateur

2. **Tester la page Network**
   - Naviguer vers `/network` ou `/network/{user_id}`
   - Vérifier que :
     - La page se charge sans erreur
     - Les sections (Social, Media, Philanthropy) s'affichent
     - Vous pouvez éditer votre propre contenu
     - Vous pouvez voir le contenu de vos amis (si `network_access = true`)

3. **Tester l'upload d'images**
   - Essayer d'uploader une image dans une section
   - Vérifier que l'image s'affiche correctement
   - Vérifier dans la console du navigateur qu'il n'y a pas d'erreurs

4. **Tester les liens sociaux**
   - Ajouter/modifier des liens sociaux
   - Vérifier qu'ils sont sauvegardés et affichés

## ✅ Checklist de Vérification

- [ ] Table `friendships` existe
- [ ] Colonne `network_access` existe dans `friendships`
- [ ] Table `network_content` existe
- [ ] Bucket `network-content` existe
- [ ] RLS activé sur `friendships`
- [ ] RLS activé sur `network_content`
- [ ] Politiques RLS configurées pour `friendships` (2 politiques)
- [ ] Politiques RLS configurées pour `network_content` (5 politiques)
- [ ] Politiques de stockage configurées pour `network-content` (5 politiques)
- [ ] Index créés sur `friendships` (user_id, friend_id)
- [ ] Index créés sur `network_content` (user_id, section_id)
- [ ] Trigger `update_network_content_updated_at` créé
- [ ] Fonction `update_updated_at_column()` existe

## 🔍 Dépannage

### Problème : Table `friendships` n'existe pas

**Solution :** Exécuter le script `documentations/SCRIPT_CREATE_FRIENDSHIPS.sql`

### Problème : Colonne `network_access` manquante

**Solution :** Exécuter cette commande SQL :
```sql
ALTER TABLE public.friendships 
ADD COLUMN IF NOT EXISTS network_access boolean DEFAULT true;
```

### Problème : Table `network_content` n'existe pas

**Solution :** Appliquer la migration `20251114000000_create_network_content.sql` via :
- `npx supabase db push` (si migrations configurées)
- Ou copier-coller le contenu dans le SQL Editor

### Problème : Erreurs de permissions lors de l'upload

**Vérifier :**
1. Les politiques de stockage sont bien configurées
2. Le bucket `network-content` existe
3. L'utilisateur est authentifié
4. Les politiques RLS sur `friendships` permettent l'accès

### Problème : Impossible de voir le contenu des amis

**Vérifier :**
1. Une relation `friendships` existe entre les utilisateurs
2. La colonne `network_access` est à `true` dans `friendships`
3. La politique "Users can view friends network content" existe

## 📞 Support

Si vous rencontrez des problèmes après avoir suivi ce guide, vérifiez :
1. Les logs dans la console du navigateur (F12)
2. Les logs Supabase dans le Dashboard → Logs
3. Les erreurs dans le SQL Editor après exécution des scripts

