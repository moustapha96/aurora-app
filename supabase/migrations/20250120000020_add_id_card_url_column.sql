-- Add id_card_url column to profiles table if it doesn't exist
-- This column stores the URL of the user's ID card image

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS id_card_url TEXT;

COMMENT ON COLUMN public.profiles.id_card_url IS 'URL of the user ID card image stored in storage';

