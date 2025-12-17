-- Extend business_content with new modules
ALTER TABLE public.business_content
ADD COLUMN IF NOT EXISTS bio_executive TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_mode TEXT;

-- Create business_timeline table
CREATE TABLE IF NOT EXISTS public.business_timeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  display_order INTEGER DEFAULT 0,
  year TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business_press table  
CREATE TABLE IF NOT EXISTS public.business_press (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  display_order INTEGER DEFAULT 0,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  year TEXT,
  url TEXT,
  distinction_type TEXT, -- 'press' or 'distinction'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business_projects table
CREATE TABLE IF NOT EXISTS public.business_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  display_order INTEGER DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'ongoing', -- 'ongoing', 'completed', 'planned'
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.business_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_press ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_projects ENABLE ROW LEVEL SECURITY;

-- RLS policies for business_timeline
CREATE POLICY "Users can view their own timeline" ON public.business_timeline FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own timeline" ON public.business_timeline FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own timeline" ON public.business_timeline FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own timeline" ON public.business_timeline FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for business_press
CREATE POLICY "Users can view their own press" ON public.business_press FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own press" ON public.business_press FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own press" ON public.business_press FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own press" ON public.business_press FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for business_projects
CREATE POLICY "Users can view their own projects" ON public.business_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own projects" ON public.business_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.business_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.business_projects FOR DELETE USING (auth.uid() = user_id);