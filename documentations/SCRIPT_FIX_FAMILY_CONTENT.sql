-- Script pour corriger les erreurs family_content
-- À exécuter dans le SQL Editor du Supabase Dashboard
-- Ce script corrige l'erreur "Could not find the table 'public.family_content'"

-- ============================================
-- 1. CRÉER LA TABLE family_content
-- ============================================
CREATE TABLE IF NOT EXISTS public.family_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Text content
  bio text,
  family_text text,
  residences_text text,
  philanthropy_text text,
  network_text text,
  anecdotes_text text,
  personal_quote text,
  
  -- Photo URLs
  portrait_url text,
  gallery_photos jsonb DEFAULT '[]'::jsonb,
  
  UNIQUE(user_id)
);

-- Activer RLS
ALTER TABLE public.family_content ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. CRÉER LES RLS POLICIES POUR family_content
-- ============================================

-- Policy 1 : Users can view their own family content
DROP POLICY IF EXISTS "Users can view their own family content" ON public.family_content;
CREATE POLICY "Users can view their own family content"
ON public.family_content
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2 : Users can view friends family content (if they have family_access)
DROP POLICY IF EXISTS "Users can view friends family content" ON public.family_content;
CREATE POLICY "Users can view friends family content"
ON public.family_content
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (
      (friendships.user_id = auth.uid() AND friendships.friend_id = family_content.user_id)
      OR (friendships.friend_id = auth.uid() AND friendships.user_id = family_content.user_id)
    )
    AND friendships.family_access = true
  )
);

-- Policy 3 : Users can insert their own family content
DROP POLICY IF EXISTS "Users can insert their own family content" ON public.family_content;
CREATE POLICY "Users can insert their own family content"
ON public.family_content
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy 4 : Users can update their own family content
DROP POLICY IF EXISTS "Users can update their own family content" ON public.family_content;
CREATE POLICY "Users can update their own family content"
ON public.family_content
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy 5 : Users can delete their own family content
DROP POLICY IF EXISTS "Users can delete their own family content" ON public.family_content;
CREATE POLICY "Users can delete their own family content"
ON public.family_content
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 3. CRÉER LE TRIGGER POUR updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_family_content_updated_at ON public.family_content;
CREATE TRIGGER update_family_content_updated_at
BEFORE UPDATE ON public.family_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 4. VÉRIFICATION
-- ============================================
SELECT 
  'family_content table' AS check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'family_content')
    THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS status;

SELECT 
  'family_content RLS policies' AS check_item,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'family_content';

SELECT 
  'family_content columns' AS check_item,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'family_content'
ORDER BY ordinal_position;

