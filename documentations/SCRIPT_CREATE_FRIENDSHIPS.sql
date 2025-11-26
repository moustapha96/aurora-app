-- Script pour créer la table friendships et toutes ses colonnes sur Supabase
-- À exécuter dans le SQL Editor du Supabase Dashboard

-- Créer la table friendships si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Activer RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Ajouter les colonnes de permissions si elles n'existent pas
DO $$
BEGIN
  -- Ajouter business_access
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'friendships' 
    AND column_name = 'business_access'
  ) THEN
    ALTER TABLE public.friendships 
    ADD COLUMN business_access boolean DEFAULT true;
  END IF;

  -- Ajouter family_access
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'friendships' 
    AND column_name = 'family_access'
  ) THEN
    ALTER TABLE public.friendships 
    ADD COLUMN family_access boolean DEFAULT true;
  END IF;

  -- Ajouter personal_access
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'friendships' 
    AND column_name = 'personal_access'
  ) THEN
    ALTER TABLE public.friendships 
    ADD COLUMN personal_access boolean DEFAULT true;
  END IF;

  -- Ajouter influence_access
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'friendships' 
    AND column_name = 'influence_access'
  ) THEN
    ALTER TABLE public.friendships 
    ADD COLUMN influence_access boolean DEFAULT true;
  END IF;

  -- Ajouter network_access
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'friendships' 
    AND column_name = 'network_access'
  ) THEN
    ALTER TABLE public.friendships 
    ADD COLUMN network_access boolean DEFAULT true;
  END IF;
END $$;

-- Ajouter les commentaires
COMMENT ON COLUMN public.friendships.business_access IS 'Permission to view business section';
COMMENT ON COLUMN public.friendships.family_access IS 'Permission to view family section';
COMMENT ON COLUMN public.friendships.personal_access IS 'Permission to view personal section';
COMMENT ON COLUMN public.friendships.influence_access IS 'Permission to view influence section';
COMMENT ON COLUMN public.friendships.network_access IS 'Permission to view network section';

-- Créer les politiques RLS si elles n'existent pas
DO $$
BEGIN
  -- Politique pour voir ses propres friendships
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'friendships' 
    AND policyname = 'Users can view their friendships'
  ) THEN
    CREATE POLICY "Users can view their friendships"
    ON public.friendships
    FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);
  END IF;

  -- Politique pour créer des friendships
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'friendships' 
    AND policyname = 'Users can create friendships'
  ) THEN
    CREATE POLICY "Users can create friendships"
    ON public.friendships
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Créer les index si ils n'existent pas
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships(friend_id);

