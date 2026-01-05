import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'
import { corsHeaders } from '../_shared/cors.ts'

type AdminSetAccountActiveRequest = {
  userId?: string
  active?: boolean
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

    const { userId, active }: AdminSetAccountActiveRequest = await req.json().catch(() => ({}))

    if (!userId) return jsonResponse(400, { error: 'userId requis.' })
    if (typeof active !== 'boolean') return jsonResponse(400, { error: 'active (boolean) requis.' })

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

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        account_active: active,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating profile identity_verified:', updateError)
      return jsonResponse(500, { error: updateError.message })
    }

    return jsonResponse(200, { success: true, userId, active })
  } catch (err) {
    console.error('admin-set-account-active error:', err)
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) })
  }
})
