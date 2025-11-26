-- Add permission columns to friendships table
ALTER TABLE public.friendships 
ADD COLUMN business_access boolean DEFAULT true,
ADD COLUMN family_access boolean DEFAULT true,
ADD COLUMN personal_access boolean DEFAULT true,
ADD COLUMN influence_access boolean DEFAULT true;

-- Add comment to explain the columns
COMMENT ON COLUMN public.friendships.business_access IS 'Permission to view business section';
COMMENT ON COLUMN public.friendships.family_access IS 'Permission to view family section';
COMMENT ON COLUMN public.friendships.personal_access IS 'Permission to view personal section';
COMMENT ON COLUMN public.friendships.influence_access IS 'Permission to view influence section';