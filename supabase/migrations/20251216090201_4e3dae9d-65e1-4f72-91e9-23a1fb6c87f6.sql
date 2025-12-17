-- Ensure RLS is enabled on conversation_members
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner as well (prevents bypassing)
ALTER TABLE public.conversation_members FORCE ROW LEVEL SECURITY;