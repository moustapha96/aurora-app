-- Drop the existing policy that may be too permissive
DROP POLICY IF EXISTS "Users can view conversation members only if member" ON public.conversation_members;

-- Create a new policy that explicitly restricts to authenticated users who are conversation members
CREATE POLICY "Users can view conversation members only if member"
ON public.conversation_members
FOR SELECT
TO authenticated
USING (is_conversation_member(conversation_id, auth.uid()));