# Configuration Supabase - Network Content

**Date de création** : Décembre 2024  
**Version** : 1.0.0

---

## Vue d'ensemble

Ce guide explique comment configurer Supabase pour la fonctionnalité Network Content, incluant la table de base de données, le bucket de storage, et toutes les permissions nécessaires.

---

## Configuration automatique (Recommandé)

### 1. Appliquer la migration

La migration `20241203000000_create_network_content.sql` crée automatiquement :
- ✅ La table `network_content`
- ✅ Le bucket de storage `network-content`
- ✅ Toutes les RLS policies
- ✅ Toutes les storage policies
- ✅ Les index pour la performance

**Commande :**
```bash
npx supabase migration up
```

**Ou via Supabase CLI :**
```bash
supabase db push
```

---

## Configuration manuelle (Alternative)

Si vous préférez configurer manuellement via le dashboard Supabase :

### 1. Créer la table `network_content`

**Dans Supabase Dashboard > SQL Editor :**

```sql
-- Create network_content table
CREATE TABLE IF NOT EXISTS public.network_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL CHECK (section_id IN ('social', 'media', 'philanthropy')),
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, section_id)
);

-- Enable RLS
ALTER TABLE public.network_content ENABLE ROW LEVEL SECURITY;
```

### 2. Créer les RLS Policies

**Dans Supabase Dashboard > Authentication > Policies :**

#### Policy 1 : Users can view their own network content
```sql
CREATE POLICY "Users can view their own network content"
ON public.network_content
FOR SELECT
USING (auth.uid() = user_id);
```

#### Policy 2 : Users can view friends network content
```sql
CREATE POLICY "Users can view friends network content"
ON public.network_content
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (
      (friendships.user_id = auth.uid() AND friendships.friend_id = network_content.user_id)
      OR (friendships.friend_id = auth.uid() AND friendships.user_id = network_content.user_id)
    )
    AND friendships.network_access = true
  )
);
```

#### Policy 3 : Users can insert their own network content
```sql
CREATE POLICY "Users can insert their own network content"
ON public.network_content
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### Policy 4 : Users can update their own network content
```sql
CREATE POLICY "Users can update their own network content"
ON public.network_content
FOR UPDATE
USING (auth.uid() = user_id);
```

#### Policy 5 : Users can delete their own network content
```sql
CREATE POLICY "Users can delete their own network content"
ON public.network_content
FOR DELETE
USING (auth.uid() = user_id);
```

### 3. Créer le trigger pour `updated_at`

**Dans Supabase Dashboard > SQL Editor :**

```sql
-- Trigger for updated_at
CREATE TRIGGER update_network_content_updated_at
BEFORE UPDATE ON public.network_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
```

**Note :** La fonction `update_updated_at_column()` doit déjà exister. Si elle n'existe pas, créez-la :

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
```

### 4. Créer les index

**Dans Supabase Dashboard > SQL Editor :**

```sql
-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_network_content_user_id ON public.network_content(user_id);
CREATE INDEX IF NOT EXISTS idx_network_content_section_id ON public.network_content(section_id);
```

### 5. Créer le bucket de storage

**Dans Supabase Dashboard > Storage :**

1. Cliquer sur "New bucket"
2. **Name** : `network-content`
3. **Public bucket** : ❌ Non (privé)
4. **File size limit** : 10 MB (recommandé)
5. **Allowed MIME types** : `image/*` (recommandé)
6. Cliquer sur "Create bucket"

### 6. Configurer les Storage Policies

**Dans Supabase Dashboard > Storage > network-content > Policies :**

#### Policy 1 : Users can view their own network content images
```sql
CREATE POLICY "Users can view their own network content images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'network-content' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 2 : Users can view friends network content images
```sql
CREATE POLICY "Users can view friends network content images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'network-content'
  AND EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (
      (friendships.user_id = auth.uid() AND friendships.friend_id::text = (storage.foldername(name))[1])
      OR (friendships.friend_id = auth.uid() AND friendships.user_id::text = (storage.foldername(name))[1])
    )
    AND friendships.network_access = true
  )
);
```

#### Policy 3 : Users can upload their own network content images
```sql
CREATE POLICY "Users can upload their own network content images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'network-content' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 4 : Users can update their own network content images
```sql
CREATE POLICY "Users can update their own network content images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'network-content' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 5 : Users can delete their own network content images
```sql
CREATE POLICY "Users can delete their own network content images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'network-content' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## Vérification

### Vérifier la table

**Dans Supabase Dashboard > Table Editor :**
- Vérifier que la table `network_content` existe
- Vérifier que les colonnes sont correctes
- Tester une insertion manuelle (optionnel)

### Vérifier les RLS Policies

**Dans Supabase Dashboard > Authentication > Policies :**
- Vérifier que les 5 policies sont actives
- Vérifier les conditions USING/WITH CHECK

### Vérifier le bucket

