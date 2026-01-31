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

    const del = async (label: string, tableName: string, filter: { column: string; value: string; orFilter?: string }) => {
      let query = supabaseAdmin.from(tableName).delete()
      
      if (filter.orFilter) {
        query = query.or(filter.orFilter)
      } else {
        query = query.eq(filter.column, filter.value)
      }
      
      const { error } = await query
      if (error) throw new Error(`${label}: ${error.message ?? String(error)}`)
    }

    // --- Suppression des données liées ---
    await del('messages', 'messages', { column: 'sender_id', value: userId })
    await del('conversation_members', 'conversation_members', { column: 'user_id', value: userId })

    await del('friendships', 'friendships', { column: '', value: '', orFilter: `user_id.eq.${userId},friend_id.eq.${userId}` })
    await del('connection_requests', 'connection_requests', { column: '', value: '', orFilter: `requester_id.eq.${userId},recipient_id.eq.${userId}` })

    await del('business_content', 'business_content', { column: 'user_id', value: userId })
    await del('business_timeline', 'business_timeline', { column: 'user_id', value: userId })
    await del('business_projects', 'business_projects', { column: 'user_id', value: userId })
    await del('business_press', 'business_press', { column: 'user_id', value: userId })

    await del('family_content', 'family_content', { column: 'user_id', value: userId })
    await del('family_heritage', 'family_heritage', { column: 'user_id', value: userId })
    await del('family_lineage', 'family_lineage', { column: 'user_id', value: userId })
    await del('family_close', 'family_close', { column: 'user_id', value: userId })
    await del('family_board', 'family_board', { column: 'user_id', value: userId })
    await del('family_commitments', 'family_commitments', { column: 'user_id', value: userId })
    await del('family_influential', 'family_influential', { column: 'user_id', value: userId })
    await del('family_documents', 'family_documents', { column: 'user_id', value: userId })

    await del('network_content', 'network_content', { column: 'user_id', value: userId })
    await del('network_clubs', 'network_clubs', { column: 'user_id', value: userId })
    await del('network_events', 'network_events', { column: 'user_id', value: userId })
    await del('network_philanthropy', 'network_philanthropy', { column: 'user_id', value: userId })
    await del('network_influence', 'network_influence', { column: 'user_id', value: userId })
    await del('network_media', 'network_media', { column: 'user_id', value: userId })
    await del('network_media_posture', 'network_media_posture', { column: 'user_id', value: userId })
    await del('network_ambitions', 'network_ambitions', { column: 'user_id', value: userId })
    await del('network_social_links', 'network_social_links', { column: 'user_id', value: userId })

    await del('personal_content', 'personal_content', { column: 'user_id', value: userId })
    await del('personal_voyages', 'personal_voyages', { column: 'user_id', value: userId })
    await del('personal_luxe', 'personal_luxe', { column: 'user_id', value: userId })
    await del('personal_collections', 'personal_collections', { column: 'user_id', value: userId })
    await del('personal_gastronomie', 'personal_gastronomie', { column: 'user_id', value: userId })
    await del('personal_art_culture', 'personal_art_culture', { column: 'user_id', value: userId })

    await del('sports_hobbies', 'sports_hobbies', { column: 'user_id', value: userId })
    await del('curated_sports', 'curated_sports', { column: 'user_id', value: userId })
    await del('golf_profiles', 'golf_profiles', { column: 'user_id', value: userId })
    await del('golf_courses', 'golf_courses', { column: 'user_id', value: userId })
    await del('golf_achievements', 'golf_achievements', { column: 'user_id', value: userId })
    await del('golf_gallery', 'golf_gallery', { column: 'user_id', value: userId })
    await del('polo_profiles', 'polo_profiles', { column: 'user_id', value: userId })
    await del('polo_horses', 'polo_horses', { column: 'user_id', value: userId })
    await del('polo_achievements', 'polo_achievements', { column: 'user_id', value: userId })
    await del('polo_objectives', 'polo_objectives', { column: 'user_id', value: userId })
    await del('polo_gallery', 'polo_gallery', { column: 'user_id', value: userId })

    await del('artwork_collection', 'artwork_collection', { column: 'user_id', value: userId })
    await del('destinations', 'destinations', { column: 'user_id', value: userId })
    await del('social_influence', 'social_influence', { column: 'user_id', value: userId })
    await del('exhibitions', 'exhibitions', { column: 'user_id', value: userId })

    await del('identity_verifications', 'identity_verifications', { column: 'user_id', value: userId })
    await del('document_verifications', 'document_verifications', { column: 'user_id', value: userId })
    await del('webauthn_credentials', 'webauthn_credentials', { column: 'user_id', value: userId })

    await del('referral_links', 'referral_links', { column: 'sponsor_id', value: userId })
    await del('referrals', 'referrals', { column: '', value: '', orFilter: `sponsor_id.eq.${userId},referred_id.eq.${userId}` })

    await del('user_notifications', 'user_notifications', { column: 'user_id', value: userId })
    await del('landing_preferences', 'landing_preferences', { column: 'user_id', value: userId })
    await del('profiles_private', 'profiles_private', { column: 'user_id', value: userId })

    await del('user_roles', 'user_roles', { column: 'user_id', value: userId })

    await del('profiles', 'profiles', { column: 'id', value: userId })

    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authDeleteError) throw new Error(`auth.users: ${authDeleteError.message}`)

    return jsonResponse(200, { success: true })
  } catch (err) {
    console.error('admin-delete-member error:', err)
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) })
  }
})
