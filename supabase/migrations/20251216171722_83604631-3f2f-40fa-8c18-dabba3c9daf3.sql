-- Remove sensitive columns from profiles table
-- These fields are already stored securely in profiles_private with strict RLS

ALTER TABLE public.profiles DROP COLUMN IF EXISTS mobile_phone;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS wealth_amount;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS wealth_billions;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS wealth_currency;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS wealth_unit;

-- Add a comment to document the security change
COMMENT ON TABLE public.profiles IS 'Public profile information. Sensitive data (phone, wealth) stored in profiles_private table with owner-only access.';