-- Update handle_new_user function to use defaultRole from app_settings
-- This allows admins to configure the default role for new users

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_default_role app_role := 'member';
BEGIN
  -- Get default role from app_settings
  SELECT value::text::app_role INTO v_default_role
  FROM public.app_settings
  WHERE key = 'defaultRole'
  LIMIT 1;
  
  -- If no setting found or invalid, use 'member' as default
  IF v_default_role IS NULL THEN
    v_default_role := 'member';
  END IF;
  
  -- Insert role for new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, v_default_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN new;
END;
$$;

