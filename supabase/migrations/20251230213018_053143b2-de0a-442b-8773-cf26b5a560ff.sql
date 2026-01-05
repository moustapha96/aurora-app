-- Add account_active column to profiles table
-- This allows admins to enable login independently of Veriff identity verification
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_active boolean DEFAULT false;

-- Set account_active to true for already verified accounts
UPDATE public.profiles 
SET account_active = true 
WHERE identity_verified = true;