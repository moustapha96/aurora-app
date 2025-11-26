-- Add foreign key constraints to friendships table
-- This fixes the error "Could not find a relationship between 'friendships' and 'profiles'"
-- The AdminConnections page tries to use foreign key relationships that don't exist

-- ============================================
-- 1. CLEAN UP ORPHANED DATA (if any)
-- ============================================
-- Remove any friendships that reference non-existent profiles
DELETE FROM public.friendships
WHERE user_id NOT IN (SELECT id FROM public.profiles)
   OR friend_id NOT IN (SELECT id FROM public.profiles);

-- ============================================
-- 2. ADD FOREIGN KEY CONSTRAINTS
-- ============================================

-- Add foreign key from user_id to profiles.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'friendships_user_id_fkey'
  ) THEN
    ALTER TABLE public.friendships
    ADD CONSTRAINT friendships_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key from friend_id to profiles.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'friendships_friend_id_fkey'
  ) THEN
    ALTER TABLE public.friendships
    ADD CONSTRAINT friendships_friend_id_fkey
    FOREIGN KEY (friend_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- 3. ADD ADMIN POLICIES FOR FRIENDSHIPS
-- ============================================
-- Allow admins to view all friendships for moderation
DROP POLICY IF EXISTS "Admins can view all friendships" ON public.friendships;
CREATE POLICY "Admins can view all friendships"
ON public.friendships
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete any friendships
DROP POLICY IF EXISTS "Admins can delete any friendships" ON public.friendships;
CREATE POLICY "Admins can delete any friendships"
ON public.friendships
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

