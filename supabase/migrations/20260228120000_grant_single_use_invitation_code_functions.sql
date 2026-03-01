-- Permissions pour que la page d'inscription (anon) puisse valider les codes à usage unique
-- et que l'utilisateur fraîchement inscrit (authenticated) puisse marquer le code comme utilisé.

GRANT EXECUTE ON FUNCTION public.validate_single_use_invitation_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_single_use_invitation_code(text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.mark_invitation_code_used(uuid, uuid) TO authenticated;
