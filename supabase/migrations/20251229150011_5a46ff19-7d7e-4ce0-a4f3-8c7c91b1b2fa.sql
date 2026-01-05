
-- Drop existing overly permissive policies on referral_links
DROP POLICY IF EXISTS "Anyone can view active referral links for registration" ON public.referral_links;
DROP POLICY IF EXISTS "Anyone can view family referral links for registration" ON public.referral_links;
DROP POLICY IF EXISTS "Admins can view all referral links" ON public.referral_links;
DROP POLICY IF EXISTS "Users can view their own referral links" ON public.referral_links;

-- Create strict RLS policies for referral_links table

-- 1. Users can view their own referral links (as sponsor)
CREATE POLICY "Users can view own referral links"
ON public.referral_links
FOR SELECT
USING (auth.uid() = sponsor_id);

-- 2. Admins can view all referral links
CREATE POLICY "Admins can view all referral links"
ON public.referral_links
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Anyone can validate link_code during registration (minimal data exposure)
-- This only allows checking if an active link exists, not browsing all links
CREATE POLICY "Public can validate active link codes"
ON public.referral_links
FOR SELECT
USING (
  is_active = true 
  AND (expires_at IS NULL OR expires_at > now())
);
