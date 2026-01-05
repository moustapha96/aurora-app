-- Add linked_accounts table for family associated accounts
CREATE TABLE public.linked_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sponsor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  linked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL DEFAULT 'family',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sponsor_id, linked_user_id)
);

-- Add is_linked_account to profiles to mark restricted accounts
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_linked_account BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS linked_by_user_id UUID REFERENCES auth.users(id);

-- Enable RLS
ALTER TABLE public.linked_accounts ENABLE ROW LEVEL SECURITY;

-- RLS policies for linked_accounts
CREATE POLICY "Users can view their linked accounts" 
ON public.linked_accounts 
FOR SELECT 
USING (auth.uid() = sponsor_id OR auth.uid() = linked_user_id);

CREATE POLICY "Users can create linked accounts as sponsor" 
ON public.linked_accounts 
FOR INSERT 
WITH CHECK (auth.uid() = sponsor_id);

CREATE POLICY "Users can delete their linked accounts" 
ON public.linked_accounts 
FOR DELETE 
USING (auth.uid() = sponsor_id);

CREATE POLICY "Admins can manage all linked accounts" 
ON public.linked_accounts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update trigger for updated_at
CREATE TRIGGER update_linked_accounts_updated_at
BEFORE UPDATE ON public.linked_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add is_family_link column to referral_links to distinguish family links
ALTER TABLE public.referral_links 
ADD COLUMN IF NOT EXISTS is_family_link BOOLEAN DEFAULT false;

-- Update referral_links policy to allow viewing family links
CREATE POLICY "Anyone can view family referral links for registration"
ON public.referral_links
FOR SELECT
USING (is_family_link = true AND is_active = true);