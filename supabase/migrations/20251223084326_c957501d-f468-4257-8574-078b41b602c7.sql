-- Add policy to allow all authenticated users to view all profiles (member directory)
CREATE POLICY "Authenticated users can view all profiles for directory" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);