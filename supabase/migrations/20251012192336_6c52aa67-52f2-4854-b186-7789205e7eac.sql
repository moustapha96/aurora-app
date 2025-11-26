-- Create social_influence table
CREATE TABLE public.social_influence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  metric TEXT NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.social_influence ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own social influence" 
ON public.social_influence 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own social influence" 
ON public.social_influence 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social influence" 
ON public.social_influence 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social influence" 
ON public.social_influence 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_social_influence_updated_at
BEFORE UPDATE ON public.social_influence
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();