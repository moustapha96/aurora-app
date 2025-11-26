-- Script pour corriger la récursion infinie dans les politiques RLS de user_roles
-- À exécuter dans le SQL Editor du Supabase Dashboard
-- Ce script corrige l'erreur "infinite recursion detected in policy for relation user_roles"

-- ============================================
-- 1. SUPPRIMER LES ANCIENNES POLITIQUES PROBLÉMATIQUES
-- ============================================
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- ============================================
-- 2. CRÉER UNE FONCTION SECURITY DEFINER POUR VÉRIFIER LE RÔLE ADMIN
-- ============================================
-- Cette fonction contourne RLS pour vérifier si un utilisateur est admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- ============================================
-- 3. CRÉER LES NOUVELLES POLITIQUES RLS
-- ============================================

-- Politique pour SELECT : Les utilisateurs peuvent voir leurs propres rôles
-- Cette politique ne cause pas de récursion car elle ne dépend pas de has_role()
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Politique pour INSERT : 
-- - Les utilisateurs peuvent insérer leur propre rôle 'member' (pour l'inscription)
-- - Les admins peuvent insérer n'importe quel rôle
-- On utilise is_admin() qui est SECURITY DEFINER et ne cause pas de récursion
CREATE POLICY "Users can insert their own member role or admins can insert any role"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    -- L'utilisateur insère son propre rôle 'member'
    (auth.uid() = user_id AND role = 'member')
    OR
    -- Un admin insère n'importe quel rôle
    public.is_admin(auth.uid())
  );

-- Politique pour UPDATE : Seuls les admins peuvent modifier les rôles
CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Politique pour DELETE : Seuls les admins peuvent supprimer les rôles
CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.is_admin(auth.uid()));

-- ============================================
-- 4. MISE À JOUR DE LA FONCTION has_role POUR UTILISER is_admin
-- ============================================
-- La fonction has_role existante est déjà SECURITY DEFINER, donc elle est OK
-- Mais on peut s'assurer qu'elle est bien configurée
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ============================================
-- 5. VÉRIFICATION
-- ============================================
-- Afficher les politiques créées
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'user_roles'
ORDER BY policyname;

-- Vérifier que les fonctions existent
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_admin', 'has_role')
ORDER BY routine_name;

-- ============================================
-- 6. NOTES IMPORTANTES
-- ============================================
-- 
-- Ce script résout le problème de récursion en :
-- 1. Utilisant une fonction SECURITY DEFINER (is_admin) qui contourne RLS
-- 2. Séparant les politiques par opération (SELECT, INSERT, UPDATE, DELETE)
-- 3. Permettant aux utilisateurs de voir leurs propres rôles sans récursion
-- 4. Permettant aux utilisateurs d'insérer leur propre rôle 'member' lors de l'inscription
-- 5. Restreignant UPDATE/DELETE aux admins uniquement
--
-- La fonction is_admin() utilise SECURITY DEFINER, ce qui signifie qu'elle s'exécute
-- avec les privilèges du propriétaire de la fonction, contournant ainsi RLS.
-- Cela évite la récursion car la fonction peut lire user_roles sans déclencher
-- les politiques RLS.

