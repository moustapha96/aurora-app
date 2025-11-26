-- Fix RLS policies to ensure bidirectional access to friend profiles

-- First, drop the existing policy that might be causing issues
DROP POLICY IF EXISTS "Users can view friend profiles through friendships" ON public.profiles;

-- Create a more robust policy for viewing friend profiles
CREATE POLICY "Users can view friend profiles through friendships"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- User can see profiles of their friends (bidirectional check)
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (friendships.user_id = auth.uid() AND friendships.friend_id = profiles.id)
       OR (friendships.friend_id = auth.uid() AND friendships.user_id = profiles.id)
  )
);

-- Also ensure that users can see profiles of people who sent them connection requests
-- or to whom they sent connection requests (for the Members page)
CREATE POLICY "Users can view profiles in connection requests"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.connection_requests
    WHERE (connection_requests.requester_id = auth.uid() AND connection_requests.recipient_id = profiles.id)
       OR (connection_requests.recipient_id = auth.uid() AND connection_requests.requester_id = profiles.id)
  )
);