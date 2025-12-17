-- Drop the overly permissive policy that exposes all profiles
DROP POLICY IF EXISTS "Authenticated users can view basic profile info for discovery" ON public.profiles;

-- The remaining policies are sufficient:
-- - "Users can view their own profile" - auth.uid() = id
-- - "Users can view friend profiles through friendships" - via friendships table
-- - "Users can view profiles in connection requests" - via connection_requests table
-- These three policies properly restrict access to:
-- 1. User's own profile
-- 2. Friends' profiles  
-- 3. Profiles involved in pending/accepted connection requests