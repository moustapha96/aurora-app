-- Migration: Create System Settings Table
-- Description: Crée une table pour stocker les paramètres système configurables

-- Créer la table des paramètres système
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut lire les paramètres (ils sont publics)
CREATE POLICY "Anyone can read system settings"
  ON public.system_settings FOR SELECT
  USING (true);

-- Policy: Seuls les admins peuvent modifier
CREATE POLICY "Only admins can update system settings"
  ON public.system_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Seuls les admins peuvent insérer
CREATE POLICY "Only admins can insert system settings"
  ON public.system_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Créer un index sur la clé pour des recherches rapides
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_system_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_system_settings_updated_at();

-- Insérer le paramètre par défaut pour la limite de filleuls
INSERT INTO public.system_settings (key, value, description)
VALUES (
  'max_referrals_per_user',
  '2',
  'Nombre maximum de filleuls qu''un utilisateur peut parrainer avec son code de parrainage'
)
ON CONFLICT (key) DO NOTHING;

-- Fonction helper pour récupérer un paramètre système
CREATE OR REPLACE FUNCTION public.get_system_setting(p_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_value TEXT;
BEGIN
  SELECT value INTO v_value
  FROM public.system_settings
  WHERE key = p_key;
  
  RETURN COALESCE(v_value, NULL);
END;
$$;

-- Fonction helper pour récupérer un paramètre système en tant qu'entier
CREATE OR REPLACE FUNCTION public.get_system_setting_int(p_key TEXT, p_default INTEGER DEFAULT 2)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_value TEXT;
  v_int_value INTEGER;
BEGIN
  SELECT value INTO v_value
  FROM public.system_settings
  WHERE key = p_key;
  
  IF v_value IS NULL THEN
    RETURN p_default;
  END IF;
  
  BEGIN
    v_int_value := v_value::INTEGER;
    RETURN v_int_value;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN p_default;
  END;
END;
$$;

