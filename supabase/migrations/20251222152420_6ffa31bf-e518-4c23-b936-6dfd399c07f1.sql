-- Allow authenticated users to insert message notifications for themselves
CREATE POLICY "Users can insert message notifications for themselves"
ON public.user_notifications
FOR INSERT
TO authenticated
WITH CHECK (
  type = 'message'
  AND user_id = auth.uid()
);