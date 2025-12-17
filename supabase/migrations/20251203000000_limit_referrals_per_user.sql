-- Migration: Limit number of referrals per referrer
-- Description: Empêche un utilisateur de parrainer plus de 2 personnes avec son code

CREATE OR REPLACE FUNCTION public.validate_and_create_referral(
  p_referral_code TEXT,
  p_new_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_referrer_profile RECORD;
  v_result JSON;
  v_existing_count INTEGER;
BEGIN
  -- Validate input
  IF p_referral_code IS NULL OR p_referral_code = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Code de parrainage requis'
    );
  END IF;

  IF p_new_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ID utilisateur requis'
    );
  END IF;

  -- Trouver le parrain par son code
  SELECT id, first_name, last_name INTO v_referrer_profile
  FROM public.profiles
  WHERE referral_code = p_referral_code
    AND id != p_new_user_id; -- Ne pas se parrainer soi-même
  
  IF v_referrer_profile.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Code de parrainage invalide',
      'code', p_referral_code
    );
  END IF;

  v_referrer_id := v_referrer_profile.id;

  -- Vérifier si une relation existe déjà pour le nouvel utilisateur
  IF EXISTS (
    SELECT 1 FROM public.referrals 
    WHERE referred_id = p_new_user_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cet utilisateur a déjà un parrain'
    );
  END IF;

  -- Limiter le nombre de filleuls par parrain à 2
  SELECT COUNT(*) INTO v_existing_count
  FROM public.referrals
  WHERE referrer_id = v_referrer_id
    AND status = 'completed';

  IF v_existing_count >= 2 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Ce code de parrainage a déjà été utilisé par le nombre maximal de filleuls (2)'
    );
  END IF;
  
  -- Créer la relation de parrainage
  INSERT INTO public.referrals (referrer_id, referred_id, referral_code, status, completed_at)
  VALUES (v_referrer_id, p_new_user_id, p_referral_code, 'completed', now())
  ON CONFLICT (referred_id) DO NOTHING;
  
  RETURN json_build_object(
    'success', true,
    'referrer_id', v_referrer_id,
    'referrer_name', v_referrer_profile.first_name || ' ' || v_referrer_profile.last_name
  );
END;
$$;


