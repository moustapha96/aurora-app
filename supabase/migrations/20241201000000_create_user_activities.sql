-- Create user_activities table for tracking user activities and login history
CREATE TABLE IF NOT EXISTS public.user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'login',
    'logout',
    'profile_update',
    'password_change',
    'email_verification',
    'connection_request',
    'message_sent',
    'content_created',
    'content_updated',
    'content_deleted',
    'settings_updated',
    'other'
  )),
  activity_description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON public.user_activities(activity_type);

-- Enable Row Level Security
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own activities"
  ON public.user_activities
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities"
  ON public.user_activities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to log user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_activity_type TEXT,
  p_activity_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)

RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_activity_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Insert activity
  INSERT INTO public.user_activities (
    user_id,
    activity_type,
    activity_description,
    ip_address,
    user_agent,
    metadata
  )
  VALUES (
    v_user_id,
    p_activity_type,
    p_activity_description,
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent',
    p_metadata
  )
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$;

-- Function to log login activity (called after successful login)
CREATE OR REPLACE FUNCTION public.log_login_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log login activity
  INSERT INTO public.user_activities (
    user_id,
    activity_type,
    activity_description,
    metadata
  )
  VALUES (
    NEW.id,
    'login',
    'User logged in',
    jsonb_build_object(
      'email', NEW.email,
      'last_sign_in_at', NEW.last_sign_in_at
    )
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Note: We can't create a trigger on auth.users directly in Supabase
-- Login activities should be logged from the application code

COMMENT ON TABLE public.user_activities IS 'Stores user activity history including logins, profile updates, and other actions';
COMMENT ON COLUMN public.user_activities.activity_type IS 'Type of activity: login, logout, profile_update, etc.';
COMMENT ON COLUMN public.user_activities.metadata IS 'Additional JSON data about the activity';

