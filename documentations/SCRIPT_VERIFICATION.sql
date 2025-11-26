-- Script de vérification pour vérifier que tout est bien configuré sur Supabase
-- À exécuter dans le SQL Editor du Supabase Dashboard

-- ============================================
-- 1. Vérifier la table friendships
-- ============================================
SELECT 
  'friendships table' AS check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'friendships')
    THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS status;

-- Vérifier les colonnes de friendships
SELECT 
  'friendships columns' AS check_item,
  column_name,
  data_type,
  CASE 
    WHEN column_name IN ('id', 'user_id', 'friend_id', 'created_at', 
                         'business_access', 'family_access', 'personal_access', 
                         'influence_access', 'network_access')
    THEN '✓'
    ELSE '?'
  END AS expected
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'friendships'
ORDER BY ordinal_position;

-- ============================================
-- 2. Vérifier la table network_content
-- ============================================
SELECT 
  'network_content table' AS check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'network_content')
    THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS status;

-- Vérifier les colonnes de network_content
SELECT 
  'network_content columns' AS check_item,
  column_name,
  data_type,
  CASE 
    WHEN column_name IN ('id', 'user_id', 'section_id', 'title', 'content', 
                         'image_url', 'social_links', 'created_at', 'updated_at')
    THEN '✓'
    ELSE '?'
  END AS expected
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'network_content'
ORDER BY ordinal_position;

-- ============================================
-- 3. Vérifier le bucket de stockage
-- ============================================
SELECT 
  'network-content bucket' AS check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'network-content')
    THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS status;

-- Détails du bucket
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets
WHERE id = 'network-content';

-- ============================================
-- 4. Vérifier les politiques RLS pour friendships
-- ============================================
SELECT 
  'friendships RLS policies' AS check_item,
  policyname,
  CASE 
    WHEN policyname IN ('Users can view their friendships', 'Users can create friendships')
    THEN '✓'
    ELSE '?'
  END AS expected
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'friendships'
ORDER BY policyname;

-- ============================================
-- 5. Vérifier les politiques RLS pour network_content
-- ============================================
SELECT 
  'network_content RLS policies' AS check_item,
  policyname,
  CASE 
    WHEN policyname IN (
      'Users can view their own network content',
      'Users can view friends network content',
      'Users can insert their own network content',
      'Users can update their own network content',
      'Users can delete their own network content'
    )
    THEN '✓'
    ELSE '?'
  END AS expected
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'network_content'
ORDER BY policyname;

-- ============================================
-- 6. Vérifier les politiques de stockage pour network-content
-- ============================================
SELECT 
  'network-content storage policies' AS check_item,
  policyname,
  CASE 
    WHEN policyname IN (
      'Users can view their own network content images',
      'Users can view friends network content images',
      'Users can upload their own network content images',
      'Users can update their own network content images',
      'Users can delete their own network content images'
    )
    THEN '✓'
    ELSE '?'
  END AS expected
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%network content%'
ORDER BY policyname;

-- ============================================
-- 7. Vérifier les index
-- ============================================
SELECT 
  'Indexes' AS check_item,
  tablename,
  indexname,
  CASE 
    WHEN indexname IN (
      'idx_friendships_user_id',
      'idx_friendships_friend_id',
      'idx_network_content_user_id',
      'idx_network_content_section_id'
    )
    THEN '✓'
    ELSE '?'
  END AS expected
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    tablename = 'friendships' 
    OR tablename = 'network_content'
  )
ORDER BY tablename, indexname;

-- ============================================
-- 8. Vérifier les triggers
-- ============================================
SELECT 
  'Triggers' AS check_item,
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  CASE 
    WHEN tgname = 'update_network_content_updated_at'
    THEN '✓'
    ELSE '?'
  END AS expected
FROM pg_trigger
WHERE tgrelid IN (
  SELECT oid FROM pg_class WHERE relname = 'network_content'
)
AND tgisinternal = false
ORDER BY tgname;

-- ============================================
-- 9. Résumé de vérification
-- ============================================
SELECT 
  '=== RÉSUMÉ DE VÉRIFICATION ===' AS summary;

SELECT 
  'friendships table exists' AS item,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'friendships') AS status;

SELECT 
  'friendships.network_access column exists' AS item,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'friendships' 
    AND column_name = 'network_access'
  ) AS status;

SELECT 
  'network_content table exists' AS item,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'network_content') AS status;

SELECT 
  'network-content bucket exists' AS item,
  EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'network-content') AS status;

SELECT 
  'RLS enabled on friendships' AS item,
  EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'friendships'
  ) AND (
    SELECT rowsecurity FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'friendships'
  ) AS status;

SELECT 
  'RLS enabled on network_content' AS item,
  EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'network_content'
  ) AND (
    SELECT rowsecurity FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'network_content'
  ) AS status;

