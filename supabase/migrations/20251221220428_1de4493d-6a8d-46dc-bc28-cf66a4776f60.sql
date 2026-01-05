-- Fix infinite recursion in conversation_members RLS policy
-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view conversation members only if member" ON public.conversation_members;

-- Create a new policy using the SECURITY DEFINER function to avoid recursion
CREATE POLICY "Users can view conversation members only if member" 
ON public.conversation_members 
FOR SELECT 
USING (is_conversation_member(conversation_id, auth.uid()));