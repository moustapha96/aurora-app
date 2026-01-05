-- Drop the problematic policy that allows viewing profiles through connection requests
-- This could be exploited by attackers to enumerate user data by sending connection requests
DROP POLICY IF EXISTS "Users can view profiles in connection requests" ON public.profiles;

-- The remaining policies are secure:
-- 1. Users can view their own profile (auth.uid() = id)
-- 2. Users can view confirmed friends' profiles (via friendships table)
-- 3. Admins can view all profiles (via has_role function)
-- Connection requests should NOT grant access to full profile data