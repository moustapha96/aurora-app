-- Allow authenticated users to view basic profile info for member discovery
-- This is essential for a social network to function - members need to discover each other

CREATE POLICY "Authenticated users can view profiles for discovery" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);