-- Ajouter les colonnes manquantes à sports_hobbies pour uniformiser avec curated_sports
ALTER TABLE public.sports_hobbies 
ADD COLUMN IF NOT EXISTS subtitle text,
ADD COLUMN IF NOT EXISTS stat1_label text,
ADD COLUMN IF NOT EXISTS stat1_value text,
ADD COLUMN IF NOT EXISTS stat2_label text,
ADD COLUMN IF NOT EXISTS stat2_value text,
ADD COLUMN IF NOT EXISTS stat3_label text,
ADD COLUMN IF NOT EXISTS stat3_value text;