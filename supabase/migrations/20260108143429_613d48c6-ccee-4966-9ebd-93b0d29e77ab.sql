-- Create table for 2FA email codes
CREATE TABLE public.two_factor_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.two_factor_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own codes
CREATE POLICY "Users can view their own 2FA codes" 
ON public.two_factor_codes 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: System can insert codes (via edge function with service role)
CREATE POLICY "Service can insert 2FA codes" 
ON public.two_factor_codes 
FOR INSERT 
WITH CHECK (true);

-- Add 2FA enabled column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX idx_two_factor_codes_user_id ON public.two_factor_codes(user_id);
CREATE INDEX idx_two_factor_codes_expires_at ON public.two_factor_codes(expires_at);

-- Function to clean up expired codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_2fa_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM public.two_factor_codes 
  WHERE expires_at < now() OR used = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;