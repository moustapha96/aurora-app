-- Create network_content table for onboarding tracking
CREATE TABLE public.network_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_mode TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.network_content ENABLE ROW LEVEL SECURITY;

-- RLS policies for network_content
CREATE POLICY "Users can view their own network content"
ON public.network_content FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own network content"
ON public.network_content FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own network content"
ON public.network_content FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own network content"
ON public.network_content FOR DELETE USING (auth.uid() = user_id);

-- Create network_media table (Media Presence)
CREATE TABLE public.network_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  platform TEXT,
  description TEXT,
  url TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.network_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own network media"
ON public.network_media FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own network media"
ON public.network_media FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own network media"
ON public.network_media FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own network media"
ON public.network_media FOR DELETE USING (auth.uid() = user_id);

-- Create network_events table (Events)
CREATE TABLE public.network_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  event_type TEXT,
  location TEXT,
  date TEXT,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.network_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own network events"
ON public.network_events FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own network events"
ON public.network_events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own network events"
ON public.network_events FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own network events"
ON public.network_events FOR DELETE USING (auth.uid() = user_id);

-- Create network_influence table (Influence & Reach)
CREATE TABLE public.network_influence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  metric TEXT,
  value TEXT,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.network_influence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own network influence"
ON public.network_influence FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own network influence"
ON public.network_influence FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own network influence"
ON public.network_influence FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own network influence"
ON public.network_influence FOR DELETE USING (auth.uid() = user_id);

-- Create network_philanthropy table (Philanthropy)
CREATE TABLE public.network_philanthropy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  organization TEXT,
  role TEXT,
  cause TEXT,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.network_philanthropy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own network philanthropy"
ON public.network_philanthropy FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own network philanthropy"
ON public.network_philanthropy FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own network philanthropy"
ON public.network_philanthropy FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own network philanthropy"
ON public.network_philanthropy FOR DELETE USING (auth.uid() = user_id);

-- Create network_clubs table (Clubs & Associations)
CREATE TABLE public.network_clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  club_type TEXT,
  role TEXT,
  since_year TEXT,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.network_clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own network clubs"
ON public.network_clubs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own network clubs"
ON public.network_clubs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own network clubs"
ON public.network_clubs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own network clubs"
ON public.network_clubs FOR DELETE USING (auth.uid() = user_id);

-- Create network_ambitions table (Social Ambitions)
CREATE TABLE public.network_ambitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  timeline TEXT,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.network_ambitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own network ambitions"
ON public.network_ambitions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own network ambitions"
ON public.network_ambitions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own network ambitions"
ON public.network_ambitions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own network ambitions"
ON public.network_ambitions FOR DELETE USING (auth.uid() = user_id);

-- Add logging triggers
CREATE TRIGGER log_network_content_changes
AFTER INSERT OR UPDATE OR DELETE ON public.network_content
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER log_network_media_changes
AFTER INSERT OR UPDATE OR DELETE ON public.network_media
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER log_network_events_changes
AFTER INSERT OR UPDATE OR DELETE ON public.network_events
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER log_network_influence_changes
AFTER INSERT OR UPDATE OR DELETE ON public.network_influence
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER log_network_philanthropy_changes
AFTER INSERT OR UPDATE OR DELETE ON public.network_philanthropy
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER log_network_clubs_changes
AFTER INSERT OR UPDATE OR DELETE ON public.network_clubs
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER log_network_ambitions_changes
AFTER INSERT OR UPDATE OR DELETE ON public.network_ambitions
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();