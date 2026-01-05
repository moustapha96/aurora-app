-- Table pour gérer les parrainages
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'rejected'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referred_id) -- Un utilisateur ne peut être parrainé qu'une seule fois
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_referrals_sponsor_id ON public.referrals(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Les utilisateurs peuvent voir leurs propres parrainages (en tant que sponsor)
CREATE POLICY "Users can view their own referrals as sponsor"
  ON public.referrals FOR SELECT
  USING (auth.uid() = sponsor_id);

-- Les utilisateurs peuvent voir qui les a parrainés
CREATE POLICY "Users can view who referred them"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referred_id);

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all referrals"
  ON public.referrals FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Les utilisateurs peuvent insérer leurs propres parrainages (en tant que sponsor)
CREATE POLICY "Users can insert their own referrals as sponsor"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = sponsor_id);

-- Seuls les admins peuvent modifier/supprimer
CREATE POLICY "Only admins can update referrals"
  ON public.referrals FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete referrals"
  ON public.referrals FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Trigger pour updated_at
CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Ajouter le paramètre maxReferralsPerUser dans admin_settings s'il n'existe pas
INSERT INTO public.admin_settings (setting_key, setting_value, description)
VALUES ('max_referrals_per_user', '10', 'Nombre maximum de parrainages possibles par membre')
ON CONFLICT (setting_key) DO NOTHING;

