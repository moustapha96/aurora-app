-- Add sport_type to sports_hobbies to identify curated sports
ALTER TABLE public.sports_hobbies 
ADD COLUMN IF NOT EXISTS sport_type text;

-- Remove statistics columns from sports_hobbies (they can be added later as importable tables)
ALTER TABLE public.sports_hobbies 
DROP COLUMN IF EXISTS stat1_label,
DROP COLUMN IF EXISTS stat1_value,
DROP COLUMN IF EXISTS stat2_label,
DROP COLUMN IF EXISTS stat2_value,
DROP COLUMN IF EXISTS stat3_label,
DROP COLUMN IF EXISTS stat3_value;

-- Migrate existing curated_sports data to sports_hobbies
INSERT INTO public.sports_hobbies (user_id, title, subtitle, badge_text, description, image_url, sport_type, display_order)
SELECT 
  user_id,
  title,
  subtitle,
  badge_text,
  description,
  image_url,
  sport_type,
  CASE 
    WHEN sport_type = 'yachting' THEN -3
    WHEN sport_type = 'polo' THEN -2
    WHEN sport_type = 'chasse' THEN -1
    ELSE 0
  END as display_order
FROM public.curated_sports
ON CONFLICT DO NOTHING;