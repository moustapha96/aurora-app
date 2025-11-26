-- Script pour créer les tables personal (sports_hobbies, artwork_collection, destinations)
-- À exécuter dans le SQL Editor du Supabase Dashboard
-- Ce script corrige l'erreur 404 pour ces tables

-- ============================================
-- 1. CRÉER LE BUCKET DE STOCKAGE (si nécessaire)
-- ============================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('personal-content', 'personal-content', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. CRÉER LA TABLE artwork_collection
-- ============================================
CREATE TABLE IF NOT EXISTS public.artwork_collection (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  year TEXT NOT NULL,
  medium TEXT NOT NULL,
  price TEXT NOT NULL,
  acquisition TEXT NOT NULL,
  image_url TEXT,
  description TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 3. CRÉER LA TABLE sports_hobbies
-- ============================================
CREATE TABLE IF NOT EXISTS public.sports_hobbies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  badge_text TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter image_url si elle n'existe pas déjà
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sports_hobbies' 
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.sports_hobbies ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- ============================================
-- 4. CRÉER LA TABLE destinations
-- ============================================
CREATE TABLE IF NOT EXISTS public.destinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lieu TEXT NOT NULL,
  type TEXT NOT NULL,
  saison TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 5. ACTIVER RLS
-- ============================================
ALTER TABLE public.artwork_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports_hobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. SUPPRIMER LES ANCIENNES POLITIQUES (si elles existent)
-- ============================================
DROP POLICY IF EXISTS "Users can view their own artwork collection" ON public.artwork_collection;
DROP POLICY IF EXISTS "Users can insert their own artwork collection" ON public.artwork_collection;
DROP POLICY IF EXISTS "Users can update their own artwork collection" ON public.artwork_collection;
DROP POLICY IF EXISTS "Users can delete their own artwork collection" ON public.artwork_collection;
DROP POLICY IF EXISTS "Friends can view artwork collection with personal_access" ON public.artwork_collection;

DROP POLICY IF EXISTS "Users can view their own sports hobbies" ON public.sports_hobbies;
DROP POLICY IF EXISTS "Users can insert their own sports hobbies" ON public.sports_hobbies;
DROP POLICY IF EXISTS "Users can update their own sports hobbies" ON public.sports_hobbies;
DROP POLICY IF EXISTS "Users can delete their own sports hobbies" ON public.sports_hobbies;
DROP POLICY IF EXISTS "Friends can view sports hobbies with personal_access" ON public.sports_hobbies;

DROP POLICY IF EXISTS "Users can view their own destinations" ON public.destinations;
DROP POLICY IF EXISTS "Users can insert their own destinations" ON public.destinations;
DROP POLICY IF EXISTS "Users can update their own destinations" ON public.destinations;
DROP POLICY IF EXISTS "Users can delete their own destinations" ON public.destinations;
DROP POLICY IF EXISTS "Friends can view destinations with personal_access" ON public.destinations;

-- ============================================
-- 7. CRÉER LES POLITIQUES RLS POUR artwork_collection
-- ============================================
-- Les utilisateurs peuvent voir leurs propres données
CREATE POLICY "Users can view their own artwork collection" 
ON public.artwork_collection FOR SELECT 
USING (auth.uid() = user_id);

-- Les amis avec personal_access peuvent voir les données
CREATE POLICY "Friends can view artwork collection with personal_access" 
ON public.artwork_collection FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (
      (friendships.user_id = auth.uid() AND friendships.friend_id = artwork_collection.user_id)
      OR (friendships.friend_id = auth.uid() AND friendships.user_id = artwork_collection.user_id)
    )
    AND friendships.personal_access = true
  )
);

-- Les utilisateurs peuvent insérer leurs propres données
CREATE POLICY "Users can insert their own artwork collection" 
ON public.artwork_collection FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres données
CREATE POLICY "Users can update their own artwork collection" 
ON public.artwork_collection FOR UPDATE 
USING (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres données
CREATE POLICY "Users can delete their own artwork collection" 
ON public.artwork_collection FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- 8. CRÉER LES POLITIQUES RLS POUR sports_hobbies
-- ============================================
-- Les utilisateurs peuvent voir leurs propres données
CREATE POLICY "Users can view their own sports hobbies" 
ON public.sports_hobbies FOR SELECT 
USING (auth.uid() = user_id);

-- Les amis avec personal_access peuvent voir les données
CREATE POLICY "Friends can view sports hobbies with personal_access" 
ON public.sports_hobbies FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (
      (friendships.user_id = auth.uid() AND friendships.friend_id = sports_hobbies.user_id)
      OR (friendships.friend_id = auth.uid() AND friendships.user_id = sports_hobbies.user_id)
    )
    AND friendships.personal_access = true
  )
);

