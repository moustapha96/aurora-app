-- Table pour gérer les codes de parrainage secondaires
CREATE TABLE IF NOT EXISTS public.secondary_referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  code_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_secondary_referral_codes_user_id ON public.secondary_referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_secondary_referral_codes_referral_code ON public.secondary_referral_codes(referral_code);
CREATE INDEX IF NOT EXISTS idx_secondary_referral_codes_is_active ON public.secondary_referral_codes(is_active);

-- Enable RLS
ALTER TABLE public.secondary_referral_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Les utilisateurs peuvent voir leurs propres codes secondaires
CREATE POLICY "Users can view their own secondary referral codes"
  ON public.secondary_referral_codes FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres codes secondaires
CREATE POLICY "Users can insert their own secondary referral codes"
  ON public.secondary_referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent modifier leurs propres codes secondaires
CREATE POLICY "Users can update their own secondary referral codes"
  ON public.secondary_referral_codes FOR UPDATE
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres codes secondaires
CREATE POLICY "Users can delete their own secondary referral codes"
  ON public.secondary_referral_codes FOR DELETE
  USING (auth.uid() = user_id);

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all secondary referral codes"
  ON public.secondary_referral_codes FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_secondary_referral_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_secondary_referral_codes_updated_at
  BEFORE UPDATE ON public.secondary_referral_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_secondary_referral_codes_updated_at();
