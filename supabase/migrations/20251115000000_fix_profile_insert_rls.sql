-- Fix RLS policy for profile insertion during registration
-- Create a SECURITY DEFINER function to allow profile creation during signup

-- Function to create profile (bypasses RLS for initial profile creation)
CREATE OR REPLACE FUNCTION public.create_profile(
  p_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_honorific_title TEXT DEFAULT NULL,
  p_mobile_phone TEXT,
  p_job_function TEXT DEFAULT NULL,
  p_activity_domain TEXT DEFAULT NULL,
  p_personal_quote TEXT DEFAULT NULL,
  p_username TEXT DEFAULT NULL,
  p_referral_code TEXT DEFAULT NULL,
  p_is_founder BOOLEAN DEFAULT false,
  p_wealth_billions TEXT DEFAULT NULL,
  p_wealth_currency TEXT DEFAULT NULL,
  p_wealth_unit TEXT DEFAULT NULL,
  p_wealth_amount TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    honorific_title,
    mobile_phone,
    job_function,
    activity_domain,
    personal_quote,
    username,
    referral_code,
    is_founder,
    wealth_billions,
    wealth_currency,
    wealth_unit,
    wealth_amount,
    avatar_url
  ) VALUES (
    p_id,
    p_first_name,
    p_last_name,
    p_honorific_title,
    p_mobile_phone,
    p_job_function,
    p_activity_domain,
    p_personal_quote,
    p_username,
    p_referral_code,
    p_is_founder,
    p_wealth_billions,
    p_wealth_currency,
    p_wealth_unit,
    p_wealth_amount,
    p_avatar_url
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.create_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_profile TO anon;

COMMENT ON FUNCTION public.create_profile IS 'Creates a user profile. Can be called during registration when user is not yet fully authenticated. Bypasses RLS using SECURITY DEFINER.';

