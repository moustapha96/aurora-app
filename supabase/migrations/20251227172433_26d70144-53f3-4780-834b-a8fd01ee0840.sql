-- Fix security warnings: set search_path on functions
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.generate_referral_link_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
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