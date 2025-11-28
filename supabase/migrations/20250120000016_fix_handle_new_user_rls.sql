-- Fix handle_new_user function to properly bypass RLS
-- This fixes the "Database error saving new user" issue

-- Update handle_new_user function to handle errors gracefully and ensure RLS bypass
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_default_role app_role := 'member';
BEGIN
  -- Get default role from app_settings (if available)
  BEGIN
    SELECT value::text::app_role INTO v_default_role
    FROM public.app_settings
    WHERE key = 'defaultRole'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    -- If settings table doesn't exist or query fails, use 'member' as default
    v_default_role := 'member';
  END;
  
  -- If no setting found or invalid, use 'member' as default
  IF v_default_role IS NULL THEN
    v_default_role := 'member';
  END IF;
  
  -- Insert role for new user (SECURITY DEFINER bypasses RLS)
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, v_default_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to insert role for new user %: %', new.id, SQLERRM;
  END;
  
  RETURN new;
END;
$$;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

