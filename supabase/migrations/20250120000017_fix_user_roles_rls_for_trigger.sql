-- Fix RLS policies for user_roles to allow handle_new_user trigger to insert
-- The trigger needs to be able to insert roles even though the user is not yet authenticated

-- Drop the restrictive policy that blocks inserts
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;

-- Create separate policies for different operations
-- Allow system (via SECURITY DEFINER functions) to insert roles
CREATE POLICY "System can insert roles via trigger"
  ON public.user_roles FOR INSERT
  WITH CHECK (true); -- SECURITY DEFINER functions will bypass this anyway

-- Allow admins to manage roles
CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own roles (keep existing)
-- This policy should already exist, but ensure it's there
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

