-- ÉTAPE 1: Verrouiller les tables avec RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members FORCE ROW LEVEL SECURITY;

-- ÉTAPE 2: Supprimer les policies trop permissives sur profiles
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles read" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles for discovery" ON profiles;

-- ÉTAPE 3: Supprimer les anciennes policies SELECT sur profiles pour les recréer proprement
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view friend profiles through friendships" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles in connection requests" ON profiles;

-- ÉTAPE 4: Créer UNE SEULE policy SELECT sécurisée sur profiles
CREATE POLICY "Secure profile access"
ON profiles
FOR SELECT
USING (
  -- Accès à son propre profil
  id = auth.uid()
  -- OU ami accepté via friendships
  OR EXISTS (
    SELECT 1 FROM friendships f
    WHERE (f.user_id = auth.uid() AND f.friend_id = profiles.id)
       OR (f.friend_id = auth.uid() AND f.user_id = profiles.id)
  )
  -- OU demande de connexion pending/accepted
  OR EXISTS (
    SELECT 1 FROM connection_requests cr
    WHERE ((cr.requester_id = auth.uid() AND cr.recipient_id = profiles.id)
        OR (cr.recipient_id = auth.uid() AND cr.requester_id = profiles.id))
      AND cr.status IN ('accepted', 'pending')
  )
);

-- ÉTAPE 5: Corriger conversation_members - supprimer policies trop permissives
DROP POLICY IF EXISTS "Public read access" ON conversation_members;
DROP POLICY IF EXISTS "Enable read access for all users" ON conversation_members;
DROP POLICY IF EXISTS "Users can view members of their conversations" ON conversation_members;
DROP POLICY IF EXISTS "Users can view their own conversation memberships" ON conversation_members;

-- Créer policy restrictive: voir uniquement les membres des conversations où on est membre
CREATE POLICY "Users can view conversation members only if member"
ON conversation_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_members cm
    WHERE cm.conversation_id = conversation_members.conversation_id
      AND cm.user_id = auth.uid()
  )
);

-- ÉTAPE 6: Corriger landing_preferences - supprimer le pattern USING(true)
DROP POLICY IF EXISTS "Anyone can view landing preferences for public pages" ON landing_preferences;

-- Landing preferences sont pour les pages publiques, mais on garde un contrôle minimal
-- On permet l'accès pour les pages de landing publiques via user_id spécifique
CREATE POLICY "Landing preferences viewable for public landing pages"
ON landing_preferences
FOR SELECT
USING (
  -- Propriétaire peut voir ses préférences
  user_id = auth.uid()
  -- OU accès anonyme pour afficher la landing page publique (nécessaire pour /landing/:id)
  OR auth.uid() IS NULL
);

-- ÉTAPE 7: Créer table profiles_private pour données ultra-sensibles (optionnel, migration des données à faire manuellement)
CREATE TABLE IF NOT EXISTS profiles_private (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mobile_phone text,
  wealth_amount text,
  wealth_billions text,
  wealth_currency text,
  wealth_unit text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE profiles_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles_private FORCE ROW LEVEL SECURITY;

-- Seul le propriétaire peut voir ses données privées
CREATE POLICY "Only owner can read private data"
ON profiles_private
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Only owner can insert private data"
ON profiles_private
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Only owner can update private data"
ON profiles_private
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Only owner can delete private data"
ON profiles_private
FOR DELETE
USING (user_id = auth.uid());