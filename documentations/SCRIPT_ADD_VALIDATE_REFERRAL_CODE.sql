-- Script to add validate_referral_code function
-- Execute this in Supabase SQL Editor if the function doesn't exist

-- Function to validate a referral code (public, can be called by anyone)
-- Returns basic info about the referrer if code is valid
CREATE OR REPLACE FUNCTION public.validate_referral_code(p_referral_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_result JSON;
BEGIN
  -- Validate input
  IF p_referral_code IS NULL OR p_referral_code = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Code de parrainage requis'
    );
  END IF;

  -- Find profile by referral code
  SELECT id, first_name, last_name, referral_code
  INTO v_profile
  FROM public.profiles
  WHERE referral_code = upper(trim(p_referral_code))
  LIMIT 1;
  
  IF v_profile.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Code de parrainage invalide'
    );
  END IF;

  -- Check if user is trying to use their own code
  IF auth.uid() IS NOT NULL AND v_profile.id = auth.uid() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Vous ne pouvez pas utiliser votre propre code'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'referrer_id', v_profile.id,
    'referrer_name', v_profile.first_name || ' ' || v_profile.last_name
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.validate_referral_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_referral_code(TEXT) TO anon;

-- Add comment
COMMENT ON FUNCTION public.validate_referral_code(TEXT) IS 'Validates a referral code and returns referrer info. Can be called by anyone (authenticated or anonymous).';

