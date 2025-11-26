-- Create storage bucket for personal content images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('personal-content', 'personal-content', true)
ON CONFLICT (id) DO NOTHING;

-- Create artwork collection table
CREATE TABLE IF NOT EXISTS public.artwork_collection (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  year TEXT NOT NULL,
  medium TEXT NOT NULL,
  price TEXT NOT NULL,
  acquisition TEXT NOT NULL,
  image_url TEXT,
  description TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exhibitions table
CREATE TABLE IF NOT EXISTS public.exhibitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  year TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sports/hobbies table
CREATE TABLE IF NOT EXISTS public.sports_hobbies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  badge_text TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create destinations table
CREATE TABLE IF NOT EXISTS public.destinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lieu TEXT NOT NULL,
  type TEXT NOT NULL,
  saison TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.artwork_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exhibitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports_hobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for artwork_collection
CREATE POLICY "Users can view their own artwork collection" 
ON public.artwork_collection FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own artwork collection" 
ON public.artwork_collection FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artwork collection" 
ON public.artwork_collection FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own artwork collection" 
ON public.artwork_collection FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for exhibitions
CREATE POLICY "Users can view their own exhibitions" 
ON public.exhibitions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exhibitions" 
ON public.exhibitions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exhibitions" 
ON public.exhibitions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exhibitions" 
ON public.exhibitions FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for sports_hobbies
CREATE POLICY "Users can view their own sports hobbies" 
ON public.sports_hobbies FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sports hobbies" 
ON public.sports_hobbies FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sports hobbies" 
ON public.sports_hobbies FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sports hobbies" 
ON public.sports_hobbies FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for destinations
CREATE POLICY "Users can view their own destinations" 
ON public.destinations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own destinations" 
ON public.destinations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own destinations" 
ON public.destinations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own destinations" 
ON public.destinations FOR DELETE 
USING (auth.uid() = user_id);

-- Storage policies for personal-content bucket
CREATE POLICY "Users can view their own personal content images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'personal-content' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own personal content images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'personal-content' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own personal content images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'personal-content' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own personal content images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'personal-content' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_artwork_collection_updated_at
BEFORE UPDATE ON public.artwork_collection
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exhibitions_updated_at
BEFORE UPDATE ON public.exhibitions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sports_hobbies_updated_at
BEFORE UPDATE ON public.sports_hobbies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_destinations_updated_at
BEFORE UPDATE ON public.destinations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();