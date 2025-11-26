-- Force fix for family_content and business_content foreign keys
-- This migration ensures foreign keys are created with the correct names
-- and forces PostgREST to refresh its schema cache

-- ============================================
-- 1. FIX family_content FOREIGN KEY
-- ============================================

-- Drop ALL existing foreign key constraints on user_id
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.family_content'::regclass
      AND contype = 'f'
      AND conkey::text LIKE '%user_id%'
  ) LOOP
    EXECUTE 'ALTER TABLE public.family_content DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- Clean up orphaned data
DELETE FROM public.family_content
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Drop and recreate with correct name
ALTER TABLE public.family_content
DROP CONSTRAINT IF EXISTS family_content_user_id_fkey;

ALTER TABLE public.family_content
ADD CONSTRAINT family_content_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- ============================================
-- 2. FIX business_content FOREIGN KEY
-- ============================================

-- Drop ALL existing foreign key constraints on user_id
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.business_content'::regclass
      AND contype = 'f'
      AND conkey::text LIKE '%user_id%'
  ) LOOP
    EXECUTE 'ALTER TABLE public.business_content DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- Clean up orphaned data
DELETE FROM public.business_content
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Drop and recreate with correct name
ALTER TABLE public.business_content
DROP CONSTRAINT IF EXISTS business_content_user_id_fkey;

ALTER TABLE public.business_content
ADD CONSTRAINT business_content_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- ============================================
-- 3. VERIFY CONSTRAINTS WERE CREATED
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'family_content_user_id_fkey'
  ) THEN
    RAISE EXCEPTION 'Failed to create family_content_user_id_fkey';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'business_content_user_id_fkey'
  ) THEN
    RAISE EXCEPTION 'Failed to create business_content_user_id_fkey';
  END IF;
  
  RAISE NOTICE 'Foreign keys created successfully';
END $$;

-- ============================================
-- 4. ADD ADMIN POLICIES (if not already added)
-- ============================================

-- Allow admins to view all family_content
DROP POLICY IF EXISTS "Admins can view all family content" ON public.family_content;
CREATE POLICY "Admins can view all family content"
ON public.family_content
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete any family_content
DROP POLICY IF EXISTS "Admins can delete any family content" ON public.family_content;
CREATE POLICY "Admins can delete any family content"
ON public.family_content
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all business_content
DROP POLICY IF EXISTS "Admins can view all business content" ON public.business_content;
CREATE POLICY "Admins can view all business content"
ON public.business_content
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete any business_content
DROP POLICY IF EXISTS "Admins can delete any business content" ON public.business_content;
CREATE POLICY "Admins can delete any business content"
ON public.business_content
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 5. FORCE POSTGREST SCHEMA REFRESH
-- ============================================
-- PostgREST automatically refreshes its cache, but we can try to force it
NOTIFY pgrst, 'reload schema';

-- Also try to invalidate the schema cache by touching the tables
-- This is a workaround to force PostgREST to reload
DO $$
BEGIN
  -- Touch the tables to force schema reload
  PERFORM 1 FROM public.family_content LIMIT 1;
  PERFORM 1 FROM public.business_content LIMIT 1;
END $$;

