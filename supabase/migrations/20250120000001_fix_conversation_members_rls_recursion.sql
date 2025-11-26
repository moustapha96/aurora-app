-- Fix infinite recursion in conversation_members RLS policies
-- The issue: policies use is_conversation_member() which queries conversation_members,
-- creating a recursive loop when RLS is checked

-- ============================================
-- 1. DROP EXISTING PROBLEMATIC POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view members of their conversations" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can add members to conversations they belong to" ON public.conversation_members;

-- ============================================
-- 2. CREATE A FUNCTION THAT BYPASSES RLS COMPLETELY
-- ============================================
-- The function uses SECURITY DEFINER to bypass RLS when checking membership
-- This prevents infinite recursion because the function runs with elevated privileges
CREATE OR REPLACE FUNCTION public.is_conversation_member(conv_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  -- Direct query that bypasses RLS due to SECURITY DEFINER
  -- This prevents recursion because the function executes with owner privileges
  SELECT EXISTS (
    SELECT 1 
    FROM public.conversation_members
    WHERE conversation_id = conv_id 
      AND user_id = check_user_id
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) TO authenticated;

-- ============================================
-- 3. CREATE NON-RECURSIVE POLICIES
-- ============================================
-- Policy for SELECT: Users can view members of conversations they belong to
-- This uses the SECURITY DEFINER function which bypasses RLS, preventing recursion
CREATE POLICY "Users can view members of their conversations"
ON public.conversation_members
FOR SELECT
TO authenticated
USING (public.is_conversation_member(conversation_id, auth.uid()));

-- Policy for INSERT: Users can add members to conversations they belong to
-- For INSERT, we check if the user is a member of the conversation they're adding to
CREATE POLICY "Users can add members to conversations they belong to"
ON public.conversation_members
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user is adding themselves (for joining conversations)
  user_id = auth.uid()
  OR
  -- Allow if user is already a member of this conversation
  public.is_conversation_member(conversation_id, auth.uid())
);

-- Policy for admins: Admins can view all conversation members
CREATE POLICY "Admins can view all conversation members"
ON public.conversation_members
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 4. FIX MESSAGES POLICIES TO USE THE FUNCTION
-- ============================================
-- Update existing messages policies to use is_conversation_member() 
-- to avoid recursion when checking conversation_members

-- Drop and recreate the SELECT policy for messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
TO authenticated
USING (
  public.is_conversation_member(conversation_id, auth.uid())
);

-- Drop and recreate the INSERT policy for messages
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
CREATE POLICY "Users can insert messages in their conversations"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND public.is_conversation_member(conversation_id, auth.uid())
);

-- ============================================
-- 5. ADD ADMIN POLICIES FOR MESSAGES
-- ============================================
-- Allow admins to view all messages for moderation
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins can view all messages"
ON public.messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete any messages for moderation
DROP POLICY IF EXISTS "Admins can delete any messages" ON public.messages;
CREATE POLICY "Admins can delete any messages"
ON public.messages
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 6. FIX CONVERSATIONS POLICIES TO USE THE FUNCTION
-- ============================================
-- Update existing conversations policies to use is_conversation_member()
-- to avoid recursion when checking conversation_members

-- Drop and recreate the SELECT policy for conversations
DROP POLICY IF EXISTS "Users can view conversations they are members of" ON public.conversations;
CREATE POLICY "Users can view conversations they are members of"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  public.is_conversation_member(id, auth.uid())
);

-- Drop and recreate the UPDATE policy for conversations
DROP POLICY IF EXISTS "Users can update conversations they are members of" ON public.conversations;
CREATE POLICY "Users can update conversations they are members of"
ON public.conversations
FOR UPDATE
TO authenticated
USING (
  public.is_conversation_member(id, auth.uid())
);

-- Drop and recreate the DELETE policy for conversations
DROP POLICY IF EXISTS "Users can delete conversations they are members of" ON public.conversations;
CREATE POLICY "Users can delete conversations they are members of"
ON public.conversations
FOR DELETE
TO authenticated
USING (
  public.is_conversation_member(id, auth.uid())
);

-- ============================================
-- 7. ADD ADMIN POLICIES FOR CONVERSATIONS
-- ============================================
-- Allow admins to view all conversations
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;
CREATE POLICY "Admins can view all conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

