-- Fix RLS policy for friendships to allow bidirectional friendship creation
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can create friendships" ON friendships;

-- Create a new policy that allows both directions of friendship creation
-- when a connection request has been accepted
CREATE POLICY "Users can create friendships"
ON friendships
FOR INSERT
WITH CHECK (
  -- User can create a friendship where they are the user_id
  auth.uid() = user_id
  OR
  -- User can create a friendship where they are the friend_id
  -- if there's an accepted connection request (in either direction)
  (
    auth.uid() = friend_id
    AND
    (
      EXISTS (
        SELECT 1 FROM connection_requests
        WHERE connection_requests.recipient_id = auth.uid()
        AND connection_requests.requester_id = friendships.user_id
        AND connection_requests.status = 'accepted'
      )
      OR
      EXISTS (
        SELECT 1 FROM connection_requests
        WHERE connection_requests.requester_id = auth.uid()
        AND connection_requests.recipient_id = friendships.user_id
        AND connection_requests.status = 'accepted'
      )
    )
  )
);