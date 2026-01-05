-- Add policy for users to update their own verification document_url
CREATE POLICY "Users can update their own verification document"
ON public.identity_verifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);