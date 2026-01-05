-- Create golf gallery table for memorable moments
CREATE TABLE public.golf_gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT,
  caption TEXT,
  location TEXT,
  date TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.golf_gallery ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own golf gallery"
  ON public.golf_gallery FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own golf gallery"
  ON public.golf_gallery FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own golf gallery"
  ON public.golf_gallery FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own golf gallery"
  ON public.golf_gallery FOR DELETE
  USING (auth.uid() = user_id);

-- Friends can view golf gallery
CREATE POLICY "Friends can view golf gallery"
  ON public.golf_gallery FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE friendships.user_id = golf_gallery.user_id
      AND friendships.friend_id = auth.uid()
      AND friendships.personal_access = true
    )
  );