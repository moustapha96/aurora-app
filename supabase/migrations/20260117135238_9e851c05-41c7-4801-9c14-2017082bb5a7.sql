-- Add sponsor approval status column to referrals table
ALTER TABLE public.referrals 
ADD COLUMN IF NOT EXISTS sponsor_approved BOOLEAN DEFAULT false;

-- Add sponsor approval timestamp
ALTER TABLE public.referrals 
ADD COLUMN IF NOT EXISTS sponsor_approved_at TIMESTAMPTZ;

-- Add rejection reason column
ALTER TABLE public.referrals 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update status enum comment for clarity
COMMENT ON COLUMN public.referrals.status IS 'Status values: pending_sponsor_approval (waiting for sponsor), pending (waiting for Veriff), confirmed (fully verified), rejected (rejected by sponsor or Veriff)';

-- Create index for faster sponsor queries
CREATE INDEX IF NOT EXISTS idx_referrals_sponsor_approved ON public.referrals(sponsor_id, sponsor_approved);

-- Create a function to check if a user needs sponsor approval
CREATE OR REPLACE FUNCTION public.check_sponsor_approval(user_id_param uuid)
RETURNS TABLE(
  needs_approval boolean,
  sponsor_approved boolean,
  sponsor_id uuid,
  referral_id uuid,
  rejection_reason text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    true as needs_approval,
    COALESCE(sponsor_approved, false) as sponsor_approved,
    sponsor_id,
    id as referral_id,
    rejection_reason
  FROM public.referrals
  WHERE referred_id = user_id_param
  LIMIT 1;
$$;