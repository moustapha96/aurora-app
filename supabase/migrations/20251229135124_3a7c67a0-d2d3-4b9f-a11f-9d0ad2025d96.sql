-- Ajouter une politique RLS pour permettre au nouveau user de créer son linked_account lors de l'inscription
-- Ceci est nécessaire car lors de l'inscription familiale, c'est le nouvel utilisateur qui crée l'entrée

CREATE POLICY "New users can create their own linked account entry"
ON public.linked_accounts
FOR INSERT
WITH CHECK (auth.uid() = linked_user_id);