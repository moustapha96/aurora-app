CREATE OR REPLACE FUNCTION public.validate_referral_code(code text)
RETURNS TABLE(sponsor_id uuid, is_valid boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sponsor_id uuid;
BEGIN
  IF code IS NULL OR length(trim(code)) = 0 THEN
    RETURN QUERY SELECT NULL::uuid, false;
    RETURN;
  END IF;

  IF length(code) > 20 THEN
    RETURN QUERY SELECT NULL::uuid, false;
    RETURN;
  END IF;

  IF NOT code LIKE 'AURORA-%' THEN
    RETURN QUERY SELECT NULL::uuid, false;
    RETURN;
  END IF;

  -- 1) Code principal (profiles.referral_code)
  SELECT p.id INTO v_sponsor_id
  FROM public.profiles p
  WHERE p.referral_code = code
  LIMIT 1;

  IF v_sponsor_id IS NOT NULL THEN
    RETURN QUERY SELECT v_sponsor_id, true;
    RETURN;
  END IF;

  -- 2) Code à usage unique (single_use_invitation_codes)
  SELECT c.user_id INTO v_sponsor_id
  FROM public.single_use_invitation_codes c
  WHERE c.invitation_code = code
    AND c.is_active = true
    AND c.is_used = false
  LIMIT 1;

  IF v_sponsor_id IS NOT NULL THEN
    RETURN QUERY SELECT v_sponsor_id, true;
    RETURN;
  END IF;

  RETURN QUERY SELECT NULL::uuid, false;
END;
$function$;