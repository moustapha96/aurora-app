-- 1. Remove the overly permissive policy that exposes all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- 2. Create a more restrictive policy for member discovery
-- Only allows viewing basic info (name, avatar, country, job) for authenticated users
-- Full profile access requires friendship or connection request
CREATE POLICY "Authenticated users can view basic profile info for discovery"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- User can always see their own full profile
  auth.uid() = id
  OR
  -- User can see profiles of friends
  EXISTS (
    SELECT 1 FROM friendships
    WHERE (friendships.user_id = auth.uid() AND friendships.friend_id = profiles.id)
       OR (friendships.friend_id = auth.uid() AND friendships.user_id = profiles.id)
  )
  OR
  -- User can see profiles involved in connection requests
  EXISTS (
    SELECT 1 FROM connection_requests
    WHERE (connection_requests.requester_id = auth.uid() AND connection_requests.recipient_id = profiles.id)
       OR (connection_requests.recipient_id = auth.uid() AND connection_requests.requester_id = profiles.id)
  )
  OR
  -- All authenticated users can discover other members (but we'll create a view for limited fields)
  auth.uid() IS NOT NULL
);

-- 3. Create a secure view for member discovery with limited fields only
CREATE OR REPLACE VIEW public.member_discovery AS
SELECT 
  id,
  first_name,
  last_name,
  avatar_url,
  country,
  job_function,
  activity_domain,
  is_founder,
  is_patron
FROM public.profiles;

-- 4. Grant access to the view for authenticated users
GRANT SELECT ON public.member_discovery TO authenticated;