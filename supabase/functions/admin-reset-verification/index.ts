import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'
import { corsHeaders } from '../_shared/cors.ts'

type AdminResetVerificationRequest = {
  userId?: string
}

async function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    if (!supabaseUrl || !serviceKey || !anonKey) {
      return jsonResponse(500, { error: 'Configuration backend manquante.' })
    }

    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader) return jsonResponse(401, { error: 'Non authentifié.' })

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: userData, error: userError } = await supabaseUser.auth.getUser()
    const caller = userData?.user

    if (userError || !caller) {
      return jsonResponse(401, { error: 'Non authentifié.' })
    }

    const { userId }: AdminResetVerificationRequest = await req.json().catch(() => ({}))

    if (!userId) return jsonResponse(400, { error: 'userId requis.' })

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Autorisation: admin uniquement
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)

    if (rolesError) {
      console.error('Error reading roles:', rolesError)
      return jsonResponse(500, { error: 'Impossible de vérifier les permissions.' })
    }

    const isAdmin = (roles ?? []).some((r) => r.role === 'admin')
    if (!isAdmin) return jsonResponse(403, { error: 'Accès refusé.' })

    // Supprimer toutes les vérifications d'identité pour cet utilisateur
    const { error: deleteVerificationsError } = await supabaseAdmin
      .from('identity_verifications')
      .delete()
      .eq('user_id', userId)

    if (deleteVerificationsError) {
      console.error('Error deleting identity_verifications:', deleteVerificationsError)
      return jsonResponse(500, { error: deleteVerificationsError.message })
    }

    // Réinitialiser le statut de vérification sur le profil
    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({
        identity_verified: false,
        identity_verified_at: null,
      })
      .eq('id', userId)

    if (updateProfileError) {
      console.error('Error updating profile:', updateProfileError)
      return jsonResponse(500, { error: updateProfileError.message })
    }

    console.log(`Verification reset for user ${userId} by admin ${caller.id}`)

    return jsonResponse(200, { success: true, userId })
  } catch (err) {
    console.error('admin-reset-verification error:', err)
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) })
  }
})
