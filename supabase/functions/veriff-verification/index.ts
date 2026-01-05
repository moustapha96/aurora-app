import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-auth-client, x-hmac-signature',
};

interface VeriffRequest {
  action: 'create-session' | 'create-session-registration' | 'get-decision' | 'get-person' | 'get-session-media' | 'status' | 'webhook-decision' | 'webhook-event' | 'check-registration' | 'admin-refresh-all';
  sessionId?: string;
  registrationData?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  registrationToken?: string;
  webhookPayload?: any;
}

// Veriff base URL
const VERIFF_BASE_URL = 'https://stationapi.veriff.com';

// Create HMAC signature for Veriff authentication
async function createHmacSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Verify incoming webhook signature
async function verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const expectedSignature = await createHmacSignature(payload, secret);
  return signature === expectedSignature;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const veriffApiKey = Deno.env.get('VERIFF_API_KEY');
    const veriffSharedSecret = Deno.env.get('VERIFF_SHARED_SECRET');

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header for authenticated requests
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user } } = await supabaseClient.auth.getUser();
      userId = user?.id || null;
    }

    // Check if Veriff is configured
    if (!veriffApiKey || !veriffSharedSecret) {
      console.error('Veriff API credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Service de vérification non configuré. Contactez l\'administrateur.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestBody: VeriffRequest = await req.json();
    const { action, sessionId, registrationData, registrationToken, webhookPayload } = requestBody;
    console.log(`Veriff verification action: ${action}`, { userId, sessionId });

    // Helper function to make Veriff API requests
    // IMPORTANT (Veriff HMAC):
    // - POST/PATCH: sign the request payload body
    // - GET/DELETE: sign the session ID ("query ID")
    async function veriffRequest(method: string, endpoint: string, body?: any) {
      const url = `${VERIFF_BASE_URL}/v1${endpoint}`;
      const bodyString = body ? JSON.stringify(body) : '';

      const methodUpper = method.toUpperCase();

      // Extract session ID for endpoints like: /sessions/{id}/decision
      const sessionIdMatch = endpoint.match(/\/sessions\/([^/\?]+)/);
      const sessionIdForSignature = sessionIdMatch?.[1];

      const toSign = (methodUpper === 'GET' || methodUpper === 'DELETE')
        ? (sessionIdForSignature || '')
        : bodyString;

      const signature = await createHmacSignature(toSign, veriffSharedSecret!);

      const headers: Record<string, string> = {
        'X-AUTH-CLIENT': veriffApiKey!,
        'X-HMAC-SIGNATURE': signature,
        'Content-Type': 'application/json',
      };

      console.log(`Veriff API request: ${methodUpper} ${url}`);
      if ((methodUpper === 'GET' || methodUpper === 'DELETE') && !sessionIdForSignature) {
        console.warn('Could not extract session ID for Veriff signature from endpoint:', endpoint);
      }

      const response = await fetch(url, {
        method: methodUpper,
        headers,
        body: body ? bodyString : undefined,
      });

      const responseText = await response.text();
      console.log(`Veriff API response: ${response.status}`, responseText.substring(0, 500));

      if (!response.ok) {
        throw new Error(`Veriff API error: ${response.status} - ${responseText}`);
      }

      return JSON.parse(responseText);
    }

    // ============================================================
    // ACTION: Create session for registration (auth required - user is logged in after signup)
    // ============================================================
    if (action === 'create-session-registration') {
      // L'utilisateur doit être authentifié (il vient de s'inscrire)
      if (!userId) {
        console.log('No userId found. Auth header:', authHeader ? 'present' : 'missing');
        return new Response(
          JSON.stringify({ 
            error: 'Session expirée. Veuillez vous reconnecter pour continuer la vérification.',
            code: 'SESSION_EXPIRED',
            requiresReauth: true
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Récupérer les données du profil depuis la base de données
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('first_name, last_name, id')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error('Error fetching profile:', profileError);
        return new Response(
          JSON.stringify({ error: 'Profil utilisateur non trouvé. Veuillez compléter votre inscription.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Récupérer l'email depuis auth.users via le service admin
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (authError || !authUser?.user?.email) {
        console.error('Error fetching auth user:', authError);
        return new Response(
          JSON.stringify({ error: 'Email utilisateur non trouvé.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const regToken = crypto.randomUUID();

      // Déterminer l'URL de retour (preview/prod) depuis l'origine de la requête
      const originHeader = req.headers.get('origin');
      const forwardedHost = req.headers.get('x-forwarded-host');
      const forwardedProto = req.headers.get('x-forwarded-proto');
      const inferredUrl = forwardedHost ? `${forwardedProto || 'https'}://${forwardedHost}` : null;

      const siteUrl = originHeader || inferredUrl || Deno.env.get('SITE_URL') || 'https://preview--e6cb71785bb7428786ce0e9ee3ec0082.lovable.app';

      console.log('Creating Veriff session for registration:', authUser.user.email, 'User ID:', userId);
      console.log('Profile data:', profile.first_name, profile.last_name);

      const veriffData = await veriffRequest('POST', '/sessions', {
        verification: {
          callback: `${siteUrl}/register?verification=complete&token=${regToken}`,
          person: {
            firstName: profile.first_name,
            lastName: profile.last_name,
          },
          vendorData: userId, // Utiliser l'ID utilisateur réel
          endUserId: userId,  // Utiliser l'ID utilisateur réel
        }
      });

      console.log('Veriff session created:', veriffData.verification?.id);

      // Store verification record with the real user_id
      const { data: verification, error: insertError } = await supabaseAdmin
        .from('identity_verifications')
        .insert({
          user_id: userId, // Utiliser l'ID utilisateur réel
          status: 'initiated',
          verification_type: 'registration',
          verification_result: {
            registration_token: regToken,
            registration_email: authUser.user.email,
            registration_first_name: profile.first_name,
            registration_last_name: profile.last_name,
            veriff_session_id: veriffData.verification?.id,
            veriff_session_url: veriffData.verification?.url,
            veriff_session_token: veriffData.verification?.sessionToken,
          }
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error storing verification:', insertError);
        return new Response(
          JSON.stringify({ error: 'Erreur lors de l\'enregistrement de la vérification' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          verificationId: verification?.id,
          registrationToken: regToken,
          redirectUrl: veriffData.verification?.url,
          sessionId: veriffData.verification?.id,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // ACTION: Check registration verification status
    // ============================================================
    if (action === 'check-registration') {
      if (!registrationToken) {
        return new Response(
          JSON.stringify({ error: 'Token d\'inscription requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find verification by registration token
      const { data: verifications, error } = await supabaseAdmin
        .from('identity_verifications')
        .select('*')
        .eq('verification_type', 'registration')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching verification:', error);
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la récupération du statut' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find the verification with matching token
      const verification = verifications?.find(v => 
        v.verification_result?.registration_token === registrationToken
      );

      if (!verification) {
        return new Response(
          JSON.stringify({ error: 'Vérification non trouvée', status: 'not_found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If still pending, try to get decision from Veriff
      if (verification.status === 'initiated' || verification.status === 'pending') {
        const veriffSessionId = verification.verification_result?.veriff_session_id;
        if (veriffSessionId) {
          try {
            const decision = await veriffRequest('GET', `/sessions/${veriffSessionId}/decision`);
            console.log('Veriff decision for registration:', decision.verification?.status);
            
            // Update status based on Veriff decision
            if (decision.verification?.status === 'approved') {
              await supabaseAdmin
                .from('identity_verifications')
                .update({
                  status: 'verified',
                  first_name_extracted: decision.verification?.person?.firstName,
                  last_name_extracted: decision.verification?.person?.lastName,
                  document_type: decision.verification?.document?.type,
                  document_country: decision.verification?.document?.country,
                  verification_result: {
                    ...verification.verification_result,
                    veriff_decision: decision
                  }
                })
                .eq('id', verification.id);
              
              verification.status = 'verified';
              verification.first_name_extracted = decision.verification?.person?.firstName;
              verification.last_name_extracted = decision.verification?.person?.lastName;
            } else if (decision.verification?.status === 'declined' || decision.verification?.status === 'expired') {
              await supabaseAdmin
                .from('identity_verifications')
                .update({
                  status: 'rejected',
                  verification_result: {
                    ...verification.verification_result,
                    veriff_decision: decision,
                    rejection_reason: decision.verification?.reason
                  }
                })
                .eq('id', verification.id);
              
              verification.status = 'rejected';
            }
          } catch (e) {
            console.log('Could not get decision (session may still be in progress):', e);
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: verification.status,
          firstName: verification.first_name_extracted || verification.verification_result?.registration_first_name,
          lastName: verification.last_name_extracted || verification.verification_result?.registration_last_name,
          documentType: verification.document_type,
          documentCountry: verification.document_country,
          verificationId: verification.id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // ACTION: Create session for authenticated user
    // ============================================================
    if (action === 'create-session') {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Non authentifié' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user profile
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .maybeSingle();

      // Déterminer l'URL de retour (preview/prod) depuis l'origine de la requête
      const originHeader = req.headers.get('origin');
      const forwardedHost = req.headers.get('x-forwarded-host');
      const forwardedProto = req.headers.get('x-forwarded-proto');
      const inferredUrl = forwardedHost ? `${forwardedProto || 'https'}://${forwardedHost}` : null;

      const siteUrl = originHeader || inferredUrl || Deno.env.get('SITE_URL') || 'https://preview--e6cb71785bb7428786ce0e9ee3ec0082.lovable.app';

      const veriffData = await veriffRequest('POST', '/sessions', {
        verification: {
          callback: `${siteUrl}/security-settings?verification=complete`,
          person: {
            firstName: profile?.first_name || '',
            lastName: profile?.last_name || '',
          },
          vendorData: userId,
          endUserId: userId,
        }
      });

      console.log('Veriff session created for user:', userId, veriffData.verification?.id);

      // Store verification record
      const { data: verification, error: insertError } = await supabaseAdmin
        .from('identity_verifications')
        .insert({
          user_id: userId,
          status: 'initiated',
          verification_type: 'id_document',
          verification_result: {
            veriff_session_id: veriffData.verification?.id,
            veriff_session_url: veriffData.verification?.url,
            veriff_session_token: veriffData.verification?.sessionToken,
          }
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error storing verification:', insertError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          verificationId: verification?.id,
          redirectUrl: veriffData.verification?.url,
          sessionId: veriffData.verification?.id,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // ACTION: Get decision for a session
    // ============================================================
    if (action === 'get-decision') {
      if (!sessionId) {
        return new Response(
          JSON.stringify({ error: 'Session ID requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const decision = await veriffRequest('GET', `/sessions/${sessionId}/decision`);

      return new Response(
        JSON.stringify({ success: true, decision }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // ACTION: Get person data for a session
    // ============================================================
    if (action === 'get-person') {
      if (!sessionId) {
        return new Response(
          JSON.stringify({ error: 'Session ID requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const person = await veriffRequest('GET', `/sessions/${sessionId}/person`);

      return new Response(
        JSON.stringify({ success: true, person }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // ACTION: Get session media
    // ============================================================
    if (action === 'get-session-media') {
      if (!sessionId) {
        return new Response(
          JSON.stringify({ error: 'Session ID requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const media = await veriffRequest('GET', `/sessions/${sessionId}/media`);

      return new Response(
        JSON.stringify({ success: true, media }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // ACTION: Get user verification status
    // ============================================================
    if (action === 'status') {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Non authentifié' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get latest verification for user
      const { data: verification, error } = await supabaseAdmin
        .from('identity_verifications')
        .select('id, user_id, status, first_name_extracted, last_name_extracted, document_type, document_country, document_url, created_at, verification_result')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching verification:', error);
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la récupération du statut' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If verification is pending/initiated, check Veriff for updates
      if (verification && (verification.status === 'initiated' || verification.status === 'pending')) {
        const veriffSessionId = verification.verification_result?.veriff_session_id;
        if (veriffSessionId) {
          try {
            const decision = await veriffRequest('GET', `/sessions/${veriffSessionId}/decision`);
            console.log('Veriff decision status:', decision.verification?.status);

            let newStatus = verification.status;
            let updateData: any = {};

            if (decision.verification?.status === 'approved') {
              newStatus = 'verified';
              updateData = {
                status: newStatus,
                first_name_extracted: decision.verification?.person?.firstName,
                last_name_extracted: decision.verification?.person?.lastName,
                document_type: decision.verification?.document?.type,
                document_country: decision.verification?.document?.country,
                verification_result: {
                  ...verification.verification_result,
                  veriff_decision: decision
                }
              };

              // Update profile
              await supabaseAdmin
                .from('profiles')
                .update({
                  identity_verified: true,
                  identity_verified_at: new Date().toISOString()
                })
                .eq('id', userId);
            } else if (decision.verification?.status === 'declined' || decision.verification?.status === 'expired') {
              newStatus = 'rejected';
              updateData = {
                status: newStatus,
                verification_result: {
                  ...verification.verification_result,
                  veriff_decision: decision,
                  rejection_reason: decision.verification?.reason
                }
              };
            }

            if (Object.keys(updateData).length > 0) {
              await supabaseAdmin
                .from('identity_verifications')
                .update(updateData)
                .eq('id', verification.id);

              verification.status = newStatus;
              if (updateData.first_name_extracted) verification.first_name_extracted = updateData.first_name_extracted;
              if (updateData.last_name_extracted) verification.last_name_extracted = updateData.last_name_extracted;
            }
          } catch (e) {
            console.log('Could not get decision (session may still be in progress):', e);
          }
        }
      }

      // Get profile verification status
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('identity_verified, identity_verified_at')
        .eq('id', userId)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          verification,
          profileVerified: profile?.identity_verified || false,
          verifiedAt: profile?.identity_verified_at
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // ACTION: Handle decision webhook from Veriff
    // ============================================================
    if (action === 'webhook-decision') {
      const rawBody = JSON.stringify(webhookPayload);
      const signature = req.headers.get('x-hmac-signature') || '';
      
      // Verify webhook signature
      const isValid = await verifyWebhookSignature(rawBody, signature, veriffSharedSecret!);
      if (!isValid) {
        console.warn('Invalid webhook signature');
        // Continue anyway for now, but log the warning
      }

      console.log('Received Veriff decision webhook:', JSON.stringify(webhookPayload));

      const veriffSessionId = webhookPayload?.verification?.id;
      const vendorData = webhookPayload?.verification?.vendorData;
      const endUserId = webhookPayload?.verification?.endUserId;
      const status = webhookPayload?.verification?.status;
      const code = webhookPayload?.verification?.code;

      if (!veriffSessionId) {
        return new Response(
          JSON.stringify({ error: 'Invalid webhook payload' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find verification by Veriff session ID
      const { data: verifications } = await supabaseAdmin
        .from('identity_verifications')
        .select('*')
        .order('created_at', { ascending: false });

      const verification = verifications?.find(v => 
        v.verification_result?.veriff_session_id === veriffSessionId
      );

      if (!verification) {
        console.error('Verification not found for session:', veriffSessionId);
        return new Response(
          JSON.stringify({ error: 'Verification not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Determine status from Veriff response
      // Veriff status codes: 9001=approved, 9102=declined, 9103=resubmission_requested, 9104=expired, etc.
      let newStatus = 'pending';
      if (status === 'approved' || code === 9001) {
        newStatus = 'verified';
      } else if (status === 'declined' || code === 9102) {
        newStatus = 'rejected';
      } else if (status === 'resubmission_requested' || code === 9103) {
        newStatus = 'review_needed';
      } else if (status === 'expired' || code === 9104) {
        newStatus = 'rejected';
      }

      const person = webhookPayload?.verification?.person;
      const document = webhookPayload?.verification?.document;

      // Update verification record
      await supabaseAdmin
        .from('identity_verifications')
        .update({
          status: newStatus,
          first_name_extracted: person?.firstName,
          last_name_extracted: person?.lastName,
          document_type: document?.type,
          document_country: document?.country,
          verification_result: {
            ...verification.verification_result,
            veriff_webhook: webhookPayload
          }
        })
        .eq('id', verification.id);

      // Update profile if verified and not a registration verification
      if (newStatus === 'verified' && verification.user_id !== '00000000-0000-0000-0000-000000000000') {
        await supabaseAdmin
          .from('profiles')
          .update({
            identity_verified: true,
            identity_verified_at: new Date().toISOString()
          })
          .eq('id', verification.user_id);

        console.log(`User ${verification.user_id} identity verified successfully via webhook`);
      }

      return new Response(
        JSON.stringify({ success: true, status: newStatus }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // ACTION: Handle event webhook from Veriff
    // ============================================================
    if (action === 'webhook-event') {
      console.log('Received Veriff event webhook:', JSON.stringify(webhookPayload));

      // Event webhooks are informational - just log them
      const eventType = webhookPayload?.action;
      const veriffSessionId = webhookPayload?.id;

      console.log(`Veriff event: ${eventType} for session ${veriffSessionId}`);

      // We could update a status here if needed (e.g., mark as 'in_progress')

      return new Response(
        JSON.stringify({ success: true, received: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // ACTION: Admin refresh all pending Veriff sessions
    // ============================================================
    if (action === 'admin-refresh-all') {
      // Check admin access
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Non authentifié' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        return new Response(
          JSON.stringify({ error: 'Accès réservé aux administrateurs' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Admin refresh all Veriff sessions started by:', userId);

      // Get all pending/initiated verifications
      const { data: pendingVerifications, error: fetchError } = await supabaseAdmin
        .from('identity_verifications')
        .select('*')
        .in('status', ['initiated', 'pending'])
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching pending verifications:', fetchError);
        throw fetchError;
      }

      let updated = 0;
      let verified = 0;
      let rejected = 0;
      let errors: string[] = [];

      for (const verification of (pendingVerifications || [])) {
        const veriffSessionId = verification.verification_result?.veriff_session_id;
        if (!veriffSessionId) continue;

        try {
          const decision = await veriffRequest('GET', `/sessions/${veriffSessionId}/decision`);
          console.log(`Session ${veriffSessionId} status:`, decision.verification?.status);

          let newStatus = verification.status;
          let updateData: any = {};

          if (decision.verification?.status === 'approved') {
            newStatus = 'verified';
            verified++;
            updateData = {
              status: newStatus,
              first_name_extracted: decision.verification?.person?.firstName,
              last_name_extracted: decision.verification?.person?.lastName,
              document_type: decision.verification?.document?.type,
              document_country: decision.verification?.document?.country,
              verification_result: {
                ...verification.verification_result,
                veriff_decision: decision
              }
            };

            // Update profile if not registration verification
            if (verification.user_id !== '00000000-0000-0000-0000-000000000000') {
              await supabaseAdmin
                .from('profiles')
                .update({
                  identity_verified: true,
                  identity_verified_at: new Date().toISOString()
                })
                .eq('id', verification.user_id);
            }
          } else if (decision.verification?.status === 'declined' || decision.verification?.status === 'expired') {
            newStatus = 'rejected';
            rejected++;
            updateData = {
              status: newStatus,
              verification_result: {
                ...verification.verification_result,
                veriff_decision: decision,
                rejection_reason: decision.verification?.reason
              }
            };
          } else if (decision.verification?.status === 'resubmission_requested') {
            newStatus = 'review_needed';
            updateData = {
              status: newStatus,
              verification_result: {
                ...verification.verification_result,
                veriff_decision: decision
              }
            };
          }

          if (Object.keys(updateData).length > 0) {
            await supabaseAdmin
              .from('identity_verifications')
              .update(updateData)
              .eq('id', verification.id);
            updated++;
          }
        } catch (e: any) {
          console.log(`Could not get decision for session ${veriffSessionId}:`, e.message);
          errors.push(`Session ${veriffSessionId}: ${e.message}`);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Vérification terminée: ${updated} mis à jour, ${verified} vérifiés, ${rejected} rejetés`,
          total: pendingVerifications?.length || 0,
          updated,
          verified,
          rejected,
          errors: errors.length > 0 ? errors : undefined
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Action non reconnue' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in veriff-verification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
