-- Force fix for connection_requests foreign keys
-- This migration ensures foreign keys are created with the correct names
-- and forces PostgREST to refresh its schema cache

-- ============================================
-- 1. DROP EXISTING CONSTRAINTS (if any with different names)
-- ============================================
-- Drop any existing foreign key constraints on requester_id
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.connection_requests'::regclass
      AND contype = 'f'
      AND conkey::text LIKE '%requester_id%'
  ) LOOP
    EXECUTE 'ALTER TABLE public.connection_requests DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- Drop any existing foreign key constraints on recipient_id
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.connection_requests'::regclass
      AND contype = 'f'
      AND conkey::text LIKE '%recipient_id%'
  ) LOOP
    EXECUTE 'ALTER TABLE public.connection_requests DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- ============================================
-- 2. CLEAN UP ORPHANED DATA
-- ============================================
DELETE FROM public.connection_requests
WHERE requester_id NOT IN (SELECT id FROM public.profiles)
   OR recipient_id NOT IN (SELECT id FROM public.profiles);

-- ============================================
-- 3. CREATE FOREIGN KEY CONSTRAINTS WITH CORRECT NAMES
-- ============================================

-- Drop and recreate requester_id foreign key
ALTER TABLE public.connection_requests
DROP CONSTRAINT IF EXISTS connection_requests_requester_id_fkey;

ALTER TABLE public.connection_requests
ADD CONSTRAINT connection_requests_requester_id_fkey
FOREIGN KEY (requester_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Drop and recreate recipient_id foreign key
ALTER TABLE public.connection_requests
DROP CONSTRAINT IF EXISTS connection_requests_recipient_id_fkey;

ALTER TABLE public.connection_requests
ADD CONSTRAINT connection_requests_recipient_id_fkey
FOREIGN KEY (recipient_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- ============================================
-- 4. VERIFY CONSTRAINTS WERE CREATED
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'connection_requests_requester_id_fkey'
  ) THEN
    RAISE EXCEPTION 'Failed to create connection_requests_requester_id_fkey';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'connection_requests_recipient_id_fkey'
  ) THEN
    RAISE EXCEPTION 'Failed to create connection_requests_recipient_id_fkey';
  END IF;
END $$;

-- ============================================
-- 5. NOTIFY POSTGREST TO REFRESH SCHEMA CACHE
-- ============================================
-- PostgREST automatically refreshes its cache, but we can force it
-- by touching the schema (this is a workaround)
NOTIFY pgrst, 'reload schema';

