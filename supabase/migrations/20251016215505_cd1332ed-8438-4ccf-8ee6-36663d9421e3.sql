-- Create connection_requests table to track pending friend requests
CREATE TABLE IF NOT EXISTS public.connection_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(requester_id, recipient_id)
);

-- Enable RLS
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

-- Users can view requests they sent or received
CREATE POLICY "Users can view their connection requests"
ON public.connection_requests
FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Users can create connection requests
CREATE POLICY "Users can send connection requests"
ON public.connection_requests
FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Users can update requests they received (accept/reject)
CREATE POLICY "Recipients can update connection requests"
ON public.connection_requests
FOR UPDATE
USING (auth.uid() = recipient_id);

-- Users can delete their own sent requests
CREATE POLICY "Users can delete their sent requests"
ON public.connection_requests
FOR DELETE
USING (auth.uid() = requester_id);

-- Add trigger for updated_at
CREATE TRIGGER update_connection_requests_updated_at
BEFORE UPDATE ON public.connection_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for connection requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.connection_requests;