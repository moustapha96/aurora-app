
-- Drop the overly permissive policy that exposes all referral links data
DROP POLICY IF EXISTS "Public can validate active link codes" ON public.referral_links;

-- Create a security definer function to validate referral link codes without exposing full data
CREATE OR REPLACE FUNCTION public.validate_referral_link(link_code_param text)
RETURNS TABLE(
  sponsor_id uuid,
  referral_code text,
  is_family_link boolean,
  is_valid boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    sponsor_id,
    referral_code,
    is_family_link,
    true as is_valid
  FROM public.referral_links
  WHERE link_code = link_code_param
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.validate_referral_link(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_referral_link(text) TO authenticated;
