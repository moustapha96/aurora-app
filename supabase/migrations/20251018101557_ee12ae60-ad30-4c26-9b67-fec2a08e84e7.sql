-- Drop all existing policies on conversations
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view conversations they are members of" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations they are members of" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete conversations they are members of" ON public.conversations;

-- Recreate all policies with proper configuration
CREATE POLICY "Users can create conversations" 
ON public.conversations 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can view conversations they are members of" 
ON public.conversations 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM conversation_members
  WHERE conversation_members.conversation_id = conversations.id 
  AND conversation_members.user_id = auth.uid()
));

CREATE POLICY "Users can update conversations they are members of" 
ON public.conversations 
FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM conversation_members
  WHERE conversation_members.conversation_id = conversations.id 
  AND conversation_members.user_id = auth.uid()
));

CREATE POLICY "Users can delete conversations they are members of" 
ON public.conversations 
FOR DELETE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM conversation_members
  WHERE conversation_members.conversation_id = conversations.id 
  AND conversation_members.user_id = auth.uid()
));