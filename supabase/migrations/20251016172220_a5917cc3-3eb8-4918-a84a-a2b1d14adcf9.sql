-- Create table for family page content
CREATE TABLE public.family_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Text content
  bio text,
  family_text text,
  residences_text text,
  philanthropy_text text,
  network_text text,
  anecdotes_text text,
  personal_quote text,
  
  -- Photo URLs
  portrait_url text,
  gallery_photos jsonb DEFAULT '[]'::jsonb,
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.family_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own family content"
  ON public.family_content
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own family content"
  ON public.family_content
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family content"
  ON public.family_content
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own family content"
  ON public.family_content
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_family_content_updated_at
  BEFORE UPDATE ON public.family_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();