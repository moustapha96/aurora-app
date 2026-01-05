-- Table pour stocker les messages de contact
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  user_name TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'read', 'replied', 'archived'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id ON public.contact_messages(user_id);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Les utilisateurs peuvent voir leurs propres messages
CREATE POLICY "Users can view their own contact messages"
  ON public.contact_messages FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer des messages
CREATE POLICY "Users can insert contact messages"
  ON public.contact_messages FOR INSERT
  WITH CHECK (true); -- Permettre à tous les utilisateurs authentifiés et non authentifiés

-- Seuls les admins peuvent modifier/supprimer
CREATE POLICY "Only admins can manage contact messages"
  ON public.contact_messages FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Trigger pour updated_at
CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

