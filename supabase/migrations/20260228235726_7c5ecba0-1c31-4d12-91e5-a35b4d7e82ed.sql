GRANT EXECUTE ON FUNCTION public.validate_single_use_invitation_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_single_use_invitation_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_invitation_code_used(uuid, uuid) TO authenticated;