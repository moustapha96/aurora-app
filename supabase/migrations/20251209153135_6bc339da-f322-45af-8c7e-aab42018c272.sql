-- Create landing_preferences table to store user's landing page settings
CREATE TABLE public.landing_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  template TEXT NOT NULL DEFAULT 'classic',
  show_contact_button BOOLEAN DEFAULT true,
  show_wealth_badge BOOLEAN DEFAULT true,
  show_location BOOLEAN DEFAULT true,
  show_quote BOOLEAN DEFAULT true,
  custom_headline TEXT,
  custom_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.landing_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own landing preferences
CREATE POLICY "Users can view their own landing preferences"
ON public.landing_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own landing preferences
CREATE POLICY "Users can insert their own landing preferences"
ON public.landing_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own landing preferences
CREATE POLICY "Users can update their own landing preferences"
ON public.landing_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Anyone can view public landing pages (for public access)
CREATE POLICY "Anyone can view landing preferences for public pages"
ON public.landing_preferences
FOR SELECT
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_landing_preferences_updated_at
BEFORE UPDATE ON public.landing_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();