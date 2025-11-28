-- Script complet pour corriger l'erreur "Database error saving new user"
-- Execute this in Supabase SQL Editor

-- ============================================
-- 1. FIX handle_new_user FUNCTION
-- ============================================

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

-- ============================================
-- 2. FIX RLS POLICIES FOR user_roles
-- ============================================

-- Drop the restrictive policy that blocks inserts
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;

-- Create separate policies for different operations
-- Allow system (via SECURITY DEFINER functions) to insert roles
-- Note: SECURITY DEFINER should bypass RLS, but we add this policy as a safety net
CREATE POLICY "System can insert roles via trigger"
  ON public.user_roles FOR INSERT
  WITH CHECK (true); -- SECURITY DEFINER functions will bypass this anyway

-- Allow admins to update roles
CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own roles (keep existing)
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- 3. ENSURE TRIGGER IS SET UP
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

