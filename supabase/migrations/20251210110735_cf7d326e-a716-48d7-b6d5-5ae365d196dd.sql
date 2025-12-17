-- Create activity_logs table to store all database operations
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Only admins can view activity logs"
ON public.activity_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role to insert (for triggers)
CREATE POLICY "Service role can insert logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (true);

-- Create a function to log changes
CREATE OR REPLACE FUNCTION public.log_table_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  record_id_value TEXT;
BEGIN
  -- Try to get current user
  BEGIN
    current_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    current_user_id := NULL;
  END;

  -- Get the record ID
  IF TG_OP = 'DELETE' THEN
    record_id_value := OLD.id::TEXT;
  ELSE
    record_id_value := NEW.id::TEXT;
  END IF;

  -- Insert log entry
  INSERT INTO public.activity_logs (user_id, table_name, operation, record_id, old_data, new_data)
  VALUES (
    current_user_id,
    TG_TABLE_NAME,
    TG_OP,
    record_id_value,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers for main tables
CREATE TRIGGER log_profiles_changes
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER log_connection_requests_changes
AFTER INSERT OR UPDATE OR DELETE ON public.connection_requests
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER log_friendships_changes
AFTER INSERT OR UPDATE OR DELETE ON public.friendships
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER log_messages_changes
AFTER INSERT OR UPDATE OR DELETE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER log_business_content_changes
AFTER INSERT OR UPDATE OR DELETE ON public.business_content
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER log_family_content_changes
AFTER INSERT OR UPDATE OR DELETE ON public.family_content
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER log_personal_content_changes
AFTER INSERT OR UPDATE OR DELETE ON public.personal_content
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER log_artwork_collection_changes
AFTER INSERT OR UPDATE OR DELETE ON public.artwork_collection
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER log_identity_verifications_changes
AFTER INSERT OR UPDATE OR DELETE ON public.identity_verifications
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

-- Create index for faster queries
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_table_name ON public.activity_logs(table_name);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);