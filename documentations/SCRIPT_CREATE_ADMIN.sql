-- Script pour créer un administrateur directement dans la base de données
-- À exécuter dans le SQL Editor du Supabase Dashboard
-- 
-- INSTRUCTIONS :
-- 1. Remplacez les valeurs ci-dessous par vos propres données
-- 2. Exécutez le script dans le SQL Editor
-- 3. Connectez-vous avec l'email et le mot de passe définis

-- ============================================
-- CONFIGURATION - MODIFIEZ CES VALEURS
-- ============================================

DO $$
DECLARE
  v_email TEXT := 'admin@aurorasociety.ch';  -- MODIFIEZ ICI
  v_password TEXT := 'admin123';              -- MODIFIEZ ICI (minimum 6 caractères)
  v_first_name TEXT := 'Admin';               -- MODIFIEZ ICI
  v_last_name TEXT := 'User';                 -- MODIFIEZ ICI
  v_username TEXT := 'admin';                 -- MODIFIEZ ICI (optionnel)
  v_mobile_phone TEXT := '+0000000000';       -- MODIFIEZ ICI (optionnel)
  v_user_id UUID;
BEGIN
  -- Vérifier si l'utilisateur existe déjà
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  IF v_user_id IS NULL THEN
    -- Créer un nouvel utilisateur dans auth.users
    -- Note: Cette méthode nécessite d'utiliser l'API Supabase Admin
    -- Pour créer via SQL, on doit utiliser auth.users directement (nécessite des privilèges spéciaux)
    
    -- Alternative: Utiliser la fonction auth.users via l'API Admin
    -- Pour l'instant, on va créer le profil et le rôle, mais l'utilisateur devra être créé via l'interface Supabase
    
    RAISE NOTICE 'L''utilisateur avec l''email % n''existe pas encore dans auth.users', v_email;
    RAISE NOTICE 'Vous devez d''abord créer l''utilisateur via:';
    RAISE NOTICE '1. Supabase Dashboard > Authentication > Users > Add User';
    RAISE NOTICE '2. Ou via l''API Supabase Admin';
    RAISE NOTICE '3. Puis exécutez la partie ci-dessous pour ajouter le rôle admin';
    
  ELSE
    RAISE NOTICE 'Utilisateur trouvé avec l''ID: %', v_user_id;
    
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
      COALESCE(v_username, split_part(v_email, '@', 1)),
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
    RAISE NOTICE 'SUCCÈS: L''utilisateur % est maintenant administrateur', v_email;
    
  END IF;
END $$;

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Vérifier que l'admin a été créé
SELECT 
  u.email,
  u.id,
  p.first_name,
  p.last_name,
  p.username,
  ur.role,
  u.email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'admin@aurorasociety.ch'  -- MODIFIEZ ICI avec votre email
  AND ur.role = 'admin';

