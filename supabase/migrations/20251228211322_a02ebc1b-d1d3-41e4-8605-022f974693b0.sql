-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Users can insert referrals as referred" ON public.referrals;

-- Créer une politique qui permet l'insertion si l'utilisateur est soit le sponsor soit le referred
-- Cela couvre le cas où le nouvel inscrit (referred_id) insère son propre parrainage
CREATE POLICY "Users can insert their own referrals" 
ON public.referrals 
FOR INSERT 
WITH CHECK (auth.uid() = referred_id OR auth.uid() = sponsor_id);