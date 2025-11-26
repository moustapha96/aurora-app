-- Script combiné pour corriger business_content ET family_content
-- À exécuter dans le SQL Editor du Supabase Dashboard
-- Ce script corrige :
-- 1. L'erreur "Could not find the table 'public.business_content'"
-- 2. L'erreur "Could not find the table 'public.family_content'"
-- 3. Les politiques RLS pour le storage bucket personal-content

-- ============================================
-- 1. CRÉER LA TABLE business_content
-- ============================================
CREATE TABLE IF NOT EXISTS public.business_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  company_description TEXT,
  position_title TEXT,
  achievements_text TEXT,
  portfolio_text TEXT,
  vision_text TEXT,
  company_logo_url TEXT,
  company_photos TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter la contrainte UNIQUE sur user_id si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'business_content_user_id_key'
  ) THEN
    ALTER TABLE public.business_content 
    ADD CONSTRAINT business_content_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Activer RLS
ALTER TABLE public.business_content ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. CRÉER LES RLS POLICIES POUR business_content
-- ============================================

DROP POLICY IF EXISTS "Users can view their own business content" ON public.business_content;
CREATE POLICY "Users can view their own business content"
ON public.business_content
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view friends business content" ON public.business_content;
CREATE POLICY "Users can view friends business content"
ON public.business_content
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (
      (friendships.user_id = auth.uid() AND friendships.friend_id = business_content.user_id)
      OR (friendships.friend_id = auth.uid() AND friendships.user_id = business_content.user_id)
    )
    AND friendships.business_access = true
  )
);

DROP POLICY IF EXISTS "Users can insert their own business content" ON public.business_content;
CREATE POLICY "Users can insert their own business content"
ON public.business_content
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own business content" ON public.business_content;
CREATE POLICY "Users can update their own business content"
ON public.business_content
FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own business content" ON public.business_content;
CREATE POLICY "Users can delete their own business content"
ON public.business_content
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger pour business_content
DROP TRIGGER IF EXISTS update_business_content_updated_at ON public.business_content;
CREATE TRIGGER update_business_content_updated_at
BEFORE UPDATE ON public.business_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 3. CRÉER LA TABLE family_content
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
-- 4. CRÉER LES RLS POLICIES POUR family_content
-- ============================================

DROP POLICY IF EXISTS "Users can view their own family content" ON public.family_content;
CREATE POLICY "Users can view their own family content"
ON public.family_content
FOR SELECT
USING (auth.uid() = user_id);

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

DROP POLICY IF EXISTS "Users can insert their own family content" ON public.family_content;
CREATE POLICY "Users can insert their own family content"
ON public.family_content
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own family content" ON public.family_content;
CREATE POLICY "Users can update their own family content"
ON public.family_content
FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own family content" ON public.family_content;
CREATE POLICY "Users can delete their own family content"
ON public.family_content
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger pour family_content
DROP TRIGGER IF EXISTS update_family_content_updated_at ON public.family_content;
CREATE TRIGGER update_family_content_updated_at
BEFORE UPDATE ON public.family_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. VÉRIFIER/CRÉER LE BUCKET personal-content
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('personal-content', 'personal-content', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. CRÉER LES STORAGE POLICIES POUR personal-content
-- ============================================

-- Policy 1 : Users can view their own files (including subdirectories like business/, family/)
DROP POLICY IF EXISTS "Users can view their own personal content" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own personal content images" ON storage.objects;
CREATE POLICY "Users can view their own personal content"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'personal-content' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2 : Users can upload their own files (including subdirectories like business/, family/)
DROP POLICY IF EXISTS "Users can upload their own personal content" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own personal content images" ON storage.objects;
CREATE POLICY "Users can upload their own personal content"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'personal-content' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3 : Users can update their own files (including subdirectories like business/, family/)
DROP POLICY IF EXISTS "Users can update their own personal content" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own personal content images" ON storage.objects;
CREATE POLICY "Users can update their own personal content"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'personal-content' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4 : Users can delete their own files (including subdirectories like business/, family/)
DROP POLICY IF EXISTS "Users can delete their own personal content" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own personal content images" ON storage.objects;
CREATE POLICY "Users can delete their own personal content"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'personal-content' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- 7. VÉRIFICATION
-- ============================================
SELECT 
  'business_content table' AS check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'business_content')
    THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS status
UNION ALL
SELECT 
  'family_content table' AS check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'family_content')
    THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS status
UNION ALL
SELECT 
  'personal-content bucket' AS check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'personal-content')
    THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS status;

SELECT 
  'business_content RLS policies' AS check_item,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'business_content'
UNION ALL
SELECT 
  'family_content RLS policies' AS check_item,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'family_content'
UNION ALL
SELECT 
  'personal-content storage policies' AS check_item,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%personal content%';

