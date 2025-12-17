-- Problème 3: Ajouter les politiques UPDATE et DELETE pour friendships
-- Permettre aux utilisateurs de modifier/supprimer leurs propres amitiés

CREATE POLICY "Users can update their friendships"
ON public.friendships
FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() = friend_id)
WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships"
ON public.friendships
FOR DELETE
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Problème 4: Rendre le bucket personal-content privé
UPDATE storage.buckets 
SET public = false 
WHERE id = 'personal-content';