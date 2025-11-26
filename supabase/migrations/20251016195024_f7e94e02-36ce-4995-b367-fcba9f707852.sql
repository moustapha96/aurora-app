-- Create table for curated sports content
CREATE TABLE public.curated_sports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  sport_type text NOT NULL CHECK (sport_type IN ('yachting', 'polo', 'chasse')),
  title text NOT NULL,
  subtitle text,
  badge_text text,
  description text NOT NULL,
  image_url text,
  stat1_label text,
  stat1_value text,
  stat2_label text,
  stat2_value text,
  stat3_label text,
  stat3_value text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, sport_type)
);

-- Enable RLS
ALTER TABLE public.curated_sports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own curated sports"
  ON public.curated_sports
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own curated sports"
  ON public.curated_sports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own curated sports"
  ON public.curated_sports
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own curated sports"
  ON public.curated_sports
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_curated_sports_updated_at
  BEFORE UPDATE ON public.curated_sports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();