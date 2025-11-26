-- Script pour ajouter toutes les colonnes manquantes à la table profiles
-- À exécuter dans le SQL Editor du Supabase Dashboard
-- Ce script corrige l'erreur "Could not find the 'is_founder' column"

-- ============================================
-- 1. Ajouter avatar_url et is_founder
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS is_founder boolean DEFAULT false;

COMMENT ON COLUMN public.profiles.avatar_url IS 'URL de l''avatar de l''utilisateur';
COMMENT ON COLUMN public.profiles.is_founder IS 'Indique si le membre est un fondateur';

-- ============================================
-- 2. Ajouter is_patron et wealth_billions
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_patron boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS wealth_billions text DEFAULT NULL;

COMMENT ON COLUMN public.profiles.is_patron IS 'Indique si le membre est un patron (mécène)';
COMMENT ON COLUMN public.profiles.wealth_billions IS 'Patrimoine du membre en milliards (ex: "4.5 Md")';

-- ============================================
-- 3. Ajouter wealth_currency, wealth_unit, wealth_amount
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS wealth_currency text,
ADD COLUMN IF NOT EXISTS wealth_unit text,
ADD COLUMN IF NOT EXISTS wealth_amount text;

COMMENT ON COLUMN public.profiles.wealth_currency IS 'Devise du patrimoine (EUR, USD, etc.)';
COMMENT ON COLUMN public.profiles.wealth_unit IS 'Unité du patrimoine (M pour millions, B pour milliards)';
COMMENT ON COLUMN public.profiles.wealth_amount IS 'Montant du patrimoine';

-- ============================================
-- 4. Ajouter country
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS country text;

COMMENT ON COLUMN public.profiles.country IS 'Pays de résidence du membre';

-- ============================================
-- 5. Vérification - Afficher toutes les colonnes de profiles
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================
-- 6. Vérification - Colonnes requises pour l'inscription
-- ============================================
SELECT 
  'Colonnes requises pour l''inscription' AS check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'is_founder'
    ) THEN '✓ is_founder'
    ELSE '✗ is_founder MISSING'
  END AS status
UNION ALL
SELECT 
  'Colonnes requises pour l''inscription',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'avatar_url'
    ) THEN '✓ avatar_url'
    ELSE '✗ avatar_url MISSING'
  END
UNION ALL
SELECT 
  'Colonnes requises pour l''inscription',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'is_patron'
    ) THEN '✓ is_patron'
    ELSE '✗ is_patron MISSING'
  END
UNION ALL
SELECT 
  'Colonnes requises pour l''inscription',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'wealth_billions'
    ) THEN '✓ wealth_billions'
    ELSE '✗ wealth_billions MISSING'
  END
UNION ALL
SELECT 
  'Colonnes requises pour l''inscription',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'wealth_currency'
    ) THEN '✓ wealth_currency'
    ELSE '✗ wealth_currency MISSING'
  END
UNION ALL
SELECT 
  'Colonnes requises pour l''inscription',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'wealth_unit'
    ) THEN '✓ wealth_unit'
    ELSE '✗ wealth_unit MISSING'
  END
UNION ALL
SELECT 
  'Colonnes requises pour l''inscription',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'wealth_amount'
    ) THEN '✓ wealth_amount'
    ELSE '✗ wealth_amount MISSING'
  END
UNION ALL
SELECT 
  'Colonnes requises pour l''inscription',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'country'
    ) THEN '✓ country'
    ELSE '✗ country MISSING'
  END;

