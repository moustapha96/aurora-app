-- Create polo_profiles table for main practice info
CREATE TABLE public.polo_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level TEXT CHECK (level IN ('debutant', 'intermediaire', 'avance', 'professionnel')),
  handicap TEXT,
  preferred_position TEXT CHECK (preferred_position IN ('attaquant', 'milieu_offensif', 'milieu_capitaine', 'defenseur')),
  frequency TEXT CHECK (frequency IN ('occasionnelle', 'reguliere', 'intensive', 'competition')),
  years_experience INTEGER,
  club_name TEXT,
  club_city TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create polo_horses table for equine partners
CREATE TABLE public.polo_horses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  breed TEXT,
  together_since TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_own_horse BOOLEAN DEFAULT false,
  exclusive_rider BOOLEAN DEFAULT false,
  tournament_wins BOOLEAN DEFAULT false,
  in_training BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create polo_achievements table for tournaments and rewards
CREATE TABLE public.polo_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT CHECK (achievement_type IN ('tournament', 'pride')),
  year TEXT,
  tournament_name TEXT,
  result TEXT,
  role_performance TEXT,
  description TEXT,
  has_trophies BOOLEAN DEFAULT false,
  has_medals BOOLEAN DEFAULT false,
  has_qualifications BOOLEAN DEFAULT false,
  has_special_recognition BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create polo_objectives table for goals
CREATE TABLE public.polo_objectives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  objective_type TEXT CHECK (objective_type IN ('season', 'long_term')),
  description TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create polo_gallery table for photos
CREATE TABLE public.polo_gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_type TEXT CHECK (slot_type IN ('action', 'horse_portrait', 'complicity', 'team', 'trophy', 'ambiance', 'additional')),
  image_url TEXT,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.polo_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polo_horses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polo_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polo_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polo_gallery ENABLE ROW LEVEL SECURITY;

-- RLS policies for polo_profiles
CREATE POLICY "Users can view their own polo profile" ON public.polo_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own polo profile" ON public.polo_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own polo profile" ON public.polo_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own polo profile" ON public.polo_profiles FOR DELETE USING (auth.uid() = user_id);

-- Friends can view polo profiles
CREATE POLICY "Friends can view polo profiles" ON public.polo_profiles FOR SELECT
USING (EXISTS (
  SELECT 1 FROM friendships 
  WHERE friendships.user_id = polo_profiles.user_id 
  AND friendships.friend_id = auth.uid() 
  AND friendships.personal_access = true
));

-- RLS policies for polo_horses
CREATE POLICY "Users can view their own horses" ON public.polo_horses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own horses" ON public.polo_horses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own horses" ON public.polo_horses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own horses" ON public.polo_horses FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Friends can view polo horses" ON public.polo_horses FOR SELECT
USING (EXISTS (SELECT 1 FROM friendships WHERE friendships.user_id = polo_horses.user_id AND friendships.friend_id = auth.uid() AND friendships.personal_access = true));

-- RLS policies for polo_achievements
CREATE POLICY "Users can view their own achievements" ON public.polo_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own achievements" ON public.polo_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own achievements" ON public.polo_achievements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own achievements" ON public.polo_achievements FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Friends can view polo achievements" ON public.polo_achievements FOR SELECT
USING (EXISTS (SELECT 1 FROM friendships WHERE friendships.user_id = polo_achievements.user_id AND friendships.friend_id = auth.uid() AND friendships.personal_access = true));

-- RLS policies for polo_objectives
CREATE POLICY "Users can view their own objectives" ON public.polo_objectives FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own objectives" ON public.polo_objectives FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own objectives" ON public.polo_objectives FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own objectives" ON public.polo_objectives FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Friends can view polo objectives" ON public.polo_objectives FOR SELECT
USING (EXISTS (SELECT 1 FROM friendships WHERE friendships.user_id = polo_objectives.user_id AND friendships.friend_id = auth.uid() AND friendships.personal_access = true));

-- RLS policies for polo_gallery
CREATE POLICY "Users can view their own gallery" ON public.polo_gallery FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own gallery" ON public.polo_gallery FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own gallery" ON public.polo_gallery FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own gallery" ON public.polo_gallery FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Friends can view polo gallery" ON public.polo_gallery FOR SELECT
USING (EXISTS (SELECT 1 FROM friendships WHERE friendships.user_id = polo_gallery.user_id AND friendships.friend_id = auth.uid() AND friendships.personal_access = true));

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_polo_profiles_updated_at BEFORE UPDATE ON public.polo_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_polo_horses_updated_at BEFORE UPDATE ON public.polo_horses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_polo_achievements_updated_at BEFORE UPDATE ON public.polo_achievements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_polo_objectives_updated_at BEFORE UPDATE ON public.polo_objectives FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_polo_gallery_updated_at BEFORE UPDATE ON public.polo_gallery FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();