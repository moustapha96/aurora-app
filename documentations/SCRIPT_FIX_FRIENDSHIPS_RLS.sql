-- Script pour corriger les politiques RLS de la table friendships
-- À exécuter dans le SQL Editor du Supabase Dashboard
-- Ce script corrige l'erreur "new row violates row-level security policy for table friendships"
-- lors de l'acceptation d'une demande de connexion

-- ============================================
-- 1. SUPPRIMER LES ANCIENNES POLITIQUES
-- ============================================
DROP POLICY IF EXISTS "Users can create friendships" ON public.friendships;

-- ============================================
-- 2. CRÉER LA NOUVELLE POLITIQUE RLS
-- ============================================
-- Cette politique permet de créer des friendships dans les deux directions
-- quand une connection_request a été acceptée
CREATE POLICY "Users can create friendships"
ON public.friendships
FOR INSERT
WITH CHECK (
  -- Cas 1 : L'utilisateur crée une friendship où il est user_id (cas normal)
  auth.uid() = user_id
  OR
  -- Cas 2 : L'utilisateur crée une friendship où il est friend_id
  -- ET il y a une connection_request acceptée entre eux
  (
    auth.uid() = friend_id
    AND EXISTS (
      SELECT 1 FROM public.connection_requests
      WHERE (
        (connection_requests.recipient_id = auth.uid() 
         AND connection_requests.requester_id = friendships.user_id
         AND connection_requests.status = 'accepted')
        OR
        (connection_requests.requester_id = auth.uid() 
         AND connection_requests.recipient_id = friendships.user_id
         AND connection_requests.status = 'accepted')
      )
    )
  )
  OR
  -- Cas 3 : Permettre la création bidirectionnelle lors de l'acceptation
  -- L'utilisateur connecté peut créer une friendship pour l'autre direction
  -- si une connection_request acceptée existe entre auth.uid() et user_id OU friend_id
  EXISTS (
    SELECT 1 FROM public.connection_requests cr
    WHERE cr.status = 'accepted'
      AND (
        -- L'utilisateur connecté est impliqué dans la connection_request
        (cr.requester_id = auth.uid() OR cr.recipient_id = auth.uid())
        AND
        -- Et l'autre partie de la connection_request correspond à user_id ou friend_id
        (
          (cr.requester_id = auth.uid() AND cr.recipient_id = friendships.user_id)
          OR
          (cr.recipient_id = auth.uid() AND cr.requester_id = friendships.user_id)
          OR
          (cr.requester_id = auth.uid() AND cr.recipient_id = friendships.friend_id)
          OR
          (cr.recipient_id = auth.uid() AND cr.requester_id = friendships.friend_id)
        )
      )
  )
);

-- ============================================
-- 3. VÉRIFIER QUE LA TABLE connection_requests EXISTE
-- ============================================
-- Si la table n'existe pas, cette politique ne fonctionnera pas correctement
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'connection_requests'
  ) THEN
    RAISE WARNING 'La table connection_requests n''existe pas. Exécutez d''abord SCRIPT_FIX_CONNECTION_REQUESTS.sql';
  END IF;
END $$;

-- ============================================
-- 4. VÉRIFICATION
-- ============================================
SELECT 
  'friendships RLS policies' AS check_item,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'friendships'
  AND policyname = 'Users can create friendships';

-- Afficher la politique créée
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'friendships'
  AND policyname = 'Users can create friendships';

