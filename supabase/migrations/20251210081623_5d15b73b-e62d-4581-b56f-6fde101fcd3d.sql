-- Add onboarding columns to personal content tracking
CREATE TABLE IF NOT EXISTS public.personal_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_mode TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.personal_content ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own personal content"
  ON public.personal_content FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personal content"
  ON public.personal_content FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personal content"
  ON public.personal_content FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personal content"
  ON public.personal_content FOR DELETE
  USING (auth.uid() = user_id);

-- Table for Art & Culture entries
CREATE TABLE public.personal_art_culture (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  display_order INTEGER DEFAULT 0,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.personal_art_culture ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own art culture"
  ON public.personal_art_culture FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own art culture"
  ON public.personal_art_culture FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own art culture"
  ON public.personal_art_culture FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own art culture"
  ON public.personal_art_culture FOR DELETE
  USING (auth.uid() = user_id);

-- Table for Voyages entries
CREATE TABLE public.personal_voyages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  display_order INTEGER DEFAULT 0,
  destination TEXT NOT NULL,
  period TEXT,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.personal_voyages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own voyages"
  ON public.personal_voyages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voyages"
  ON public.personal_voyages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voyages"
  ON public.personal_voyages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voyages"
  ON public.personal_voyages FOR DELETE
  USING (auth.uid() = user_id);

-- Table for Gastronomie entries
CREATE TABLE public.personal_gastronomie (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  display_order INTEGER DEFAULT 0,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.personal_gastronomie ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own gastronomie"
  ON public.personal_gastronomie FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gastronomie"
  ON public.personal_gastronomie FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gastronomie"
  ON public.personal_gastronomie FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gastronomie"
  ON public.personal_gastronomie FOR DELETE
  USING (auth.uid() = user_id);

-- Table for Luxe entries
CREATE TABLE public.personal_luxe (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  display_order INTEGER DEFAULT 0,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.personal_luxe ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own luxe"
  ON public.personal_luxe FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own luxe"
  ON public.personal_luxe FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own luxe"
  ON public.personal_luxe FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own luxe"
  ON public.personal_luxe FOR DELETE
  USING (auth.uid() = user_id);

-- Table for Collections entries
CREATE TABLE public.personal_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  display_order INTEGER DEFAULT 0,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.personal_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own collections"
  ON public.personal_collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own collections"
  ON public.personal_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON public.personal_collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON public.personal_collections FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_personal_content_updated_at
  BEFORE UPDATE ON public.personal_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_personal_art_culture_updated_at
  BEFORE UPDATE ON public.personal_art_culture
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_personal_voyages_updated_at
  BEFORE UPDATE ON public.personal_voyages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_personal_gastronomie_updated_at
  BEFORE UPDATE ON public.personal_gastronomie
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_personal_luxe_updated_at
  BEFORE UPDATE ON public.personal_luxe
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_personal_collections_updated_at
  BEFORE UPDATE ON public.personal_collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();