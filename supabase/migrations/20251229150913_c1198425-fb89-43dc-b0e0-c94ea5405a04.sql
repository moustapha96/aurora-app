
-- Drop overly permissive policy that exposes all profile data
DROP POLICY IF EXISTS "Authenticated users can view all profiles for directory" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles for member discovery" ON public.profiles;

-- Create a secure view for member discovery with minimal information
CREATE OR REPLACE VIEW public.member_discovery AS
SELECT 
  id,
  first_name,
  last_name,
  honorific_title,
  country,
  activity_domain,
  avatar_url,
  is_founder,
  identity_verified
FROM public.profiles
WHERE identity_verified = true OR is_founder = true;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.member_discovery TO authenticated;

-- Create a security definer function to get full profile for friends/own profile
CREATE OR REPLACE FUNCTION public.get_accessible_profile(profile_id uuid)
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  honorific_title text,
  job_function text,
  activity_domain text,
  country text,
  avatar_url text,
  personal_quote text,
  username text,
  is_founder boolean,
  identity_verified boolean,
  referral_code text,
  created_at timestamptz,
  updated_at timestamptz,
  is_linked_account boolean,
  linked_by_user_id uuid,
  can_view_full boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_accessible_profile(uuid) TO authenticated;
