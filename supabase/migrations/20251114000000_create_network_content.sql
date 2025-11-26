-- Add network_access column to friendships table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'friendships' 
    AND column_name = 'network_access'
  ) THEN
    ALTER TABLE public.friendships 
    ADD COLUMN network_access boolean DEFAULT true;
    
    COMMENT ON COLUMN public.friendships.network_access IS 'Permission to view network section';
  END IF;
END $$;

-- Create storage bucket for network content images
INSERT INTO storage.buckets (id, name, public)
VALUES ('network-content', 'network-content', false)
ON CONFLICT (id) DO NOTHING;

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

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own network content" ON public.network_content;
CREATE POLICY "Users can view their own network content"
ON public.network_content
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to view network content of their friends (if they have network_access)
DROP POLICY IF EXISTS "Users can view friends network content" ON public.network_content;
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

DROP POLICY IF EXISTS "Users can insert their own network content" ON public.network_content;
CREATE POLICY "Users can insert their own network content"
ON public.network_content
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own network content" ON public.network_content;
CREATE POLICY "Users can update their own network content"
ON public.network_content
FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own network content" ON public.network_content;
CREATE POLICY "Users can delete their own network content"
ON public.network_content
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_network_content_updated_at ON public.network_content;
CREATE TRIGGER update_network_content_updated_at
BEFORE UPDATE ON public.network_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_network_content_user_id ON public.network_content(user_id);
CREATE INDEX IF NOT EXISTS idx_network_content_section_id ON public.network_content(section_id);

-- Storage policies for network-content bucket
-- Allow users to view their own network content images
DROP POLICY IF EXISTS "Users can view their own network content images" ON storage.objects;
CREATE POLICY "Users can view their own network content images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'network-content' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view network content images of their friends (if they have network_access)
DROP POLICY IF EXISTS "Users can view friends network content images" ON storage.objects;
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

-- Allow users to upload their own network content images
DROP POLICY IF EXISTS "Users can upload their own network content images" ON storage.objects;
CREATE POLICY "Users can upload their own network content images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'network-content' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own network content images
DROP POLICY IF EXISTS "Users can update their own network content images" ON storage.objects;
CREATE POLICY "Users can update their own network content images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'network-content' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own network content images
DROP POLICY IF EXISTS "Users can delete their own network content images" ON storage.objects;
CREATE POLICY "Users can delete their own network content images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'network-content' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

