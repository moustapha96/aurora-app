-- Table pour les codes d'invitation à usage unique
CREATE TABLE IF NOT EXISTS public.single_use_invitation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  invitation_code TEXT NOT NULL UNIQUE,
  code_name TEXT,
  is_used BOOLEAN DEFAULT false,
  used_by UUID,
  used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_single_use_invitation_codes_user_id ON public.single_use_invitation_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_single_use_invitation_codes_code ON public.single_use_invitation_codes(invitation_code);
CREATE INDEX IF NOT EXISTS idx_single_use_invitation_codes_is_used ON public.single_use_invitation_codes(is_used);

-- Enable RLS
ALTER TABLE public.single_use_invitation_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own invitation codes"
ON public.single_use_invitation_codes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invitation codes"
ON public.single_use_invitation_codes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invitation codes"
ON public.single_use_invitation_codes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all invitation codes"
ON public.single_use_invitation_codes
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can validate codes during registration
CREATE POLICY "Anyone can validate invitation codes"
ON public.single_use_invitation_codes
FOR SELECT
USING (is_active = true AND is_used = false);

-- Trigger pour updated_at
CREATE TRIGGER update_single_use_invitation_codes_updated_at
BEFORE UPDATE ON public.single_use_invitation_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Ajouter le paramètre admin pour la limite de codes d'invitation
INSERT INTO public.admin_settings (setting_key, setting_value, description)
VALUES ('max_invitation_codes_per_user', '2', 'Nombre maximum de codes d''invitation à usage unique par membre')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = '2', description = 'Nombre maximum de codes d''invitation à usage unique par membre';

-- Fonction pour valider un code d'invitation à usage unique
CREATE OR REPLACE FUNCTION public.validate_single_use_invitation_code(code_param text)
RETURNS TABLE(sponsor_id uuid, is_valid boolean, code_id uuid)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Input validation
  IF code_param IS NULL OR length(trim(code_param)) = 0 THEN
    RETURN QUERY SELECT NULL::uuid, false, NULL::uuid;
    RETURN;
  END IF;
  
  -- Length validation
  IF length(code_param) > 20 THEN
    RETURN QUERY SELECT NULL::uuid, false, NULL::uuid;
    RETURN;
  END IF;
  
  -- Format validation (must start with AURORA-)
  IF NOT code_param LIKE 'AURORA-%' THEN
    RETURN QUERY SELECT NULL::uuid, false, NULL::uuid;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    c.user_id as sponsor_id,
    true as is_valid,
    c.id as code_id
  FROM public.single_use_invitation_codes c
  WHERE c.invitation_code = code_param
    AND c.is_active = true
    AND c.is_used = false
  LIMIT 1;
END;
$$;

-- Fonction pour marquer un code comme utilisé
CREATE OR REPLACE FUNCTION public.mark_invitation_code_used(code_id_param uuid, used_by_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.single_use_invitation_codes
  SET is_used = true,
      used_by = used_by_param,
      used_at = now(),
      updated_at = now()
  WHERE id = code_id_param
    AND is_used = false;
  
  RETURN FOUND;
END;
$$;