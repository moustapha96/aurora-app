# Guide de Configuration Supabase - Network Content

**Date de création** : Décembre 2024  
**Version** : 1.0.0

---

## 🚀 Configuration Rapide (Recommandé)

### Option 1 : Via Migration (Automatique)

La migration `20241203000000_create_network_content.sql` contient tout le nécessaire.

**Étapes :**

1. **Appliquer la migration :**
   ```bash
   npx supabase migration up
   ```

2. **Vérifier la configuration :**
   - Aller dans Supabase Dashboard > Table Editor > `network_content`
   - Aller dans Supabase Dashboard > Storage > `network-content`

**✅ C'est tout !** La migration crée automatiquement :
- La table `network_content`
- Le bucket `network-content`
- Toutes les RLS policies
- Toutes les storage policies
- Les index et triggers

---

### Option 2 : Via SQL Script (Manuel)

Si vous préférez exécuter manuellement :

1. **Ouvrir Supabase Dashboard > SQL Editor**

2. **Copier-coller le contenu de :**
   - `documentations/SCRIPT_SETUP_NETWORK.sql`

3. **Exécuter le script**

4. **Vérifier la configuration** (voir section Vérification ci-dessous)

---

## 📋 Configuration Détaillée

### 1. Table `network_content`

**Créée automatiquement par la migration.**

**Structure :**
- `id` : UUID (Primary Key)
- `user_id` : UUID (Foreign Key vers auth.users)
- `section_id` : TEXT (social, media, philanthropy)
- `title` : TEXT
- `content` : TEXT
- `image_url` : TEXT
- `social_links` : JSONB
- `created_at` : TIMESTAMP
- `updated_at` : TIMESTAMP

**Contraintes :**
- UNIQUE(user_id, section_id) - Un seul enregistrement par section par utilisateur
- CHECK section_id IN ('social', 'media', 'philanthropy')

### 2. Bucket de Storage `network-content`

**Créé automatiquement par la migration.**

**Configuration :**
- **Nom** : `network-content`
- **Public** : ❌ Non (privé)
- **Taille max** : 10 MB (configurable)
- **Types MIME autorisés** : `image/*` (configurable)

**Structure des dossiers :**
```
network-content/
  {user_id}/
    {timestamp}.{extension}
```

### 3. RLS Policies (Table)

**5 policies créées automatiquement :**

1. **View own content** - Les utilisateurs voient leur propre contenu
2. **View friends content** - Les utilisateurs voient le contenu de leurs amis (si `network_access = true`)
3. **Insert own content** - Les utilisateurs créent leur propre contenu
4. **Update own content** - Les utilisateurs modifient leur propre contenu
5. **Delete own content** - Les utilisateurs suppriment leur propre contenu

### 4. Storage Policies (Bucket)

**5 policies créées automatiquement :**

1. **View own images** - Les utilisateurs voient leurs propres images
2. **View friends images** - Les utilisateurs voient les images de leurs amis (si `network_access = true`)
3. **Upload own images** - Les utilisateurs uploadent dans leur propre dossier
4. **Update own images** - Les utilisateurs modifient leurs propres images
5. **Delete own images** - Les utilisateurs suppriment leurs propres images

---

## ✅ Vérification

### Vérifier la table

**Dans Supabase Dashboard > Table Editor :**

1. Cliquer sur `network_content`
2. Vérifier que les colonnes sont présentes
3. Optionnel : Insérer un enregistrement de test

**Requête SQL :**
```sql
SELECT * FROM network_content LIMIT 5;
```

### Vérifier le bucket

**Dans Supabase Dashboard > Storage :**

