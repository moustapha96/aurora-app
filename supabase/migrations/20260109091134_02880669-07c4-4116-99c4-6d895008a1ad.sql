-- Add allowed_pages column to referral_links for family invitation links
ALTER TABLE public.referral_links 
ADD COLUMN IF NOT EXISTS allowed_pages JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN public.referral_links.allowed_pages IS 'Array of page routes that the invited user will have access to (e.g., ["/profile", "/family", "/business"])';