-- Fix RLS policy for friendships to properly allow accepting connection requests
DROP POLICY IF EXISTS "Users can create friendships" ON public.friendships;

CREATE POLICY "Users can create friendships"
ON public.friendships
FOR INSERT
WITH CHECK (
  -- Allow if the authenticated user is creating a friendship for themselves
  auth.uid() = user_id OR
  -- Allow if the authenticated user is accepting a connection request
  EXISTS (
    SELECT 1 FROM public.connection_requests
    WHERE recipient_id = auth.uid()
      AND requester_id = user_id
      AND status = 'accepted'
  )
);