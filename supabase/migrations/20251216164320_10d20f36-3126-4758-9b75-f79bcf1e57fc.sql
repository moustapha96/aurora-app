-- Drop the current policy
DROP POLICY IF EXISTS "Secure profile access" ON public.profiles;

-- Create a more secure policy that explicitly requires authentication
CREATE POLICY "Secure profile access"
ON public.profiles
FOR SELECT
USING (
  -- CRITICAL: First check that user is authenticated (blocks anonymous access)
  auth.uid() IS NOT NULL
  AND
  (
    -- User can view their own profile
    (id = auth.uid())
    OR
    -- User can view profiles of accepted friends only
    (EXISTS (
      SELECT 1 FROM friendships f
      WHERE (
        (f.user_id = auth.uid() AND f.friend_id = profiles.id)
        OR
        (f.friend_id = auth.uid() AND f.user_id = profiles.id)
      )
    ))
  )
);