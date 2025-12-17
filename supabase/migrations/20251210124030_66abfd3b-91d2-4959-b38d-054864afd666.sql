-- Table for storing WebAuthn credentials
CREATE TABLE public.webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  device_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

-- Users can view their own credentials
CREATE POLICY "Users can view their own webauthn credentials"
ON public.webauthn_credentials
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own credentials
CREATE POLICY "Users can create their own webauthn credentials"
ON public.webauthn_credentials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own credentials
CREATE POLICY "Users can delete their own webauthn credentials"
ON public.webauthn_credentials
FOR DELETE
USING (auth.uid() = user_id);

-- Users can update last_used_at
CREATE POLICY "Users can update their own webauthn credentials"
ON public.webauthn_credentials
FOR UPDATE
USING (auth.uid() = user_id);

-- Add webauthn_enabled column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS webauthn_enabled BOOLEAN DEFAULT false;

-- Add logging trigger
CREATE TRIGGER log_webauthn_credentials_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.webauthn_credentials
  FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();