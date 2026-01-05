-- Table pour gérer les liens de partage personnalisés
CREATE TABLE IF NOT EXISTS public.referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  link_code TEXT NOT NULL UNIQUE, -- Code unique pour le lien (ex: AURORA-LINK-XXXXXX)
  link_name TEXT, -- Nom optionnel pour identifier le lien (ex: "Invitation LinkedIn", "Email famille")
  referral_code TEXT NOT NULL, -- Code de parrainage associé
  click_count INTEGER DEFAULT 0, -- Nombre de clics sur le lien
  registration_count INTEGER DEFAULT 0, -- Nombre d'inscriptions via ce lien
  is_active BOOLEAN DEFAULT true, -- Activer/désactiver le lien
  expires_at TIMESTAMPTZ, -- Date d'expiration optionnelle
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_referral_links_sponsor_id ON public.referral_links(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_link_code ON public.referral_links(link_code);
CREATE INDEX IF NOT EXISTS idx_referral_links_referral_code ON public.referral_links(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_links_is_active ON public.referral_links(is_active);

-- Enable RLS
ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Les utilisateurs peuvent voir leurs propres liens
CREATE POLICY "Users can view their own referral links"
  ON public.referral_links FOR SELECT
  USING (auth.uid() = sponsor_id);

-- Les utilisateurs peuvent créer leurs propres liens
CREATE POLICY "Users can insert their own referral links"
  ON public.referral_links FOR INSERT
  WITH CHECK (auth.uid() = sponsor_id);

-- Les utilisateurs peuvent modifier leurs propres liens
CREATE POLICY "Users can update their own referral links"
  ON public.referral_links FOR UPDATE
  USING (auth.uid() = sponsor_id);

-- Les utilisateurs peuvent supprimer leurs propres liens
CREATE POLICY "Users can delete their own referral links"
  ON public.referral_links FOR DELETE
  USING (auth.uid() = sponsor_id);

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all referral links"
  ON public.referral_links FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Fonction pour générer un code de lien unique
CREATE OR REPLACE FUNCTION public.generate_referral_link_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code TEXT := 'AURORA-LINK-';
  i INTEGER;
  char_index INTEGER;
  code_exists BOOLEAN;
BEGIN
  -- Générer un code unique (6 caractères aléatoires)
  LOOP
    code := 'AURORA-LINK-';
    FOR i IN 1..6 LOOP
      char_index := floor(random() * length(chars) + 1)::INTEGER;
      code := code || substr(chars, char_index, 1);
    END LOOP;
    
    -- Vérifier l'unicité
    SELECT EXISTS(SELECT 1 FROM public.referral_links WHERE link_code = code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Trigger pour updated_at
CREATE TRIGGER update_referral_links_updated_at
  BEFORE UPDATE ON public.referral_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Table pour tracker les clics sur les liens (analytics)
CREATE TABLE IF NOT EXISTS public.referral_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.referral_links(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  referer TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les analytics
CREATE INDEX IF NOT EXISTS idx_referral_link_clicks_link_id ON public.referral_link_clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_referral_link_clicks_clicked_at ON public.referral_link_clicks(clicked_at);

-- Enable RLS pour les clics
ALTER TABLE public.referral_link_clicks ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir les clics de leurs liens
CREATE POLICY "Users can view clicks on their links"
  ON public.referral_link_clicks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.referral_links
      WHERE referral_links.id = referral_link_clicks.link_id
        AND referral_links.sponsor_id = auth.uid()
    )
  );

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all clicks"
  ON public.referral_link_clicks FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Seuls les admins peuvent insérer des clics (normalement fait via une fonction edge)
CREATE POLICY "Only admins can insert clicks"
  ON public.referral_link_clicks FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Ajouter le paramètre max_referral_links dans admin_settings
INSERT INTO public.admin_settings (setting_key, setting_value, description)
VALUES ('max_referral_links_per_user', '5', 'Nombre maximum de liens de partage personnalisés par membre')
ON CONFLICT (setting_key) DO NOTHING;

