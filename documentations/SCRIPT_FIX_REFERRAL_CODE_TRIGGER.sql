-- Script to fix the referral code trigger that causes "Database error saving new user"
-- Execute this in Supabase SQL Editor

-- Update trigger function to handle errors gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
BEGIN
  -- Générer un code si aucun n'est fourni
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' OR trim(NEW.referral_code) = '' THEN
    BEGIN
      -- Try to generate a code, but don't fail if it errors
      v_code := public.generate_referral_code(NEW.id);
      IF v_code IS NOT NULL AND v_code != '' THEN
        NEW.referral_code := v_code;
      ELSE
        -- Fallback: use a simple code based on user ID
        NEW.referral_code := 'AUR-' || upper(substring(replace(NEW.id::text, '-', '') from 1 for 8));
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- If generation fails, use fallback code
      NEW.referral_code := 'AUR-' || upper(substring(replace(NEW.id::text, '-', '') from 1 for 8));
      -- Log the error but don't fail the insert
      RAISE WARNING 'Failed to generate referral code for user %: %', NEW.id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS set_referral_code_on_insert ON public.profiles;
CREATE TRIGGER set_referral_code_on_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_referral_code();

-- Also handle updates to ensure code exists
DROP TRIGGER IF EXISTS set_referral_code_on_update ON public.profiles;
CREATE TRIGGER set_referral_code_on_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (NEW.referral_code IS NULL OR NEW.referral_code = '' OR trim(NEW.referral_code) = '')
  EXECUTE FUNCTION public.handle_new_user_referral_code();

