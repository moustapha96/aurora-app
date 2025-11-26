-- Allow users to view other profiles (read-only) for connection requests and friendships
CREATE POLICY "Users can view all profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Allow users to view profiles of friends
CREATE POLICY "Users can view friend profiles through friendships"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (friendships.user_id = auth.uid() AND friendships.friend_id = profiles.id)
    OR (friendships.friend_id = auth.uid() AND friendships.user_id = profiles.id)
  )
);