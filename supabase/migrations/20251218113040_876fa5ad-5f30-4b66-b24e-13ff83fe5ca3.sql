-- Add document_url column to identity_verifications
ALTER TABLE public.identity_verifications 
ADD COLUMN IF NOT EXISTS document_url text;

-- Create storage bucket for identity documents if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('identity-documents', 'identity-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for identity-documents bucket
CREATE POLICY "Users can upload their own identity documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'identity-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own identity documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'identity-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own identity documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'identity-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can view all identity documents
CREATE POLICY "Admins can view all identity documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'identity-documents'
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);