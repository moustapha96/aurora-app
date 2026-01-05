import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'
import { corsHeaders } from '../_shared/cors.ts'

type DeleteMemberRequest = {
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

    const { userId }: DeleteMemberRequest = await req.json().catch(() => ({}))
    if (!userId) return jsonResponse(400, { error: 'userId requis.' })
    if (userId === caller.id) return jsonResponse(400, { error: 'Suppression du compte courant interdite.' })

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Garde-fou: suppression uniquement en mode test
    const { data: testSetting, error: testSettingError } = await supabaseAdmin
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'test_mode_enabled')
      .maybeSingle()

    if (testSettingError) {
      console.error('Error reading test mode setting:', testSettingError)
      return jsonResponse(500, { error: 'Impossible de vérifier le mode test.' })
    }

    const testModeEnabled = testSetting?.setting_value === 'true'
    if (!testModeEnabled) return jsonResponse(403, { error: 'Suppression désactivée (mode test requis).' })

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

    const del = async (label: string, p: Promise<{ error: any }>) => {
      const { error } = await p
      if (error) throw new Error(`${label}: ${error.message ?? String(error)}`)
    }

    // --- Suppression des données liées ---
    await del('messages', supabaseAdmin.from('messages').delete().eq('sender_id', userId))
    await del('conversation_members', supabaseAdmin.from('conversation_members').delete().eq('user_id', userId))

    await del('friendships', supabaseAdmin.from('friendships').delete().or(`user_id.eq.${userId},friend_id.eq.${userId}`))
    await del('connection_requests', supabaseAdmin.from('connection_requests').delete().or(`requester_id.eq.${userId},recipient_id.eq.${userId}`))

    await del('business_content', supabaseAdmin.from('business_content').delete().eq('user_id', userId))
    await del('business_timeline', supabaseAdmin.from('business_timeline').delete().eq('user_id', userId))
    await del('business_projects', supabaseAdmin.from('business_projects').delete().eq('user_id', userId))
    await del('business_press', supabaseAdmin.from('business_press').delete().eq('user_id', userId))

    await del('family_content', supabaseAdmin.from('family_content').delete().eq('user_id', userId))
    await del('family_heritage', supabaseAdmin.from('family_heritage').delete().eq('user_id', userId))
    await del('family_lineage', supabaseAdmin.from('family_lineage').delete().eq('user_id', userId))
    await del('family_close', supabaseAdmin.from('family_close').delete().eq('user_id', userId))
    await del('family_board', supabaseAdmin.from('family_board').delete().eq('user_id', userId))
    await del('family_commitments', supabaseAdmin.from('family_commitments').delete().eq('user_id', userId))
    await del('family_influential', supabaseAdmin.from('family_influential').delete().eq('user_id', userId))
    await del('family_documents', supabaseAdmin.from('family_documents').delete().eq('user_id', userId))

    await del('network_content', supabaseAdmin.from('network_content').delete().eq('user_id', userId))
    await del('network_clubs', supabaseAdmin.from('network_clubs').delete().eq('user_id', userId))
    await del('network_events', supabaseAdmin.from('network_events').delete().eq('user_id', userId))
    await del('network_philanthropy', supabaseAdmin.from('network_philanthropy').delete().eq('user_id', userId))
    await del('network_influence', supabaseAdmin.from('network_influence').delete().eq('user_id', userId))
    await del('network_media', supabaseAdmin.from('network_media').delete().eq('user_id', userId))
    await del('network_media_posture', supabaseAdmin.from('network_media_posture').delete().eq('user_id', userId))
    await del('network_ambitions', supabaseAdmin.from('network_ambitions').delete().eq('user_id', userId))
    await del('network_social_links', supabaseAdmin.from('network_social_links').delete().eq('user_id', userId))

    await del('personal_content', supabaseAdmin.from('personal_content').delete().eq('user_id', userId))
    await del('personal_voyages', supabaseAdmin.from('personal_voyages').delete().eq('user_id', userId))
    await del('personal_luxe', supabaseAdmin.from('personal_luxe').delete().eq('user_id', userId))
    await del('personal_collections', supabaseAdmin.from('personal_collections').delete().eq('user_id', userId))
    await del('personal_gastronomie', supabaseAdmin.from('personal_gastronomie').delete().eq('user_id', userId))
    await del('personal_art_culture', supabaseAdmin.from('personal_art_culture').delete().eq('user_id', userId))

    await del('sports_hobbies', supabaseAdmin.from('sports_hobbies').delete().eq('user_id', userId))
    await del('curated_sports', supabaseAdmin.from('curated_sports').delete().eq('user_id', userId))
    await del('golf_profiles', supabaseAdmin.from('golf_profiles').delete().eq('user_id', userId))
    await del('golf_courses', supabaseAdmin.from('golf_courses').delete().eq('user_id', userId))
    await del('golf_achievements', supabaseAdmin.from('golf_achievements').delete().eq('user_id', userId))
    await del('golf_gallery', supabaseAdmin.from('golf_gallery').delete().eq('user_id', userId))
    await del('polo_profiles', supabaseAdmin.from('polo_profiles').delete().eq('user_id', userId))
    await del('polo_horses', supabaseAdmin.from('polo_horses').delete().eq('user_id', userId))
    await del('polo_achievements', supabaseAdmin.from('polo_achievements').delete().eq('user_id', userId))
    await del('polo_objectives', supabaseAdmin.from('polo_objectives').delete().eq('user_id', userId))
    await del('polo_gallery', supabaseAdmin.from('polo_gallery').delete().eq('user_id', userId))

    await del('artwork_collection', supabaseAdmin.from('artwork_collection').delete().eq('user_id', userId))
    await del('destinations', supabaseAdmin.from('destinations').delete().eq('user_id', userId))
    await del('social_influence', supabaseAdmin.from('social_influence').delete().eq('user_id', userId))
    await del('exhibitions', supabaseAdmin.from('exhibitions').delete().eq('user_id', userId))

    await del('identity_verifications', supabaseAdmin.from('identity_verifications').delete().eq('user_id', userId))
    await del('document_verifications', supabaseAdmin.from('document_verifications').delete().eq('user_id', userId))
    await del('webauthn_credentials', supabaseAdmin.from('webauthn_credentials').delete().eq('user_id', userId))

    await del('referral_links', supabaseAdmin.from('referral_links').delete().eq('sponsor_id', userId))
    await del('referrals', supabaseAdmin.from('referrals').delete().or(`sponsor_id.eq.${userId},referred_id.eq.${userId}`))

    await del('user_notifications', supabaseAdmin.from('user_notifications').delete().eq('user_id', userId))
    await del('landing_preferences', supabaseAdmin.from('landing_preferences').delete().eq('user_id', userId))
    await del('profiles_private', supabaseAdmin.from('profiles_private').delete().eq('user_id', userId))

    await del('user_roles', supabaseAdmin.from('user_roles').delete().eq('user_id', userId))

    await del('profiles', supabaseAdmin.from('profiles').delete().eq('id', userId))

    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authDeleteError) throw new Error(`auth.users: ${authDeleteError.message}`)

    return jsonResponse(200, { success: true })
  } catch (err) {
    console.error('admin-delete-member error:', err)
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) })
  }
})
