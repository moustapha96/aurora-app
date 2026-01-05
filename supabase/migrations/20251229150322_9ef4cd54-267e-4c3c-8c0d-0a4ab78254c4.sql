
-- Drop the overly permissive policy that exposes all profile data
DROP POLICY IF EXISTS "Anyone can check referral codes for registration" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can check referral codes" ON public.profiles;

-- Create a security definer function to validate referral codes without exposing profile data
CREATE OR REPLACE FUNCTION public.validate_referral_code(code text)
RETURNS TABLE(sponsor_id uuid, is_valid boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id as sponsor_id, true as is_valid
  FROM public.profiles
  WHERE referral_code = code
  LIMIT 1;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.validate_referral_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_referral_code(text) TO authenticated;
