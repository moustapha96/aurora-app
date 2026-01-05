-- Supprimer l'ancienne politique INSERT incorrecte
DROP POLICY IF EXISTS "Users can insert their own referrals as sponsor" ON public.referrals;

-- Créer une nouvelle politique qui permet à un nouvel utilisateur d'insérer son propre parrainage
-- (où il est le referred_id, pas le sponsor_id)
CREATE POLICY "Users can insert referrals as referred" 
ON public.referrals 
FOR INSERT 
WITH CHECK (auth.uid() = referred_id);