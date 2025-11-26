-- ============================================
-- Script de Configuration Supabase - Network Content
-- ============================================
-- Ce script configure tout ce qui est nécessaire pour la fonctionnalité Network
-- Date : Décembre 2024
-- ============================================

-- ============================================
-- 1. CRÉER LE BUCKET DE STORAGE
-- ============================================
-- Créer le bucket pour stocker les images du contenu réseau
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'network-content', 
  'network-content', 
  false,  -- Bucket privé
  10485760,  -- 10 MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- 2. CRÉER LA TABLE network_content
-- ============================================
CREATE TABLE IF NOT EXISTS public.network_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL CHECK (section_id IN ('social', 'media', 'philanthropy')),
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, section_id)
);

-- ============================================
-- 3. ACTIVER ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.network_content ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CRÉER LES RLS POLICIES
-- ============================================

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Users can view their own network content" ON public.network_content;
DROP POLICY IF EXISTS "Users can view friends network content" ON public.network_content;
DROP POLICY IF EXISTS "Users can insert their own network content" ON public.network_content;
DROP POLICY IF EXISTS "Users can update their own network content" ON public.network_content;
DROP POLICY IF EXISTS "Users can delete their own network content" ON public.network_content;

-- Policy 1 : Les utilisateurs peuvent voir leur propre contenu
CREATE POLICY "Users can view their own network content"
ON public.network_content
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2 : Les utilisateurs peuvent voir le contenu de leurs amis (si network_access = true)
CREATE POLICY "Users can view friends network content"
ON public.network_content
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (
      (friendships.user_id = auth.uid() AND friendships.friend_id = network_content.user_id)
      OR (friendships.friend_id = auth.uid() AND friendships.user_id = network_content.user_id)
    )
    AND friendships.network_access = true
  )
);

-- Policy 3 : Les utilisateurs peuvent créer leur propre contenu
CREATE POLICY "Users can insert their own network content"
ON public.network_content
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 4 : Les utilisateurs peuvent modifier leur propre contenu
CREATE POLICY "Users can update their own network content"
ON public.network_content
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Policy 5 : Les utilisateurs peuvent supprimer leur propre contenu
CREATE POLICY "Users can delete their own network content"
ON public.network_content
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- 5. CRÉER LE TRIGGER POUR updated_at
-- ============================================
-- Vérifier si la fonction existe, sinon la créer
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS update_network_content_updated_at ON public.network_content;

-- Créer le trigger
CREATE TRIGGER update_network_content_updated_at
BEFORE UPDATE ON public.network_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 6. CRÉER LES INDEX
-- ============================================
CREATE INDEX IF NOT EXISTS idx_network_content_user_id ON public.network_content(user_id);
CREATE INDEX IF NOT EXISTS idx_network_content_section_id ON public.network_content(section_id);
CREATE INDEX IF NOT EXISTS idx_network_content_user_section ON public.network_content(user_id, section_id);

-- ============================================
-- 7. CRÉER LES STORAGE POLICIES
-- ============================================

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Users can view their own network content images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view friends network content images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own network content images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own network content images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own network content images" ON storage.objects;

-- Policy 1 : Les utilisateurs peuvent voir leurs propres images
CREATE POLICY "Users can view their own network content images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'network-content' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2 : Les utilisateurs peuvent voir les images de leurs amis (si network_access = true)
CREATE POLICY "Users can view friends network content images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'network-content'
  AND EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (
      (friendships.user_id = auth.uid() AND friendships.friend_id::text = (storage.foldername(name))[1])
      OR (friendships.friend_id = auth.uid() AND friendships.user_id::text = (storage.foldername(name))[1])
    )
    AND friendships.network_access = true
  )
);

-- Policy 3 : Les utilisateurs peuvent uploader leurs propres images
CREATE POLICY "Users can upload their own network content images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'network-content' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4 : Les utilisateurs peuvent modifier leurs propres images
CREATE POLICY "Users can update their own network content images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'network-content' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 5 : Les utilisateurs peuvent supprimer leurs propres images
CREATE POLICY "Users can delete their own network content images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'network-content' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- FIN DU SCRIPT
-- ============================================
-- Vérification : Exécuter les requêtes suivantes pour vérifier la configuration
-- 
-- Vérifier la table :
-- SELECT * FROM network_content LIMIT 5;
--
-- Vérifier le bucket :
-- SELECT * FROM storage.buckets WHERE id = 'network-content';
--
-- Vérifier les RLS policies :
-- SELECT * FROM pg_policies WHERE tablename = 'network_content';
--
-- Vérifier les storage policies :
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
-- ============================================

