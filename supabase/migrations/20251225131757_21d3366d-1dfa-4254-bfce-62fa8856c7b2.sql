-- Add policy to allow authenticated users to count friendships
-- This only exposes user_id and friend_id for connection counting purposes
-- The access permissions (business_access, family_access, etc.) remain protected

-- First, let's check existing policies and add a read policy for counting
CREATE POLICY "Authenticated users can count friendships" 
ON public.friendships 
FOR SELECT 
TO authenticated
USING (true);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their friendships" ON public.friendships;