-- Fix personal-content storage RLS: use string_to_array for first path segment
-- (storage.foldername(name))[1] can behave as first CHARACTER on text in some contexts;
-- (string_to_array(name, '/'))[1] correctly returns the first path segment = user_id

-- Drop v2 policies that may cause 400 Bad Request / RLS violation
DROP POLICY IF EXISTS "Auth users upload personal-content v2" ON storage.objects;
DROP POLICY IF EXISTS "Auth users update personal-content v2" ON storage.objects;
DROP POLICY IF EXISTS "Auth users delete personal-content v2" ON storage.objects;

-- Ensure INSERT policy: first path segment must equal auth.uid()
DROP POLICY IF EXISTS "Users can upload their own personal content images" ON storage.objects;
CREATE POLICY "Users can upload their own personal content images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'personal-content'
  AND auth.uid() IS NOT NULL
  AND (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Ensure UPDATE policy
DROP POLICY IF EXISTS "Users can update their own personal content images" ON storage.objects;
CREATE POLICY "Users can update their own personal content images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'personal-content'
  AND auth.uid() IS NOT NULL
  AND (string_to_array(name, '/'))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'personal-content'
  AND auth.uid() IS NOT NULL
  AND (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Ensure DELETE policy
DROP POLICY IF EXISTS "Users can delete their own personal content images" ON storage.objects;
CREATE POLICY "Users can delete their own personal content images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'personal-content'
  AND auth.uid() IS NOT NULL
  AND (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- SELECT: allow display of uploaded images/files
-- 1) Authenticated users can read their own (first segment = auth.uid())
DROP POLICY IF EXISTS "Users can view their own personal content images" ON storage.objects;
CREATE POLICY "Users can view their own personal content images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'personal-content'
  AND auth.uid() IS NOT NULL
  AND (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- 2) Public read for all personal-content (bucket is public: images must display in <img> without auth)
DROP POLICY IF EXISTS "Public can view business images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view personal-content images" ON storage.objects;
CREATE POLICY "Public can view personal-content images"
ON storage.objects FOR SELECT
USING (bucket_id = 'personal-content');
