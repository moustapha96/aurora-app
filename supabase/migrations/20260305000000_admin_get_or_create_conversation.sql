-- Allow admins to get or create a private conversation with any member (e.g. for marketplace reply).
-- Returns conversation_id so the admin can then insert a message.
CREATE OR REPLACE FUNCTION public.get_or_create_conversation_admin(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id uuid;
  existing_conv_id uuid;
  new_conv_id uuid;
BEGIN
  admin_id := auth.uid();
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.has_role(admin_id, 'admin') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  IF other_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid user ID';
  END IF;

  IF admin_id = other_user_id THEN
    RAISE EXCEPTION 'Cannot create conversation with yourself';
  END IF;

  -- Find existing private conversation between admin and other_user_id
  SELECT c.id INTO existing_conv_id
  FROM public.conversations c
  JOIN public.conversation_members cm1 ON c.id = cm1.conversation_id AND cm1.user_id = admin_id
  JOIN public.conversation_members cm2 ON c.id = cm2.conversation_id AND cm2.user_id = other_user_id
  WHERE c.type = 'private'
  LIMIT 1;

  IF existing_conv_id IS NOT NULL THEN
    RETURN existing_conv_id;
  END IF;

  -- Create new conversation and add both members
  INSERT INTO public.conversations (type, title)
  VALUES ('private', 'Conversation privée')
  RETURNING id INTO new_conv_id;

  INSERT INTO public.conversation_members (conversation_id, user_id)
  VALUES
    (new_conv_id, admin_id),
    (new_conv_id, other_user_id);

  RETURN new_conv_id;
END;
$$;