1. Vérifier que le bucket `network-content` existe
2. Vérifier qu'il est marqué comme "Private"
3. Vérifier les limites (10 MB, image/*)

**Requête SQL :**
```sql
SELECT * FROM storage.buckets WHERE id = 'network-content';
```

### Vérifier les RLS Policies

**Dans Supabase Dashboard > Authentication > Policies :**

1. Filtrer par table : `network_content`
2. Vérifier que 5 policies sont actives

**Requête SQL :**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'network_content' 
AND schemaname = 'public';
```

### Vérifier les Storage Policies

**Dans Supabase Dashboard > Storage > network-content > Policies :**

1. Vérifier que 5 policies sont actives
2. Vérifier les conditions USING/WITH CHECK

**Requête SQL :**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%network content%';
```

---

## 🧪 Tests

### Test 1 : Création de contenu

1. Se connecter à l'application
2. Aller sur `/network`
3. Cliquer sur "Modifier" dans une section
4. Ajouter du contenu :
   ```
   Instagram: @test_user
   LinkedIn: https://linkedin.com/in/test
   ```
5. Ajouter des liens sociaux dans le formulaire
6. Cliquer sur "Enregistrer"
7. **Vérifier dans Supabase Dashboard > Table Editor > `network_content`** que les données sont sauvegardées

### Test 2 : Upload d'image

1. Dans une section, cliquer sur l'image
2. Uploader une nouvelle image
3. **Vérifier dans Supabase Dashboard > Storage > `network-content`** que l'image est uploadée dans le dossier `{user_id}/`
4. Vérifier que l'image s'affiche correctement dans l'application

### Test 3 : Permissions

1. Créer deux comptes utilisateurs (User A et User B)
2. Se connecter avec User A
3. Ajouter du contenu dans Network
4. Se connecter avec User B
5. Essayer d'accéder à `/network/{user_a_id}`
6. **Vérifier que l'accès est refusé** (message "Vous n'avez pas accès...")

### Test 4 : Accès ami

1. Créer une relation `friendships` entre User A et User B avec `network_access = true`
2. Se connecter avec User B
3. Accéder à `/network/{user_a_id}`
4. **Vérifier que le contenu est visible** (lecture seule)

---

## 🔧 Dépannage

### Erreur : "relation storage.buckets does not exist"

**Cause :** Le schéma storage n'est pas accessible ou n'existe pas.

**Solution :** 
- Vérifier que vous êtes connecté à Supabase
- Vérifier les permissions de votre utilisateur
- Essayer de créer le bucket manuellement dans le Dashboard

### Erreur : "function update_updated_at_column() does not exist"

**Cause :** La fonction n'a pas été créée.

**Solution :** Exécuter ce SQL :
```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
```

### Erreur : "bucket network-content does not exist"

**Cause :** Le bucket n'a pas été créé.

**Solution :**
1. Créer manuellement dans Supabase Dashboard > Storage
2. Ou exécuter :
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('network-content', 'network-content', false)
ON CONFLICT (id) DO NOTHING;
```

### Erreur : "new row violates row-level security policy"

**Cause :** Les RLS policies bloquent l'opération.

**Solution :**
1. Vérifier que l'utilisateur est authentifié
2. Vérifier que `auth.uid() = user_id` dans la requête
3. Vérifier que les policies sont actives

### Erreur : "new row violates check constraint"

**Cause :** La valeur de `section_id` n'est pas valide.

**Solution :** Utiliser uniquement : `'social'`, `'media'`, ou `'philanthropy'`

---

## 📊 Requêtes Utiles

### Statistiques

**Nombre de sections par utilisateur :**
```sql
SELECT 
  user_id,
  COUNT(*) as section_count,
  COUNT(CASE WHEN content IS NOT NULL AND content != '' THEN 1 END) as sections_with_content
FROM network_content
GROUP BY user_id
ORDER BY section_count DESC;
```

**Sections les plus utilisées :**
```sql
SELECT 
  section_id,
  COUNT(*) as count,
  COUNT(CASE WHEN content IS NOT NULL AND content != '' THEN 1 END) as with_content
FROM network_content
GROUP BY section_id
ORDER BY count DESC;
```

**Utilisateurs avec le plus de liens sociaux :**
```sql
SELECT 
  user_id,
  section_id,
  jsonb_object_keys(social_links) as platform,
  social_links->jsonb_object_keys(social_links) as link
FROM network_content
WHERE social_links != '{}'::jsonb;
```

### Nettoyage

**Trouver les images orphelines (non référencées) :**
```sql
SELECT o.name, o.created_at, o.metadata
FROM storage.objects o
WHERE o.bucket_id = 'network-content'
AND NOT EXISTS (
  SELECT 1 FROM network_content
  WHERE image_url LIKE '%' || o.name || '%'
);
```

**Supprimer les images orphelines (ATTENTION : irréversible) :**
```sql
-- D'abord, lister les images orphelines
-- Puis supprimer manuellement via le Dashboard ou :
DELETE FROM storage.objects
WHERE bucket_id = 'network-content'
AND NOT EXISTS (
  SELECT 1 FROM network_content
  WHERE image_url LIKE '%' || name || '%'
);
```

---

## 🔐 Sécurité

### Bonnes pratiques

1. ✅ **Bucket privé** - Le bucket `network-content` est privé (pas public)
2. ✅ **RLS activé** - Row Level Security est activé sur la table
3. ✅ **Validation** - `section_id` est validé avec CHECK constraint
4. ✅ **Permissions** - Les utilisateurs ne peuvent modifier que leur propre contenu
5. ✅ **Isolation** - Chaque utilisateur a son propre dossier dans le storage

### Vérifications de sécurité

**Vérifier que RLS est activé :**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'network_content';
-- rowsecurity doit être true
```

**Vérifier que le bucket est privé :**
```sql
SELECT id, name, public 
FROM storage.buckets 
WHERE id = 'network-content';
-- public doit être false
```

**Vérifier les policies actives :**
```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'network_content'
AND schemaname = 'public';
```

---

## 📝 Notes Importantes

1. **Migration idempotente** : La migration peut être exécutée plusieurs fois sans erreur grâce à `IF NOT EXISTS` et `ON CONFLICT DO NOTHING`.

2. **Fonction update_updated_at_column** : Cette fonction doit exister. Si elle n'existe pas, elle sera créée automatiquement par la migration.

3. **Table friendships** : Les policies d'accès ami nécessitent que la table `friendships` existe avec la colonne `network_access`. Si cette table n'existe pas, les policies d'accès ami ne fonctionneront pas (mais l'accès propre fonctionnera toujours).

4. **Storage folder structure** : Les images sont stockées dans `{user_id}/{timestamp}.{ext}`. Le premier niveau du chemin doit être l'user_id pour que les policies fonctionnent.

---

## 🎯 Checklist de Déploiement

Avant de déployer en production :

- [ ] Migration appliquée
- [ ] Table `network_content` créée
- [ ] Bucket `network-content` créé
- [ ] RLS policies actives (5 policies)
- [ ] Storage policies actives (5 policies)
- [ ] Index créés
- [ ] Trigger `updated_at` créé
- [ ] Test de création de contenu réussi
- [ ] Test d'upload d'image réussi
- [ ] Test des permissions réussi
- [ ] Vérification de sécurité effectuée

---

## 📚 Références

- **Migration** : `supabase/migrations/20241203000000_create_network_content.sql`
- **Script SQL** : `documentations/SCRIPT_SETUP_NETWORK.sql`
- **Documentation Network** : `documentations/NETWORK_CONTENT.md`
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)

---

**Dernière mise à jour** : Décembre 2024  
**Auteur** : Équipe de développement Aurora Society

