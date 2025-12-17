-- Add new columns to network_media for the enhanced structure
ALTER TABLE public.network_media 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'medias',
ADD COLUMN IF NOT EXISTS year TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT,
ADD COLUMN IF NOT EXISTS privacy_level TEXT DEFAULT 'aurora_circle';

-- Add a table for media posture (Bloc D - unique text per user)
CREATE TABLE IF NOT EXISTS public.network_media_posture (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  posture_text TEXT,
  privacy_level TEXT DEFAULT 'aurora_circle',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Add a table for social network links (Bloc E)
CREATE TABLE IF NOT EXISTS public.network_social_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  url TEXT,
  privacy_level TEXT DEFAULT 'aurora_circle',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.network_media_posture ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_social_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for network_media_posture
CREATE POLICY "Users can view their own media posture" 
ON public.network_media_posture 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own media posture" 
ON public.network_media_posture 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media posture" 
ON public.network_media_posture 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media posture" 
ON public.network_media_posture 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for network_social_links
CREATE POLICY "Users can view their own social links" 
ON public.network_social_links 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own social links" 
ON public.network_social_links 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social links" 
ON public.network_social_links 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social links" 
ON public.network_social_links 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_network_media_posture_updated_at
BEFORE UPDATE ON public.network_media_posture
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_network_social_links_updated_at
BEFORE UPDATE ON public.network_social_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();