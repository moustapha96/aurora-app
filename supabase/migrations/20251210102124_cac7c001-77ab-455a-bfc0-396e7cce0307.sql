-- Table for admin platform settings (key-value pairs)
CREATE TABLE public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage settings
CREATE POLICY "Only admins can view settings"
ON public.admin_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert settings"
ON public.admin_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update settings"
ON public.admin_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete settings"
ON public.admin_settings
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Table for identity verification tracking
CREATE TABLE public.identity_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  jumio_account_id text,
  jumio_workflow_execution_id text,
  status text NOT NULL DEFAULT 'pending',
  verification_type text DEFAULT 'id_document',
  first_name_extracted text,
  last_name_extracted text,
  document_type text,
  document_country text,
  verification_result jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own verifications
CREATE POLICY "Users can view their own verifications"
ON public.identity_verifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own verifications
CREATE POLICY "Users can create their own verifications"
ON public.identity_verifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only service role (edge functions) can update verifications
CREATE POLICY "Service role can update verifications"
ON public.identity_verifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all verifications
CREATE POLICY "Admins can view all verifications"
ON public.identity_verifications
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_identity_verifications_updated_at
BEFORE UPDATE ON public.identity_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add verified_identity column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS identity_verified boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS identity_verified_at timestamp with time zone;