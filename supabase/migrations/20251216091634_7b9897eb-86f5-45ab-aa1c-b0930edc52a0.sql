-- Drop existing permissive policies on identity_verifications that could be exploited
DROP POLICY IF EXISTS "Service role can update verifications" ON public.identity_verifications;
DROP POLICY IF EXISTS "Users can view their own verifications" ON public.identity_verifications;
DROP POLICY IF EXISTS "Users can create their own verifications" ON public.identity_verifications;

-- Create more restrictive policies
-- Users can only view their OWN verifications
CREATE POLICY "Users can view own verifications only"
ON public.identity_verifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their OWN verifications
CREATE POLICY "Users can create own verifications only"
ON public.identity_verifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only service role can update (via edge functions) - no user-level updates allowed
-- This is handled by service_role which bypasses RLS