**Dans Supabase Dashboard > Storage :**
- Vérifier que le bucket `network-content` existe
- Vérifier qu'il est privé (pas public)
- Vérifier les limites de taille et MIME types

### Vérifier les Storage Policies

**Dans Supabase Dashboard > Storage > network-content > Policies :**
- Vérifier que les 5 policies sont actives
- Vérifier les conditions USING/WITH CHECK

---

## Test de fonctionnement

### Test 1 : Création de contenu

1. Se connecter à l'application
2. Aller sur `/network`
3. Cliquer sur "Modifier" dans une section
4. Ajouter du contenu et des liens sociaux
5. Cliquer sur "Enregistrer"
6. Vérifier dans Supabase Dashboard > Table Editor > `network_content` que les données sont sauvegardées

### Test 2 : Upload d'image

1. Dans une section, uploader une image
2. Vérifier dans Supabase Dashboard > Storage > `network-content` que l'image est uploadée
3. Vérifier que l'image s'affiche correctement dans l'application

### Test 3 : Permissions

1. Créer deux comptes utilisateurs
2. Se connecter avec le premier compte
3. Ajouter du contenu dans Network
4. Se connecter avec le deuxième compte
5. Essayer d'accéder à `/network/{user_id_1}`
6. Vérifier que l'accès est refusé (sauf si `network_access = true` dans friendships)

---

## Dépannage

### Problème : La migration échoue

**Erreur :** `relation "storage.buckets" does not exist`

**Solution :** Vérifier que vous êtes connecté à Supabase et que le schéma `storage` existe.

**Erreur :** `function update_updated_at_column() does not exist`

**Solution :** Créer la fonction (voir section 3 ci-dessus).

### Problème : Impossible d'uploader des images

**Vérifications :**
1. Le bucket `network-content` existe-t-il ?
2. Les storage policies sont-elles actives ?
3. L'utilisateur est-il authentifié ?
4. Le chemin du fichier contient-il l'user_id ?

**Solution :** Vérifier les logs dans la console du navigateur et dans Supabase Dashboard > Logs.

### Problème : Impossible de voir le contenu d'un ami

**Vérifications :**
1. La relation `friendships` existe-t-elle entre les deux utilisateurs ?
2. Le champ `network_access` est-il à `true` ?
3. Les RLS policies sont-elles correctes ?

**Solution :** Vérifier dans Supabase Dashboard > Table Editor > `friendships`.

---

## Structure des données

### Table `network_content`

**Exemple de données :**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "section_id": "social",
  "title": "Réseaux Sociaux",
  "content": "Instagram: @alexandre_duroche\nLinkedIn: Alexandre du Roche",
  "image_url": "https://...",
  "social_links": {
    "instagram": "@alexandre_duroche",
    "linkedin": "https://linkedin.com/in/alexandre-du-roche",
    "twitter": "@aduroche"
  },
  "created_at": "2024-12-03T10:00:00Z",
  "updated_at": "2024-12-03T10:00:00Z"
}
```

### Storage Structure

**Chemin des fichiers :**
```
network-content/
  {user_id}/
    {timestamp}.{extension}
```

**Exemple :**
```
network-content/
  abc123-def456-ghi789/
    1701600000000.jpg
    1701600100000.png
```

---

## Sécurité

### RLS (Row Level Security)

- ✅ Les utilisateurs ne peuvent voir que leur propre contenu
- ✅ Les utilisateurs peuvent voir le contenu de leurs amis si `network_access = true`
- ✅ Les utilisateurs ne peuvent modifier que leur propre contenu

### Storage Policies

- ✅ Les utilisateurs ne peuvent uploader que dans leur propre dossier
- ✅ Les utilisateurs peuvent voir les images de leurs amis si `network_access = true`
- ✅ Le bucket est privé (pas public)

### Validation

- ✅ `section_id` est validé (social, media, philanthropy uniquement)
- ✅ `social_links` est validé comme JSONB
- ✅ `user_id` est validé via foreign key

---

## Maintenance

### Nettoyage des images orphelines

**Script SQL pour trouver les images orphelines :**
```sql
-- Trouver les images qui ne sont plus référencées
SELECT o.name, o.created_at
FROM storage.objects o
WHERE o.bucket_id = 'network-content'
AND NOT EXISTS (
  SELECT 1 FROM network_content
  WHERE image_url LIKE '%' || o.name || '%'
);
```

### Statistiques

**Nombre de sections par utilisateur :**
```sql
SELECT user_id, COUNT(*) as section_count
FROM network_content
GROUP BY user_id;
```

**Sections les plus utilisées :**
```sql
SELECT section_id, COUNT(*) as count
FROM network_content
GROUP BY section_id
ORDER BY count DESC;
```

---

## Références

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)

---

**Dernière mise à jour** : Décembre 2024  
**Auteur** : Équipe de développement Aurora Society

