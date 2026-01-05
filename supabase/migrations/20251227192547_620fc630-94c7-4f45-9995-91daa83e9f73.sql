-- Ajouter une politique pour permettre à tous les utilisateurs authentifiés et non authentifiés
-- de vérifier l'existence d'un code de parrainage (lecture limitée)
CREATE POLICY "Anyone can check referral codes" 
ON public.profiles 
FOR SELECT 
USING (
  referral_code IS NOT NULL
);

-- Note: Cette politique permet de lire uniquement les profils qui ont un code de parrainage
-- pour la vérification lors de l'inscription