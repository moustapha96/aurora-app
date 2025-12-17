-- Fix landing_preferences RLS policy to remove anonymous access
-- Only authenticated users should view landing preferences

DROP POLICY IF EXISTS "Landing preferences viewable for public landing pages" ON public.landing_preferences;

-- Keep only authenticated user access for their own preferences
-- The public landing page will work without accessing this table directly