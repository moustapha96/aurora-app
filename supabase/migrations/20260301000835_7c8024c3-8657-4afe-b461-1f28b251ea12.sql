CREATE POLICY "Anyone can read veriff_required_after_registration"
ON public.admin_settings
FOR SELECT
TO anon, authenticated
USING (setting_key = 'veriff_required_after_registration');