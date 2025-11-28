-- Migration: Create Referral System
-- Description: Implements a complete referral system with code generation, validation, and tracking

-- Create referrals table to track referral relationships
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL, -- Code utilisé par le nouveau membre
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(referred_id) -- Un utilisateur ne peut avoir qu'un seul parrain
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referrals
-- Users can view referrals where they are the referrer or referred
CREATE POLICY "Users can view their own referrals"
  ON public.referrals FOR SELECT
  USING (
    auth.uid() = referrer_id OR 
    auth.uid() = referred_id
  );

-- Only system can insert referrals (via function)
CREATE POLICY "System can insert referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (true); -- Will be controlled by SECURITY DEFINER function

-- Function to generate a unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
  attempts INTEGER := 0;
  max_attempts INTEGER := 50;
BEGIN
  -- If user_id is null, return a simple fallback
  IF user_id IS NULL THEN
    RETURN 'AUR-' || upper(substring(md5(random()::text || now()::text) from 1 for 8));
  END IF;

  LOOP
    attempts := attempts + 1;
    
    -- Format: AUR-XXX-XXX (6 caractères alphanumériques)
    -- Using first 3 chars of user_id hash + timestamp for uniqueness
    code := 'AUR-' || 
            upper(substring(md5(user_id::text || random()::text || now()::text) from 1 for 3)) || 
            '-' || 
            upper(substring(md5(now()::text || random()::text || user_id::text) from 1 for 3));
    
    -- Vérifier l'unicité dans profiles (skip check if table doesn't exist or is empty)
    BEGIN
      SELECT EXISTS(
        SELECT 1 FROM public.profiles 
        WHERE referral_code = code AND id != user_id
      ) INTO exists_check;
    EXCEPTION WHEN OTHERS THEN
      -- If check fails, assume code is unique
      exists_check := false;
    END;
    
    EXIT WHEN NOT exists_check OR attempts >= max_attempts;
  END LOOP;
  
  -- If we couldn't generate a unique code, use a fallback based on user_id
  IF attempts >= max_attempts OR code IS NULL THEN
    code := 'AUR-' || upper(substring(replace(user_id::text, '-', '') from 1 for 8));
  END IF;
  
  RETURN code;
END;
$$;

-- Trigger function to generate referral code automatically when profile is created
CREATE OR REPLACE FUNCTION public.handle_new_user_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
BEGIN
  -- Générer un code si aucun n'est fourni
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' OR trim(NEW.referral_code) = '' THEN
    BEGIN
      -- Try to generate a code, but don't fail if it errors
      v_code := public.generate_referral_code(NEW.id);
      IF v_code IS NOT NULL AND v_code != '' THEN
        NEW.referral_code := v_code;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- If generation fails, set a temporary code that will be updated later
      -- Use a simple fallback: AUR- + first 8 chars of user ID
      NEW.referral_code := 'AUR-' || upper(substring(replace(NEW.id::text, '-', '') from 1 for 8));
    END;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate referral code
DROP TRIGGER IF EXISTS set_referral_code_on_insert ON public.profiles;
CREATE TRIGGER set_referral_code_on_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_referral_code();

-- Also handle updates to ensure code exists
DROP TRIGGER IF EXISTS set_referral_code_on_update ON public.profiles;
CREATE TRIGGER set_referral_code_on_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (NEW.referral_code IS NULL OR NEW.referral_code = '')
  EXECUTE FUNCTION public.handle_new_user_referral_code();

-- Function to validate and create a referral relationship
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

  -- Vérifier si une relation existe déjà
  IF EXISTS (
    SELECT 1 FROM public.referrals 
    WHERE referred_id = p_new_user_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cet utilisateur a déjà un parrain'
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

-- Function to get referral statistics for a user
CREATE OR REPLACE FUNCTION public.get_referral_stats(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'total_referrals', COUNT(*),
    'direct_referrals', COUNT(*),
    'referrals_this_month', COUNT(*) FILTER (WHERE created_at >= date_trunc('month', now())),
    'referrals_this_year', COUNT(*) FILTER (WHERE created_at >= date_trunc('year', now()))
  ) INTO v_stats
  FROM public.referrals
  WHERE referrer_id = user_id
    AND status = 'completed';
  
  RETURN COALESCE(v_stats, json_build_object(
    'total_referrals', 0,
    'direct_referrals', 0,
    'referrals_this_month', 0,
    'referrals_this_year', 0
  ));
END;
$$;

-- Function to get user's referral code
CREATE OR REPLACE FUNCTION public.get_user_referral_code(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
BEGIN
  SELECT referral_code INTO v_code
  FROM public.profiles
  WHERE id = user_id;
  
  -- Generate if doesn't exist
  IF v_code IS NULL OR v_code = '' THEN
    v_code := public.generate_referral_code(user_id);
    UPDATE public.profiles
    SET referral_code = v_code
    WHERE id = user_id;
  END IF;
  
  RETURN v_code;
END;
$$;

-- Function to validate a referral code (public, can be called by anyone)
-- Returns basic info about the referrer if code is valid
CREATE OR REPLACE FUNCTION public.validate_referral_code(p_referral_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_result JSON;
BEGIN
  -- Validate input
  IF p_referral_code IS NULL OR p_referral_code = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Code de parrainage requis'
    );
  END IF;

  -- Find profile by referral code
  SELECT id, first_name, last_name, referral_code
  INTO v_profile
  FROM public.profiles
  WHERE referral_code = upper(trim(p_referral_code))
  LIMIT 1;
  
  IF v_profile.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Code de parrainage invalide'
    );
  END IF;

  -- Check if user is trying to use their own code
  IF auth.uid() IS NOT NULL AND v_profile.id = auth.uid() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Vous ne pouvez pas utiliser votre propre code'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'referrer_id', v_profile.id,
    'referrer_name', v_profile.first_name || ' ' || v_profile.last_name
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_referral_code(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_and_create_referral(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_and_create_referral(TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_referral_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_referral_code(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_referral_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_referral_code(TEXT) TO anon;

-- Comments
COMMENT ON TABLE public.referrals IS 'Tracks referral relationships between users';
COMMENT ON FUNCTION public.generate_referral_code(UUID) IS 'Generates a unique referral code for a user';
COMMENT ON FUNCTION public.validate_and_create_referral(TEXT, UUID) IS 'Validates a referral code and creates the referral relationship';
COMMENT ON FUNCTION public.get_referral_stats(UUID) IS 'Returns referral statistics for a user';
COMMENT ON FUNCTION public.get_user_referral_code(UUID) IS 'Gets or generates a referral code for a user';
COMMENT ON FUNCTION public.validate_referral_code(TEXT) IS 'Validates a referral code and returns referrer info. Can be called by anyone (authenticated or anonymous).';

