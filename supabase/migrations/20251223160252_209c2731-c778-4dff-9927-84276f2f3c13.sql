-- Create golf_profiles table for main golf practice info
CREATE TABLE public.golf_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  level TEXT,
  handicap TEXT,
  years_experience INTEGER,
  frequency TEXT,
  club_name TEXT,
  club_city TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create golf_courses table for favorite courses
CREATE TABLE public.golf_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_name TEXT NOT NULL,
  location TEXT,
  country TEXT,
  par INTEGER,
  best_score INTEGER,
  times_played INTEGER,
  rating TEXT,
  description TEXT,
  is_favorite BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create golf_achievements table for tournaments and accomplishments
CREATE TABLE public.golf_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_type TEXT,
  year TEXT,
  tournament_name TEXT,
  result TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.golf_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golf_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golf_achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies for golf_profiles
CREATE POLICY "Users can view their own golf profile"
ON public.golf_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own golf profile"
ON public.golf_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own golf profile"
ON public.golf_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own golf profile"
ON public.golf_profiles FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for golf_courses
CREATE POLICY "Users can view their own golf courses"
ON public.golf_courses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own golf courses"
ON public.golf_courses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own golf courses"
ON public.golf_courses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own golf courses"
ON public.golf_courses FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for golf_achievements
CREATE POLICY "Users can view their own golf achievements"
ON public.golf_achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own golf achievements"
ON public.golf_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own golf achievements"
ON public.golf_achievements FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own golf achievements"
ON public.golf_achievements FOR DELETE
USING (auth.uid() = user_id);

-- Friends access policies for golf data
CREATE POLICY "Friends can view golf profiles"
ON public.golf_profiles FOR SELECT
USING (EXISTS (
  SELECT 1 FROM friendships
  WHERE friendships.user_id = golf_profiles.user_id
  AND friendships.friend_id = auth.uid()
  AND friendships.personal_access = true
));

CREATE POLICY "Friends can view golf courses"
ON public.golf_courses FOR SELECT
USING (EXISTS (
  SELECT 1 FROM friendships
  WHERE friendships.user_id = golf_courses.user_id
  AND friendships.friend_id = auth.uid()
  AND friendships.personal_access = true
));

CREATE POLICY "Friends can view golf achievements"
ON public.golf_achievements FOR SELECT
USING (EXISTS (
  SELECT 1 FROM friendships
  WHERE friendships.user_id = golf_achievements.user_id
  AND friendships.friend_id = auth.uid()
  AND friendships.personal_access = true
));