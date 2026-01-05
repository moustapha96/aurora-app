-- Create a function to get user emails for admin (security definer)
CREATE OR REPLACE FUNCTION public.get_user_emails_for_admin()
RETURNS TABLE(user_id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to call this function
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT au.id as user_id, au.email::text
  FROM auth.users au;
END;
$$;