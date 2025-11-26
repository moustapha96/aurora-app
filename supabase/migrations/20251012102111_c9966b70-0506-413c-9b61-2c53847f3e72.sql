-- Add new fields to profiles table for badges
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_patron boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS wealth_billions text DEFAULT NULL;

COMMENT ON COLUMN public.profiles.is_patron IS 'Indicates if the member is a patron (mécène)';
COMMENT ON COLUMN public.profiles.wealth_billions IS 'Member wealth in billions (e.g., "4.5 Md")';