-- Les utilisateurs peuvent insérer leurs propres données
CREATE POLICY "Users can insert their own sports hobbies" 
ON public.sports_hobbies FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres données
CREATE POLICY "Users can update their own sports hobbies" 
ON public.sports_hobbies FOR UPDATE 
USING (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres données
CREATE POLICY "Users can delete their own sports hobbies" 
ON public.sports_hobbies FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- 9. CRÉER LES POLITIQUES RLS POUR destinations
-- ============================================
-- Les utilisateurs peuvent voir leurs propres données
CREATE POLICY "Users can view their own destinations" 
ON public.destinations FOR SELECT 
USING (auth.uid() = user_id);

-- Les amis avec personal_access peuvent voir les données
CREATE POLICY "Friends can view destinations with personal_access" 
ON public.destinations FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (
      (friendships.user_id = auth.uid() AND friendships.friend_id = destinations.user_id)
      OR (friendships.friend_id = auth.uid() AND friendships.user_id = destinations.user_id)
    )
    AND friendships.personal_access = true
  )
);

-- Les utilisateurs peuvent insérer leurs propres données
CREATE POLICY "Users can insert their own destinations" 
ON public.destinations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres données
CREATE POLICY "Users can update their own destinations" 
ON public.destinations FOR UPDATE 
USING (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres données
CREATE POLICY "Users can delete their own destinations" 
ON public.destinations FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- 10. CRÉER LA FONCTION POUR METTRE À JOUR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- 11. CRÉER LES TRIGGERS POUR updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_artwork_collection_updated_at ON public.artwork_collection;
CREATE TRIGGER update_artwork_collection_updated_at
BEFORE UPDATE ON public.artwork_collection
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sports_hobbies_updated_at ON public.sports_hobbies;
CREATE TRIGGER update_sports_hobbies_updated_at
BEFORE UPDATE ON public.sports_hobbies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_destinations_updated_at ON public.destinations;
CREATE TRIGGER update_destinations_updated_at
BEFORE UPDATE ON public.destinations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 12. CRÉER LES POLITIQUES DE STOCKAGE POUR personal-content
-- ============================================
-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view their own personal content images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own personal content images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own personal content images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own personal content images" ON storage.objects;
DROP POLICY IF EXISTS "Friends can view personal content images with personal_access" ON storage.objects;

-- Les utilisateurs peuvent voir leurs propres images
CREATE POLICY "Users can view their own personal content images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'personal-content' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Les amis avec personal_access peuvent voir les images
CREATE POLICY "Friends can view personal content images with personal_access" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'personal-content' 
  AND EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (
      (friendships.user_id = auth.uid() AND friendships.friend_id::text = (storage.foldername(name))[1])
      OR (friendships.friend_id = auth.uid() AND friendships.user_id::text = (storage.foldername(name))[1])
    )
    AND friendships.personal_access = true
  )
);

-- Les utilisateurs peuvent uploader leurs propres images
CREATE POLICY "Users can upload their own personal content images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'personal-content' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Les utilisateurs peuvent mettre à jour leurs propres images
CREATE POLICY "Users can update their own personal content images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'personal-content' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Les utilisateurs peuvent supprimer leurs propres images
CREATE POLICY "Users can delete their own personal content images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'personal-content' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- 13. CRÉER LES INDEXES POUR AMÉLIORER LES PERFORMANCES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_artwork_collection_user_id ON public.artwork_collection(user_id);
CREATE INDEX IF NOT EXISTS idx_sports_hobbies_user_id ON public.sports_hobbies(user_id);
CREATE INDEX IF NOT EXISTS idx_destinations_user_id ON public.destinations(user_id);

-- ============================================
-- 14. VÉRIFICATION
-- ============================================
SELECT 
  'artwork_collection' AS table_name,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'artwork_collection'
UNION ALL
SELECT 
  'sports_hobbies' AS table_name,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'sports_hobbies'
UNION ALL
SELECT 
  'destinations' AS table_name,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'destinations';

-- Afficher les tables créées
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('artwork_collection', 'sports_hobbies', 'destinations')
ORDER BY table_name;

