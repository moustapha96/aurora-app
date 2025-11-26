-- Force fix for network_content foreign key
-- This migration ensures foreign key is created with the correct name
-- and forces PostgREST to refresh its schema cache

-- ============================================
-- 1. FIX network_content FOREIGN KEY
-- ============================================

-- Drop ALL existing foreign key constraints on user_id
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.network_content'::regclass
      AND contype = 'f'
      AND conkey::text LIKE '%user_id%'
  ) LOOP
    EXECUTE 'ALTER TABLE public.network_content DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- Clean up orphaned data
DELETE FROM public.network_content
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Drop and recreate with correct name
ALTER TABLE public.network_content
DROP CONSTRAINT IF EXISTS network_content_user_id_fkey;

ALTER TABLE public.network_content
ADD CONSTRAINT network_content_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- ============================================
-- 2. VERIFY CONSTRAINT WAS CREATED
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'network_content_user_id_fkey'
  ) THEN
    RAISE EXCEPTION 'Failed to create network_content_user_id_fkey';
  END IF;
  
  RAISE NOTICE 'Foreign key created successfully for network_content';
END $$;

-- ============================================
-- 3. ADD ADMIN POLICIES (if not already added)
-- ============================================

-- Allow admins to view all network_content
DROP POLICY IF EXISTS "Admins can view all network content" ON public.network_content;
CREATE POLICY "Admins can view all network content"
ON public.network_content
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete any network_content
DROP POLICY IF EXISTS "Admins can delete any network content" ON public.network_content;
CREATE POLICY "Admins can delete any network content"
ON public.network_content
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 4. FORCE POSTGREST SCHEMA REFRESH
-- ============================================
-- PostgREST automatically refreshes its cache, but we can try to force it
NOTIFY pgrst, 'reload schema';

-- Also try to invalidate the schema cache by touching the table
DO $$
BEGIN
  -- Touch the table to force schema reload
  PERFORM 1 FROM public.network_content LIMIT 1;
END $$;

