-- Create private bucket for family documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('family-documents', 'family-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for family-documents bucket (private access only)
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'family-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'family-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'family-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Table to track family documents with metadata
CREATE TABLE public.family_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.family_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies - only owner can access their documents
CREATE POLICY "Users can view their own family documents"
ON public.family_documents
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own family documents"
ON public.family_documents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family documents"
ON public.family_documents
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own family documents"
ON public.family_documents
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_family_documents_updated_at
BEFORE UPDATE ON public.family_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();