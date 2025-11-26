-- Create app_settings table to store application-wide settings
-- This table stores all admin-configured settings that affect the entire application

CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('general', 'security', 'email', 'notifications')),
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view and modify settings
CREATE POLICY "Admins can view all settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert settings"
ON public.app_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update settings"
ON public.app_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete settings"
ON public.app_settings
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow authenticated users to read settings (for application use)
-- This is needed so the app can check maintenance mode, registration status, etc.
CREATE POLICY "Authenticated users can read public settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (
  key IN (
    'maintenanceMode',
    'allowRegistrations',
    'requireEmailVerification',
    'siteName',
    'siteDescription',
    'maxLoginAttempts',
    'lockoutDuration',
    'sessionTimeout',
    'passwordMinLength',
    'passwordRequireUppercase',
    'passwordRequireNumbers',
    'passwordRequireSpecialChars'
  )
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(key);
CREATE INDEX IF NOT EXISTS idx_app_settings_category ON public.app_settings(category);

-- Trigger to update updated_at
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.app_settings (key, value, category, description) VALUES
  ('siteName', '"Aurora Society"', 'general', 'Site name'),
  ('siteDescription', '"Exclusive network for high-net-worth individuals"', 'general', 'Site description'),
  ('maintenanceMode', 'false', 'general', 'Maintenance mode - blocks non-admin access'),
  ('allowRegistrations', 'true', 'general', 'Allow new user registrations'),
  ('requireEmailVerification', 'true', 'general', 'Require email verification for new users'),
  ('defaultRole', '"member"', 'general', 'Default role for new users'),
  ('maxLoginAttempts', '5', 'security', 'Maximum login attempts before lockout'),
  ('lockoutDuration', '15', 'security', 'Lockout duration in minutes'),
  ('sessionTimeout', '60', 'security', 'Session timeout in minutes'),
  ('require2FA', 'false', 'security', 'Require two-factor authentication'),
  ('passwordMinLength', '8', 'security', 'Minimum password length'),
  ('passwordRequireUppercase', 'true', 'security', 'Require uppercase letters in password'),
  ('passwordRequireNumbers', 'true', 'security', 'Require numbers in password'),
  ('passwordRequireSpecialChars', 'true', 'security', 'Require special characters in password'),
  ('smtpHost', '""', 'email', 'SMTP server host'),
  ('smtpPort', '587', 'email', 'SMTP server port'),
  ('smtpUser', '""', 'email', 'SMTP username'),
  ('smtpPassword', '""', 'email', 'SMTP password'),
  ('fromEmail', '"noreply@aurorasociety.ch"', 'email', 'Email sender address'),
  ('fromName', '"Aurora Society"', 'email', 'Email sender name'),
  ('emailOnNewUser', 'true', 'notifications', 'Send email on new user registration'),
  ('emailOnNewConnection', 'true', 'notifications', 'Send email on new connection request'),
  ('emailOnNewMessage', 'true', 'notifications', 'Send email on new message'),
  ('emailOnReport', 'true', 'notifications', 'Send email on content report'),
  ('emailOnError', 'true', 'notifications', 'Send email on system error')
ON CONFLICT (key) DO NOTHING;

