-- ============================================
-- VÉRIFICATION ET CORRECTION DE sponsor_approved
-- ============================================

-- 1. Vérifier la structure de la table
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'referrals'
  AND column_name IN ('sponsor_approved', 'sponsor_approved_at', 'rejection_reason', 'status')
ORDER BY ordinal_position;

-- 2. Vérifier les données actuelles
SELECT 
  id,
  sponsor_id,
  referred_id,
  status,
  sponsor_approved,
  sponsor_approved_at,
  rejection_reason,
  created_at
FROM public.referrals
ORDER BY created_at DESC
LIMIT 20;

-- 3. Compter les membres par statut d'approbation
SELECT 
  CASE 
    WHEN sponsor_approved IS NULL THEN 'NULL (non défini)'
    WHEN sponsor_approved = true THEN 'Approuvé (true)'
    WHEN sponsor_approved = false THEN 'Non approuvé (false)'
  END as approval_status,
  COUNT(*) as count
FROM public.referrals
GROUP BY sponsor_approved
ORDER BY count DESC;

-- 4. Vérifier les membres en attente (devraient être ceux avec sponsor_approved = false ou NULL)
SELECT 
  id,
  sponsor_id,
  referred_id,
  status,
  sponsor_approved,
  CASE 
    WHEN sponsor_approved IS NULL THEN 'NULL - À corriger'
    WHEN sponsor_approved = false THEN 'Non approuvé - OK'
    WHEN sponsor_approved = true THEN 'Approuvé - Ne devrait pas être dans la liste'
  END as status_check
FROM public.referrals
WHERE status != 'rejected'
ORDER BY created_at DESC;

-- 5. CORRECTION : Mettre sponsor_approved = false pour tous les NULL (nouveaux membres non approuvés)
-- ⚠️ À exécuter seulement si vous voulez corriger les données existantes
UPDATE public.referrals
SET sponsor_approved = false
WHERE sponsor_approved IS NULL
  AND status != 'rejected';

-- 6. Vérifier que la colonne a bien un DEFAULT false pour les nouvelles insertions
-- Si ce n'est pas le cas, exécuter :
ALTER TABLE public.referrals 
ALTER COLUMN sponsor_approved SET DEFAULT false;

-- 7. Vérifier les RLS policies pour s'assurer que les sponsors peuvent UPDATE leurs referrals
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'referrals'
ORDER BY policyname;

-- 8. Si la policy UPDATE n'existe pas ou ne permet pas aux sponsors de modifier, créer/modifier :
-- Supprimer l'ancienne policy si elle existe
DROP POLICY IF EXISTS "Only admins can update referrals" ON public.referrals;
DROP POLICY IF EXISTS "Sponsors can update their own referrals" ON public.referrals;

-- Créer une nouvelle policy qui permet aux sponsors de mettre à jour leurs referrals
CREATE POLICY "Sponsors can update their own referrals"
  ON public.referrals FOR UPDATE
  USING (auth.uid() = sponsor_id)
  WITH CHECK (auth.uid() = sponsor_id);

-- Les admins peuvent toujours tout modifier
CREATE POLICY "Admins can update all referrals"
  ON public.referrals FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 9. Vérification finale : Tous les nouveaux referrals doivent avoir sponsor_approved = false par défaut
SELECT 
  COUNT(*) as total_referrals,
  COUNT(CASE WHEN sponsor_approved IS NULL THEN 1 END) as null_values,
  COUNT(CASE WHEN sponsor_approved = false THEN 1 END) as false_values,
  COUNT(CASE WHEN sponsor_approved = true THEN 1 END) as true_values
FROM public.referrals;
