-- Remove the overly permissive policy that exposes all profiles to any authenticated user
DROP POLICY IF EXISTS "Authenticated users can view profiles for discovery" ON public.profiles;