-- Table: permissions d'accès aux pages pour les membres (gérées par l'admin)
CREATE TABLE IF NOT EXISTS public.member_page_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, page_key)
);

CREATE INDEX IF NOT EXISTS idx_member_page_permissions_user_id ON public.member_page_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_member_page_permissions_page_key ON public.member_page_permissions(page_key);

ALTER TABLE public.member_page_permissions ENABLE ROW LEVEL SECURITY;

-- Les membres peuvent lire leurs propres permissions
CREATE POLICY "Users can read own page permissions"
  ON public.member_page_permissions FOR SELECT
  USING (auth.uid() = user_id);

-- Seuls les admins peuvent insérer, mettre à jour, supprimer (toutes lignes)
CREATE POLICY "Admins can manage all page permissions"
  ON public.member_page_permissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Backfill: donner toutes les pages à tous les membres existants (non-admin)
INSERT INTO public.member_page_permissions (user_id, page_key)
SELECT p.id, t.page_key
FROM public.profiles p
CROSS JOIN (
  VALUES
    ('home'),
    ('business'),
    ('family'),
    ('personal'),
    ('network'),
    ('members'),
    ('referrals'),
    ('marketplace'),
    ('concierge'),
    ('messages')
) AS t(page_key)
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = p.id AND ur.role = 'admin'
)
ON CONFLICT (user_id, page_key) DO NOTHING;
