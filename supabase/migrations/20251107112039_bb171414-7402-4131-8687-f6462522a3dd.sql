-- Update RLS policy for friendships to allow accepting connection requests
-- Drop existing policy
DROP POLICY IF EXISTS "Users can create friendships" ON public.friendships;

-- Create new policy that allows creating friendships when accepting connection requests
CREATE POLICY "Users can create friendships"
ON public.friendships
FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR
  -- Allow if there's an accepted connection request in either direction
  EXISTS (
    SELECT 1 FROM public.connection_requests
    WHERE (
      (requester_id = auth.uid() AND recipient_id = friendships.friend_id) OR
      (recipient_id = auth.uid() AND requester_id = friendships.friend_id)
    )
    AND status = 'accepted'
  )
);