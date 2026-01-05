-- ============================================
-- 1. SYSTÈME DE PARRAINAGE (referrals)
-- ============================================

-- Table pour gérer les parrainages
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referred_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_referrals_sponsor_id ON public.referrals(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own referrals as sponsor"
  ON public.referrals FOR SELECT
  USING (auth.uid() = sponsor_id);

CREATE POLICY "Users can view who referred them"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referred_id);

CREATE POLICY "Admins can view all referrals"
  ON public.referrals FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own referrals as sponsor"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = sponsor_id);

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

-- Ajouter le paramètre maxReferralsPerUser dans admin_settings
INSERT INTO public.admin_settings (setting_key, setting_value, description)
VALUES ('max_referrals_per_user', '10', 'Nombre maximum de parrainages possibles par membre')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- 2. GÉNÉRATION AUTOMATIQUE DES CODES DE PARRAINAGE
-- ============================================

-- Fonction pour générer un code de parrainage unique au format AURORA-XXXXXX
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code TEXT := 'AURORA-';
  i INTEGER;
  char_index INTEGER;
  code_exists BOOLEAN;
BEGIN
  LOOP
    code := 'AURORA-';
    FOR i IN 1..6 LOOP
      char_index := floor(random() * length(chars) + 1)::INTEGER;
      code := code || substr(chars, char_index, 1);
    END LOOP;
    
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Trigger pour générer automatiquement le code de parrainage lors de la création d'un profil
CREATE OR REPLACE FUNCTION public.ensure_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  
  IF NEW.referral_code IS NOT NULL AND NOT NEW.referral_code LIKE 'AURORA-%' THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger BEFORE INSERT pour générer le code lors de la création
DROP TRIGGER IF EXISTS ensure_referral_code_on_insert ON public.profiles;
CREATE TRIGGER ensure_referral_code_on_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_referral_code();

-- Trigger BEFORE UPDATE pour s'assurer que le code est valide lors de la mise à jour
DROP TRIGGER IF EXISTS ensure_referral_code_on_update ON public.profiles;
CREATE TRIGGER ensure_referral_code_on_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.referral_code IS DISTINCT FROM NEW.referral_code)
  EXECUTE FUNCTION public.ensure_referral_code();

-- Mettre à jour les profils existants qui n'ont pas de code de parrainage
UPDATE public.profiles
SET referral_code = public.generate_referral_code()
WHERE referral_code IS NULL 
   OR referral_code = ''
   OR NOT referral_code LIKE 'AURORA-%';

-- ============================================
-- 3. SYSTÈME DE LIENS DE PARTAGE (referral_links)
-- ============================================

-- Table pour gérer les liens de partage personnalisés
CREATE TABLE IF NOT EXISTS public.referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  link_code TEXT NOT NULL UNIQUE,
  link_name TEXT,
  referral_code TEXT NOT NULL,
  click_count INTEGER DEFAULT 0,
  registration_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
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
CREATE POLICY "Users can view their own referral links"
  ON public.referral_links FOR SELECT
  USING (auth.uid() = sponsor_id);

CREATE POLICY "Users can insert their own referral links"
  ON public.referral_links FOR INSERT
  WITH CHECK (auth.uid() = sponsor_id);

CREATE POLICY "Users can update their own referral links"
  ON public.referral_links FOR UPDATE
  USING (auth.uid() = sponsor_id);

CREATE POLICY "Users can delete their own referral links"
  ON public.referral_links FOR DELETE
  USING (auth.uid() = sponsor_id);

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
  LOOP
    code := 'AURORA-LINK-';
    FOR i IN 1..6 LOOP
      char_index := floor(random() * length(chars) + 1)::INTEGER;
      code := code || substr(chars, char_index, 1);
    END LOOP;
    
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

-- Permettre l'insertion via service role (edge function)
CREATE POLICY "Service can insert clicks"
  ON public.referral_link_clicks FOR INSERT
  WITH CHECK (true);

-- Ajouter le paramètre max_referral_links dans admin_settings
INSERT INTO public.admin_settings (setting_key, setting_value, description)
VALUES ('max_referral_links_per_user', '5', 'Nombre maximum de liens de partage personnalisés par membre')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- 4. TABLE POUR LES MESSAGES DE CONTACT
-- ============================================

-- Table pour stocker les messages de contact
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  user_name TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id ON public.contact_messages(user_id);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own contact messages"
  ON public.contact_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert contact messages"
  ON public.contact_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage all contact messages"
  ON public.contact_messages FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Trigger pour updated_at
CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();