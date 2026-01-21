-- Migration pour permettre l'accès public aux avatars dans le bucket avatars
-- Les avatars doivent être accessibles publiquement pour l'affichage

-- 1. S'assurer que le bucket avatars existe et est public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE 
SET public = true;

-- 2. Supprimer TOUTES les anciennes politiques pour les avatars (nettoyage complet)
DROP POLICY IF EXISTS "Users can view their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view all avatars" ON storage.objects;
DROP POLICY IF EXISTS "public_read_avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "users_upload_own_avatar" ON storage.objects;
DROP POLICY IF EXISTS "users_update_own_avatar" ON storage.objects;
DROP POLICY IF EXISTS "users_delete_own_avatar" ON storage.objects;

-- 3. Créer une politique pour permettre l'accès public en lecture à tous les avatars
-- Cette politique permet à tout le monde (même non authentifié) de voir les avatars
-- IMPORTANT: Utiliser 'public' comme rôle pour permettre l'accès sans authentification
CREATE POLICY "Public can view all avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 4. Créer des politiques pour l'upload/update/delete (seulement pour le propriétaire)
-- Upload - les utilisateurs authentifiés peuvent uploader leur propre avatar
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Update - les utilisateurs authentifiés peuvent mettre à jour leur propre avatar
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Delete - les utilisateurs authentifiés peuvent supprimer leur propre avatar
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- 5. Vérification : Afficher l'état du bucket
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'avatars';

-- 6. Vérification : Lister les politiques existantes pour le bucket avatars
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects' 
  AND (policyname LIKE '%avatar%' OR qual LIKE '%avatars%' OR with_check LIKE '%avatars%')
ORDER BY policyname;

-- 7. IMPORTANT: Vérifier que RLS est activé sur storage.objects
-- Si RLS n'est pas activé, les politiques ne fonctionneront pas
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 8. Vérification finale: Tester l'accès public
-- Cette requête devrait retourner des résultats si les permissions sont correctes
SELECT 
  name,
  bucket_id,
  created_at
FROM storage.objects
WHERE bucket_id = 'avatars'
LIMIT 5;
