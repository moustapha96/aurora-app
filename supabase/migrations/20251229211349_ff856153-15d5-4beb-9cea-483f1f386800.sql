
-- Create business_documents table
CREATE TABLE public.business_documents (
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

-- Create personal_documents table
CREATE TABLE public.personal_documents (
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

-- Create network_documents table
CREATE TABLE public.network_documents (
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

-- Enable RLS on all new tables
ALTER TABLE public.business_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for business_documents
CREATE POLICY "Users can view their own business documents" 
ON public.business_documents FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own business documents" 
ON public.business_documents FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business documents" 
ON public.business_documents FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business documents" 
ON public.business_documents FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for personal_documents
CREATE POLICY "Users can view their own personal documents" 
ON public.personal_documents FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personal documents" 
ON public.personal_documents FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personal documents" 
ON public.personal_documents FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personal documents" 
ON public.personal_documents FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for network_documents
CREATE POLICY "Users can view their own network documents" 
ON public.network_documents FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own network documents" 
ON public.network_documents FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own network documents" 
ON public.network_documents FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own network documents" 
ON public.network_documents FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage buckets for each section
INSERT INTO storage.buckets (id, name, public) VALUES ('business-documents', 'business-documents', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('personal-documents', 'personal-documents', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('network-documents', 'network-documents', false) ON CONFLICT (id) DO NOTHING;

-- Storage policies for business-documents
CREATE POLICY "Users can view their own business docs" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'business-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own business docs" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'business-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own business docs" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'business-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own business docs" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'business-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for personal-documents
CREATE POLICY "Users can view their own personal docs" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'personal-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own personal docs" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'personal-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own personal docs" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'personal-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own personal docs" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'personal-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for network-documents
CREATE POLICY "Users can view their own network docs" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'network-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own network docs" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'network-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own network docs" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'network-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own network docs" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'network-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admin policies to view all documents
CREATE POLICY "Admins can view all business documents" 
ON public.business_documents FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all personal documents" 
ON public.personal_documents FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all network documents" 
ON public.network_documents FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));
