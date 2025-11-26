-- Script pour vérifier si un admin existe et diagnostiquer les problèmes
-- Exécutez ce script dans le SQL Editor pour vérifier votre configuration admin

-- ============================================
-- 1. VÉRIFIER TOUS LES ADMINS
-- ============================================
SELECT 
  u.email,
  u.id,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  u.created_at,
  p.first_name,
  p.last_name,
  p.username,
  ur.role,
  CASE 
    WHEN u.id IS NULL THEN '❌ Utilisateur n''existe pas dans auth.users'
    WHEN p.id IS NULL THEN '⚠️ Profil manquant'
    WHEN ur.user_id IS NULL THEN '⚠️ Rôle admin manquant'
    WHEN u.email_confirmed_at IS NULL THEN '⚠️ Email non confirmé'
    ELSE '✅ Admin configuré correctement'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id AND ur.role = 'admin'
WHERE ur.role = 'admin'
ORDER BY u.created_at DESC;

-- ============================================
-- 2. VÉRIFIER UN UTILISATEUR SPÉCIFIQUE (remplacez l'email)
-- ============================================
SELECT 
  u.email,
  u.id,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  u.created_at,
  p.first_name,
  p.last_name,
  p.username,
  ur.role,
  CASE 
    WHEN u.id IS NULL THEN '❌ Utilisateur n''existe pas dans auth.users'
    WHEN p.id IS NULL THEN '⚠️ Profil manquant'
    WHEN ur.user_id IS NULL THEN '⚠️ Rôle admin manquant'
    WHEN u.email_confirmed_at IS NULL THEN '⚠️ Email non confirmé'
    ELSE '✅ Admin configuré correctement'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id AND ur.role = 'admin'
WHERE u.email = 'admin@aurorasociety.ch'  -- ⚠️ MODIFIEZ ICI avec votre email
ORDER BY u.created_at DESC;

-- ============================================
-- 3. VÉRIFIER LES RÔLES DE TOUS LES UTILISATEURS
-- ============================================
SELECT 
  u.email,
  u.id,
  COALESCE(ur.role, 'Aucun rôle') as role,
  p.first_name,
  p.last_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
ORDER BY u.created_at DESC;

-- ============================================
-- 4. CORRIGER UN ADMIN MANQUANT (remplacez l'UUID)
-- ============================================
-- Si vous voyez "⚠️ Rôle admin manquant" ci-dessus, exécutez ceci :
/*
DO $$
DECLARE
  v_user_id UUID := 'YOUR_USER_ID_HERE';  -- ⚠️ MODIFIEZ ICI avec l'UUID de l'utilisateur
BEGIN
  -- Supprimer le rôle member s'il existe
  DELETE FROM public.user_roles
  WHERE user_id = v_user_id
    AND role = 'member';
  
  -- Ajouter le rôle admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE '✅ Rôle admin ajouté pour l''utilisateur %', v_user_id;
END $$;
*/

