-- Drop the overly permissive "Secure profile access" policy
DROP POLICY IF EXISTS "Secure profile access" ON public.profiles;

-- Create a more restrictive policy that only allows:
-- 1. User's own profile
-- 2. Accepted friends only (NOT pending connection requests)
CREATE POLICY "Secure profile access"
ON public.profiles
FOR SELECT
USING (
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
);