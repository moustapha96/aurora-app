
-- Drop the security definer view and recreate it properly
DROP VIEW IF EXISTS public.member_discovery;

-- Recreate as a regular view (inherits RLS of querying user)
CREATE VIEW public.member_discovery 
WITH (security_invoker = true) AS
SELECT 
  id,
  first_name,
  last_name,
  honorific_title,
  country,
  activity_domain,
  avatar_url,
  is_founder,
  identity_verified
FROM public.profiles
WHERE identity_verified = true OR is_founder = true;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.member_discovery TO authenticated;

-- Add a policy to allow authenticated users to view minimal profile data for discovery
-- This policy only allows viewing profiles that are identity_verified or founders
CREATE POLICY "Authenticated users can view verified profiles for discovery"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (identity_verified = true OR is_founder = true)
);
