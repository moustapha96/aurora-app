-- Force fix for user_activities foreign key
-- This migration ensures foreign key is created with the correct name
-- and forces PostgREST to refresh its schema cache

-- ============================================
-- 1. FIX user_activities FOREIGN KEY
-- ============================================

-- Drop ALL existing foreign key constraints on user_id
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.user_activities'::regclass
      AND contype = 'f'
      AND conkey::text LIKE '%user_id%'
  ) LOOP
    EXECUTE 'ALTER TABLE public.user_activities DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- Clean up orphaned data
DELETE FROM public.user_activities
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Drop and recreate with correct name
ALTER TABLE public.user_activities
DROP CONSTRAINT IF EXISTS user_activities_user_id_fkey;

ALTER TABLE public.user_activities
ADD CONSTRAINT user_activities_user_id_fkey
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
    WHERE conname = 'user_activities_user_id_fkey'
  ) THEN
    RAISE EXCEPTION 'Failed to create user_activities_user_id_fkey';
  END IF;
  
  RAISE NOTICE 'Foreign key created successfully for user_activities';
END $$;

-- ============================================
-- 3. ADD ADMIN POLICIES (if not already added)
-- ============================================

-- Allow admins to view all user_activities
DROP POLICY IF EXISTS "Admins can view all user activities" ON public.user_activities;
CREATE POLICY "Admins can view all user activities"
ON public.user_activities
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete any user_activities
DROP POLICY IF EXISTS "Admins can delete any user activities" ON public.user_activities;
CREATE POLICY "Admins can delete any user activities"
ON public.user_activities
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
  PERFORM 1 FROM public.user_activities LIMIT 1;
END $$;

