-- Script simple pour créer un admin
-- INSTRUCTIONS :
-- 1. Créez d'abord l'utilisateur dans Supabase Dashboard > Authentication > Users
-- 2. Copiez l'UUID de l'utilisateur créé
-- 3. Remplacez YOUR_USER_ID_HERE ci-dessous par cet UUID
-- 4. Exécutez ce script dans le SQL Editor

DO $$
DECLARE
  v_user_id UUID := 'YOUR_USER_ID_HERE';  -- ⚠️ MODIFIEZ ICI : Remplacez par l'UUID de l'utilisateur
  v_email TEXT := 'admin@aurorasociety.ch';  -- ⚠️ MODIFIEZ ICI si nécessaire
  v_first_name TEXT := 'Admin';               -- ⚠️ MODIFIEZ ICI si nécessaire
  v_last_name TEXT := 'User';                 -- ⚠️ MODIFIEZ ICI si nécessaire
  v_username TEXT := 'admin';                 -- ⚠️ MODIFIEZ ICI si nécessaire
  v_mobile_phone TEXT := '+0000000000';       -- ⚠️ MODIFIEZ ICI si nécessaire
BEGIN
  -- Vérifier que l'utilisateur existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'L''utilisateur avec l''ID % n''existe pas dans auth.users. Créez-le d''abord dans Authentication > Users', v_user_id;
  END IF;
  
  -- Créer ou mettre à jour le profil
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    username,
    mobile_phone,
    updated_at
  )
  VALUES (
    v_user_id,
    v_first_name,
    v_last_name,
    v_username,
    v_mobile_phone,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    username = COALESCE(EXCLUDED.username, profiles.username),
    mobile_phone = EXCLUDED.mobile_phone,
    updated_at = now();
  
  RAISE NOTICE 'Profil créé/mis à jour pour l''utilisateur %', v_email;
  
  -- Supprimer le rôle member s'il existe
  DELETE FROM public.user_roles
  WHERE user_id = v_user_id
    AND role = 'member';
  
  -- Ajouter le rôle admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE 'Rôle admin attribué à l''utilisateur %', v_email;
  RAISE NOTICE '✅ SUCCÈS: L''utilisateur % est maintenant administrateur', v_email;
  
END $$;

-- ============================================
-- VÉRIFICATION
-- ============================================

SELECT 
  u.email,
  u.id,
  p.first_name,
  p.last_name,
  p.username,
  ur.role,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.id = 'YOUR_USER_ID_HERE'  -- ⚠️ MODIFIEZ ICI : Même UUID que ci-dessus
  AND ur.role = 'admin';

