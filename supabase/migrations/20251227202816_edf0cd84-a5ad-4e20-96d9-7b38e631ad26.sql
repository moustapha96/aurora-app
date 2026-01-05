-- Allow anyone to view active referral links (needed for registration validation)
CREATE POLICY "Anyone can view active referral links for registration"
ON public.referral_links
FOR SELECT
USING (is_active = true);