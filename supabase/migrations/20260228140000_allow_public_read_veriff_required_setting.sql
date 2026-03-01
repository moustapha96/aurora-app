-- Permettre à la page d'inscription (anon) de lire uniquement le paramètre
-- veriff_required_after_registration pour décider si on redirige vers login ou l'étape vérification.

CREATE POLICY "Anyone can read veriff_required_after_registration"
ON public.admin_settings
FOR SELECT
TO anon, authenticated
USING (setting_key = 'veriff_required_after_registration');
