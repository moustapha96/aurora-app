-- Migration pour permettre l'accès public aux images business dans personal-content
-- Les images business doivent être accessibles publiquement pour l'affichage

-- 1. S'assurer que le bucket personal-content existe et est public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'personal-content',
  'personal-content',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE 
SET public = true;

-- 2. Supprimer les anciennes politiques restrictives pour les images business
DROP POLICY IF EXISTS "Users can view their own personal content images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view business images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images in business folder" ON storage.objects;

-- 3. Créer une politique pour permettre l'accès public aux images dans le dossier business/
-- Cette politique permet à tout le monde de voir les images dans le dossier business/
CREATE POLICY "Public can view business images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'personal-content' 
  AND (name LIKE '%/business/%' OR name LIKE 'business/%')
);

-- 4. Conserver les politiques pour l'upload/update/delete (seulement pour le propriétaire)
-- Upload
DROP POLICY IF EXISTS "Users can upload their own personal content images" ON storage.objects;
CREATE POLICY "Users can upload their own personal content images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'personal-content' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Update
DROP POLICY IF EXISTS "Users can update their own personal content images" ON storage.objects;
CREATE POLICY "Users can update their own personal content images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'personal-content' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Delete
DROP POLICY IF EXISTS "Users can delete their own personal content images" ON storage.objects;
CREATE POLICY "Users can delete their own personal content images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'personal-content' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- 5. Vérification : Afficher l'état du bucket
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'personal-content';
