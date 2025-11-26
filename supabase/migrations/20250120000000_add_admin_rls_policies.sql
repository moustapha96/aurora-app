-- Add RLS policies to allow admins to view and manage all profiles and user_roles
-- This fixes the "User not allowed" error when admins try to access member data

-- ============================================
-- 1. POLITIQUES POUR PROFILES
-- ============================================

-- Allow admins to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update all profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete profiles (if needed)
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 2. POLITIQUES POUR USER_ROLES
-- ============================================

-- Allow admins to view all user roles
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
CREATE POLICY "Admins can view all user roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 3. FONCTION POUR RÉCUPÉRER LES INFORMATIONS AUTH
-- ============================================

-- Function to get user auth info (email, created_at, email_confirmed_at)
-- This function uses SECURITY DEFINER to bypass RLS and access auth.users
CREATE OR REPLACE FUNCTION public.get_user_auth_info(_user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  email_confirmed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Only allow if the requesting user is an admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    u.created_at,
    u.email_confirmed_at
  FROM auth.users u
  WHERE u.id = _user_id;
END;
$$;

-- Function to get all users auth info for admins
CREATE OR REPLACE FUNCTION public.get_all_users_auth_info()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  email_confirmed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Only allow if the requesting user is an admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    u.created_at,
    u.email_confirmed_at
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_auth_info(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users_auth_info() TO authenticated;

-- ============================================
-- 4. FONCTION POUR SUPPRIMER UN UTILISATEUR (DATA ONLY)
-- ============================================

-- Function to delete user data (profiles, user_roles, etc.)
-- Note: This does NOT delete the auth user, which requires service role
-- For full deletion, use an Edge Function with service role
CREATE OR REPLACE FUNCTION public.delete_user_data(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow if the requesting user is an admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Prevent self-deletion
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account.';
  END IF;

  -- Delete user roles (will cascade)
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  
  -- Delete profile (will cascade to related tables)
  DELETE FROM public.profiles WHERE id = _user_id;
  
  -- Note: auth.users deletion must be done via Edge Function with service role
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_data(UUID) TO authenticated;

