-- 1. Update validate_referral_code with input validation
CREATE OR REPLACE FUNCTION public.validate_referral_code(code text)
 RETURNS TABLE(sponsor_id uuid, is_valid boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Input validation
  IF code IS NULL OR length(trim(code)) = 0 THEN
    RETURN QUERY SELECT NULL::uuid as sponsor_id, false as is_valid;
    RETURN;
  END IF;
  
  -- Length validation (AURORA-XXXXXX = 13 characters max)
  IF length(code) > 20 THEN
    RETURN QUERY SELECT NULL::uuid as sponsor_id, false as is_valid;
    RETURN;
  END IF;
  
  -- Format validation (must start with AURORA-)
  IF NOT code LIKE 'AURORA-%' THEN
    RETURN QUERY SELECT NULL::uuid as sponsor_id, false as is_valid;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT p.id as sponsor_id, true as is_valid
  FROM public.profiles p
  WHERE p.referral_code = code
  LIMIT 1;
END;
$function$;

-- 2. Update validate_referral_link with input validation
CREATE OR REPLACE FUNCTION public.validate_referral_link(link_code_param text)
 RETURNS TABLE(sponsor_id uuid, referral_code text, is_family_link boolean, is_valid boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Input validation
  IF link_code_param IS NULL OR length(trim(link_code_param)) = 0 THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::boolean, false;
    RETURN;
  END IF;
  
  -- Length validation (AURORA-LINK-XXXXXX = 18 characters max)
  IF length(link_code_param) > 25 THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::boolean, false;
    RETURN;
  END IF;
  
  -- Format validation (must start with AURORA-LINK-)
  IF NOT link_code_param LIKE 'AURORA-LINK-%' THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::boolean, false;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    rl.sponsor_id,
    rl.referral_code,
    rl.is_family_link,
    true as is_valid
  FROM public.referral_links rl
  WHERE rl.link_code = link_code_param
    AND rl.is_active = true
    AND (rl.expires_at IS NULL OR rl.expires_at > now())
  LIMIT 1;
END;
$function$;

-- 3. Update create_private_conversation with enhanced validation
CREATE OR REPLACE FUNCTION public.create_private_conversation(other_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_conversation_id uuid;
  current_user_id uuid;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  -- Authentication check
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Input validation
  IF other_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid user ID';
  END IF;
  
  -- Prevent self-conversation
  IF current_user_id = other_user_id THEN
    RAISE EXCEPTION 'Cannot create conversation with yourself';
  END IF;
  
  -- Verify other user exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = other_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Check if users are friends (bidirectional check)
  IF NOT EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (user_id = current_user_id AND friend_id = other_user_id)
       OR (user_id = other_user_id AND friend_id = current_user_id)
  ) THEN
    RAISE EXCEPTION 'Can only create conversations with friends';
  END IF;
  
  -- Check if conversation already exists
  IF EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.conversation_members cm1 ON c.id = cm1.conversation_id AND cm1.user_id = current_user_id
    JOIN public.conversation_members cm2 ON c.id = cm2.conversation_id AND cm2.user_id = other_user_id
    WHERE c.type = 'private'
  ) THEN
    RAISE EXCEPTION 'Conversation already exists';
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
$function$;

-- 4. Update get_accessible_profile with input validation
CREATE OR REPLACE FUNCTION public.get_accessible_profile(profile_id uuid)
 RETURNS TABLE(id uuid, first_name text, last_name text, honorific_title text, job_function text, activity_domain text, country text, avatar_url text, personal_quote text, username text, is_founder boolean, identity_verified boolean, referral_code text, created_at timestamp with time zone, updated_at timestamp with time zone, is_linked_account boolean, linked_by_user_id uuid, can_view_full boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Input validation
  IF profile_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Authentication check
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.honorific_title,
    p.job_function,
    p.activity_domain,
    p.country,
    p.avatar_url,
    p.personal_quote,
    p.username,
    p.is_founder,
    p.identity_verified,
    p.referral_code,
    p.created_at,
    p.updated_at,
    p.is_linked_account,
    p.linked_by_user_id,
    (
      -- Can view full if: own profile, friend, or admin
      p.id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM friendships f
        WHERE (f.user_id = auth.uid() AND f.friend_id = p.id)
           OR (f.friend_id = auth.uid() AND f.user_id = p.id)
      )
      OR public.has_role(auth.uid(), 'admin')
    ) as can_view_full
  FROM profiles p
  WHERE p.id = profile_id;
END;
$function$;

-- 5. Update is_conversation_member with input validation  
CREATE OR REPLACE FUNCTION public.is_conversation_member(conv_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Input validation
  IF conv_id IS NULL OR user_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM conversation_members cm
    WHERE cm.conversation_id = conv_id AND cm.user_id = is_conversation_member.user_id
  );
END;
$function$;