-- Add foreign key constraints to family_content and business_content tables
-- This fixes the error "Could not find a relationship between 'family_content'/'business_content' and 'profiles'"
-- The AdminContent page tries to use foreign key relationships that don't exist

-- ============================================
-- 1. FIX family_content FOREIGN KEY
-- ============================================

-- Drop ALL existing foreign key constraints on user_id
-- PostgreSQL doesn't allow multiple foreign keys on the same column to different tables
-- We'll use profiles.id instead of auth.users.id since profiles.id references auth.users.id
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

-- Add foreign key to profiles (this is what PostgREST needs for joins)
-- Since profiles.id references auth.users.id, this maintains referential integrity
ALTER TABLE public.family_content
ADD CONSTRAINT family_content_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- ============================================
-- 2. FIX business_content FOREIGN KEY
-- ============================================

-- Drop ALL existing foreign key constraints on user_id
-- PostgreSQL doesn't allow multiple foreign keys on the same column to different tables
-- We'll use profiles.id instead of auth.users.id since profiles.id references auth.users.id
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

-- Add foreign key to profiles (this is what PostgREST needs for joins)
-- Since profiles.id references auth.users.id, this maintains referential integrity
ALTER TABLE public.business_content
ADD CONSTRAINT business_content_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- ============================================
-- 3. ADD ADMIN POLICIES FOR CONTENT TABLES
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
-- 4. VERIFY CONSTRAINTS WERE CREATED
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
END $$;

-- Notify PostgREST to refresh schema cache
NOTIFY pgrst, 'reload schema';

