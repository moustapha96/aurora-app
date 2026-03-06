-- Table: demandes de contact / achat sur les biens du marketplace
-- Les membres peuvent "Contacter l'admin" depuis la fiche d'un bien ; l'admin voit ces demandes dans l'onglet Contacts.

CREATE TABLE IF NOT EXISTS marketplace_contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_contact_requests_created_at
  ON marketplace_contact_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_contact_requests_user_id
  ON marketplace_contact_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_contact_requests_item_id
  ON marketplace_contact_requests (item_id);

-- RLS
ALTER TABLE marketplace_contact_requests ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs authentifiés peuvent insérer leur propre demande
CREATE POLICY "Users can insert own contact request"
  ON marketplace_contact_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent lire leurs propres demandes (optionnel)
CREATE POLICY "Users can read own contact requests"
  ON marketplace_contact_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Les admins peuvent tout lire (pour l'onglet admin)
CREATE POLICY "Admins can read all contact requests"
  ON marketplace_contact_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Personne ne peut UPDATE/DELETE (les demandes sont historiques)
-- Si besoin plus tard : ajouter des policies pour admin update/delete.

COMMENT ON TABLE marketplace_contact_requests IS 'Demandes de contact ou d''achat envoyées par les membres depuis la page marketplace (bouton Contacter l''admin).';
