-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Secure profile access" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a more secure policy that checks friendship status in real-time
-- Only allows viewing profiles of:
-- 1. Own profile
-- 2. Users who are currently friends (both directions in friendships table)
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can view friends profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE (
      (f.user_id = auth.uid() AND f.friend_id = profiles.id)
      OR (f.friend_id = auth.uid() AND f.user_id = profiles.id)
    )
  )
);

-- Admin policy using secure function to prevent direct role check exploitation
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create policy for viewing profiles in pending connection requests (needed for connection flow)
CREATE POLICY "Users can view profiles in connection requests"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM public.connection_requests cr
      WHERE cr.status = 'pending'
      AND (
        (cr.requester_id = auth.uid() AND cr.recipient_id = profiles.id)
        OR (cr.recipient_id = auth.uid() AND cr.requester_id = profiles.id)
      )
    )
  )
);