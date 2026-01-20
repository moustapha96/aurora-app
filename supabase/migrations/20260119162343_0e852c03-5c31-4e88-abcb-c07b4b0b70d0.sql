-- Correction de la politique pour les images business
-- Le chemin est user_id/business/... donc on doit adapter le pattern

DROP POLICY IF EXISTS "Public can view business images" ON storage.objects;

CREATE POLICY "Public can view business images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'personal-content' 
  AND name LIKE '%/business/%'
);