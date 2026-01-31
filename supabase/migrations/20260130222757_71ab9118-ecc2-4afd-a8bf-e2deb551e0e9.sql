-- Fix /family image uploads: RLS policies for personal-content bucket
-- Use storage.foldername(name)[1] which is robust for folder paths

-- INSERT policy for authenticated users on personal-content
CREATE POLICY "Auth users upload personal-content v2"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'personal-content'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE policy for authenticated users on personal-content  
CREATE POLICY "Auth users update personal-content v2"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'personal-content'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'personal-content'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE policy for authenticated users on personal-content
CREATE POLICY "Auth users delete personal-content v2"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'personal-content'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);