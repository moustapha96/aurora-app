-- Add foreign key constraints to connection_requests table
-- This fixes the error "Could not find a relationship between 'connection_requests' and 'profiles'"
-- The AdminConnections page tries to use foreign key relationships that don't exist

-- ============================================
-- 1. CLEAN UP ORPHANED DATA (if any)
-- ============================================
-- Remove any connection_requests that reference non-existent profiles
DELETE FROM public.connection_requests
WHERE requester_id NOT IN (SELECT id FROM public.profiles)
   OR recipient_id NOT IN (SELECT id FROM public.profiles);

-- ============================================
-- 2. ADD FOREIGN KEY CONSTRAINTS
-- ============================================

-- Add foreign key from requester_id to profiles.id
-- First check if the constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'connection_requests_requester_id_fkey'
  ) THEN
    ALTER TABLE public.connection_requests
    ADD CONSTRAINT connection_requests_requester_id_fkey
    FOREIGN KEY (requester_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key from recipient_id to profiles.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'connection_requests_recipient_id_fkey'
  ) THEN
    ALTER TABLE public.connection_requests
    ADD CONSTRAINT connection_requests_recipient_id_fkey
    FOREIGN KEY (recipient_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- 2. ADD ADMIN POLICIES FOR CONNECTION_REQUESTS
-- ============================================
-- Allow admins to view all connection requests for moderation
DROP POLICY IF EXISTS "Admins can view all connection requests" ON public.connection_requests;
CREATE POLICY "Admins can view all connection requests"
ON public.connection_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete any connection requests
DROP POLICY IF EXISTS "Admins can delete any connection requests" ON public.connection_requests;
CREATE POLICY "Admins can delete any connection requests"
ON public.connection_requests
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

