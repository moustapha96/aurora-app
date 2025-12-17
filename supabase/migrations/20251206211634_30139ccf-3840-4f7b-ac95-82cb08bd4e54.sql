-- Fix the security definer view issue by dropping the view and using RLS properly
DROP VIEW IF EXISTS public.member_discovery;

-- The existing policy already handles access control properly
-- Authenticated users can see profiles, but we need to ensure the application
-- only exposes limited fields in the frontend for non-friends