-- Trigger pour générer automatiquement le link_code lors de l'insertion
CREATE OR REPLACE FUNCTION public.ensure_referral_link_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Générer le code seulement s'il n'existe pas ou s'il est vide
  IF NEW.link_code IS NULL OR NEW.link_code = '' THEN
    NEW.link_code := public.generate_referral_link_code();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger BEFORE INSERT pour générer le code lors de la création
DROP TRIGGER IF EXISTS ensure_referral_link_code_on_insert ON public.referral_links;
CREATE TRIGGER ensure_referral_link_code_on_insert
  BEFORE INSERT ON public.referral_links
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_referral_link_code();