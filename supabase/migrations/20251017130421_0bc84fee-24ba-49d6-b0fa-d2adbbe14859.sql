-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view members of their conversations" ON conversation_members;
DROP POLICY IF EXISTS "Users can add members to conversations they belong to" ON conversation_members;

-- Create a function to check conversation membership without recursion
CREATE OR REPLACE FUNCTION is_conversation_member(conv_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_members
    WHERE conversation_id = conv_id AND conversation_members.user_id = user_id
  );
$$;

-- Create new policies using the function
CREATE POLICY "Users can view members of their conversations"
ON conversation_members
FOR SELECT
USING (is_conversation_member(conversation_id, auth.uid()));

CREATE POLICY "Users can add members to conversations they belong to"
ON conversation_members
FOR INSERT
WITH CHECK (is_conversation_member(conversation_id, auth.uid()));