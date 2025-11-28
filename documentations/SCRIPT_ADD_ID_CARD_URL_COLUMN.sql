-- Script to add id_card_url column to profiles table
-- Execute this in Supabase SQL Editor

-- Add id_card_url column to profiles table if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS id_card_url TEXT;

COMMENT ON COLUMN public.profiles.id_card_url IS 'URL of the user ID card image stored in storage';

