
-- Drop ALL existing SELECT policies on profiles first
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view accepted friends profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can check referral codes" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles for discovery" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles for member discovery" ON public.profiles;

-- Now create strict RLS policies for profiles table

-- 1. Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- 2. Users can view profiles of accepted friends only (bidirectional check)
CREATE POLICY "Users can view accepted friends profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (
      (friendships.user_id = auth.uid() AND friendships.friend_id = profiles.id)
      OR (friendships.friend_id = auth.uid() AND friendships.user_id = profiles.id)
    )
  )
);

-- 3. Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Anyone can check referral codes (needed for registration before auth)
CREATE POLICY "Anyone can check referral codes for registration"
ON public.profiles
FOR SELECT
USING (referral_code IS NOT NULL);
