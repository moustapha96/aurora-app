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
  -- Générer un code unique (6 caractères aléatoires)
  LOOP
    code := 'AURORA-';
    FOR i IN 1..6 LOOP
      char_index := floor(random() * length(chars) + 1)::INTEGER;
      code := code || substr(chars, char_index, 1);
    END LOOP;
    
    -- Vérifier l'unicité
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
  -- Générer le code seulement s'il n'existe pas ou s'il est vide
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  
  -- S'assurer que le code commence par AURORA-
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

