-- Script pour créer la table connection_requests
-- À exécuter dans le SQL Editor du Supabase Dashboard
-- Ce script corrige l'erreur "Could not find the table 'public.connection_requests'"

-- ============================================
-- 1. CRÉER LA TABLE connection_requests
-- ============================================
CREATE TABLE IF NOT EXISTS public.connection_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(requester_id, recipient_id)
);

-- ============================================
-- 2. ACTIVER RLS
-- ============================================
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CRÉER LES POLITIQUES RLS
-- ============================================

-- Policy 1 : Users can view requests they sent or received
DROP POLICY IF EXISTS "Users can view their connection requests" ON public.connection_requests;
CREATE POLICY "Users can view their connection requests"
ON public.connection_requests
FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Policy 2 : Users can create connection requests
DROP POLICY IF EXISTS "Users can send connection requests" ON public.connection_requests;
CREATE POLICY "Users can send connection requests"
ON public.connection_requests
FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Policy 3 : Users can update requests they received (accept/reject)
DROP POLICY IF EXISTS "Recipients can update connection requests" ON public.connection_requests;
CREATE POLICY "Recipients can update connection requests"
ON public.connection_requests
FOR UPDATE
USING (auth.uid() = recipient_id);

-- Policy 4 : Users can delete their own sent requests
DROP POLICY IF EXISTS "Users can delete their sent requests" ON public.connection_requests;
CREATE POLICY "Users can delete their sent requests"
ON public.connection_requests
FOR DELETE
USING (auth.uid() = requester_id);

-- ============================================
-- 4. CRÉER LE TRIGGER POUR updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_connection_requests_updated_at ON public.connection_requests;
CREATE TRIGGER update_connection_requests_updated_at
BEFORE UPDATE ON public.connection_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. ACTIVER REALTIME (optionnel)
-- ============================================
-- Note: Cette commande peut échouer si la publication n'existe pas encore
-- Ce n'est pas critique pour le fonctionnement de base
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.connection_requests;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if realtime is not configured
    RAISE NOTICE 'Realtime publication not available, skipping';
END $$;

-- ============================================
-- 6. CRÉER LES INDEX POUR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_connection_requests_requester ON public.connection_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_recipient ON public.connection_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON public.connection_requests(status);
CREATE INDEX IF NOT EXISTS idx_connection_requests_recipient_status ON public.connection_requests(recipient_id, status);

-- ============================================
-- 7. VÉRIFICATION
-- ============================================
SELECT 
  'connection_requests table' AS check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'connection_requests')
    THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS status
UNION ALL
SELECT 
  'connection_requests RLS enabled' AS check_item,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename = 'connection_requests'
        AND rowsecurity = true
    )
    THEN '✓ ENABLED'
    ELSE '✗ DISABLED'
  END AS status
UNION ALL
SELECT 
  'connection_requests RLS policies' AS check_item,
  COUNT(*)::text AS status
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'connection_requests'
UNION ALL
SELECT 
  'connection_requests indexes' AS check_item,
  COUNT(*)::text AS status
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'connection_requests';

