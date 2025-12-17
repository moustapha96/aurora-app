-- Update create_private_conversation to validate friendship status
CREATE OR REPLACE FUNCTION public.create_private_conversation(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_conversation_id uuid;
  current_user_id uuid;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if users are friends (bidirectional check)
  IF NOT EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (user_id = current_user_id AND friend_id = other_user_id)
       OR (user_id = other_user_id AND friend_id = current_user_id)
  ) THEN
    RAISE EXCEPTION 'Can only create conversations with friends';
  END IF;

  -- Create the conversation
  INSERT INTO public.conversations (type, title)
  VALUES ('private', 'Conversation privée')
  RETURNING id INTO new_conversation_id;

  -- Add both members
  INSERT INTO public.conversation_members (conversation_id, user_id)
  VALUES 
    (new_conversation_id, current_user_id),
    (new_conversation_id, other_user_id);

  RETURN new_conversation_id;
END;
$$;