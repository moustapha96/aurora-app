-- Fix RLS policy for conversations table to allow authenticated users to create conversations
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

CREATE POLICY "Users can create conversations" 
ON public.conversations 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Also add DELETE policy for conversations
CREATE POLICY "Users can delete conversations they are members of"
ON public.conversations
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM conversation_members
  WHERE conversation_members.conversation_id = conversations.id
  AND conversation_members.user_id = auth.uid()
));