-- Allow authenticated users to insert connection request notifications for other users
CREATE POLICY "Users can insert connection request notifications"
ON public.user_notifications
FOR INSERT
TO authenticated
WITH CHECK (
  type = 'connection_request'
  AND user_id != auth.uid()
);