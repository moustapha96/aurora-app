-- Create business_content table
CREATE TABLE IF NOT EXISTS public.business_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  company_description TEXT,
  position_title TEXT,
  achievements_text TEXT,
  portfolio_text TEXT,
  vision_text TEXT,
  company_logo_url TEXT,
  company_photos TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own business content"
ON public.business_content
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own business content"
ON public.business_content
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business content"
ON public.business_content
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business content"
ON public.business_content
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_business_content_updated_at
BEFORE UPDATE ON public.business_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();