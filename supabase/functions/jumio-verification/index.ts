import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JumioRequest {
  action: 'initiate' | 'initiate-registration' | 'status' | 'callback' | 'check-registration';
  verificationId?: string;
  callbackData?: any;
  registrationData?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  registrationToken?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const jumioApiToken = Deno.env.get('JUMIO_API_TOKEN');
    const jumioApiSecret = Deno.env.get('JUMIO_API_SECRET');
    const jumioBaseUrl = Deno.env.get('JUMIO_BASE_URL') || 'https://api.amer-1.jumio.ai';

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

    const requestBody: JumioRequest = await req.json();
    const { action, verificationId, callbackData, registrationData, registrationToken } = requestBody;
    console.log(`Jumio verification action: ${action}`, { userId, verificationId });

    // Check if Jumio is configured
    if (!jumioApiToken || !jumioApiSecret) {
      console.error('Jumio API credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Service de vérification non configuré. Contactez l\'administrateur.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Basic Auth header for Jumio
    const jumioAuth = btoa(`${jumioApiToken}:${jumioApiSecret}`);

    // New action for registration verification (no auth required)
    if (action === 'initiate-registration') {
      if (!registrationData?.firstName || !registrationData?.lastName || !registrationData?.email) {
        return new Response(
          JSON.stringify({ error: 'Données d\'inscription incomplètes' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate a unique registration token
      const regToken = crypto.randomUUID();
      const customerReference = `reg_${regToken}`;

      console.log('Initiating Jumio verification for registration:', customerReference);

      // Create Jumio account/workflow for registration
      const jumioResponse = await fetch(`${jumioBaseUrl}/api/v1/accounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${jumioAuth}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Aurora-Society/1.0'
        },
        body: JSON.stringify({
          customerInternalReference: customerReference,
          userReference: `${registrationData.firstName} ${registrationData.lastName}`,
          workflowDefinition: {
            key: 10164 // Standard ID verification workflow
          },
          callbackUrl: `${supabaseUrl}/functions/v1/jumio-verification`,
          tokenLifetime: '30m',
          web: {
            successUrl: `${Deno.env.get('SITE_URL') || 'https://preview--e6cb71785bb7428786ce0e9ee3ec0082.lovable.app'}/register?verification=success&token=${regToken}`,
            errorUrl: `${Deno.env.get('SITE_URL') || 'https://preview--e6cb71785bb7428786ce0e9ee3ec0082.lovable.app'}/register?verification=error&token=${regToken}`
          }
        })
      });

      if (!jumioResponse.ok) {
        const errorText = await jumioResponse.text();
        console.error('Jumio API error:', jumioResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: 'Erreur lors de l\'initialisation de la vérification' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const jumioData = await jumioResponse.json();
      console.log('Jumio account created for registration:', jumioData.account?.id);

      // Store verification record without user_id (will be linked after registration)
      const { data: verification, error: insertError } = await supabaseAdmin
        .from('identity_verifications')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // Placeholder for registration
          jumio_account_id: jumioData.account?.id,
          jumio_workflow_execution_id: jumioData.workflowExecution?.id,
          status: 'initiated',
          verification_type: 'registration',
          verification_result: {
            registration_token: regToken,
            registration_email: registrationData.email,
            registration_first_name: registrationData.firstName,
            registration_last_name: registrationData.lastName
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
          redirectUrl: jumioData.web?.href,
          jumioAccountId: jumioData.account?.id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check registration verification status
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

    if (action === 'initiate') {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Non authentifié' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user profile for reference
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .maybeSingle();

      // Create Jumio account/workflow
      const jumioResponse = await fetch(`${jumioBaseUrl}/api/v1/accounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${jumioAuth}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Aurora-Society/1.0'
        },
        body: JSON.stringify({
          customerInternalReference: userId,
          userReference: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || userId,
          workflowDefinition: {
            key: 10164 // Standard ID verification workflow
          },
          callbackUrl: `${supabaseUrl}/functions/v1/jumio-verification`,
          tokenLifetime: '30m',
          web: {
            successUrl: `${Deno.env.get('SITE_URL') || supabaseUrl}/settings?verification=success`,
            errorUrl: `${Deno.env.get('SITE_URL') || supabaseUrl}/settings?verification=error`
          }
        })
      });

      if (!jumioResponse.ok) {
        const errorText = await jumioResponse.text();
        console.error('Jumio API error:', jumioResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: 'Erreur lors de l\'initialisation de la vérification' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const jumioData = await jumioResponse.json();
      console.log('Jumio account created:', jumioData.account?.id);

      // Store verification record
      const { data: verification, error: insertError } = await supabaseAdmin
        .from('identity_verifications')
        .insert({
          user_id: userId,
          jumio_account_id: jumioData.account?.id,
          jumio_workflow_execution_id: jumioData.workflowExecution?.id,
          status: 'initiated',
          verification_type: 'id_document'
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
          redirectUrl: jumioData.web?.href,
          jumioAccountId: jumioData.account?.id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
        .select('*')
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

      // Also check profile verification status
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

    if (action === 'callback') {
      // Handle Jumio webhook callback
      console.log('Received Jumio callback:', JSON.stringify(callbackData));

      if (!callbackData?.account?.id || !callbackData?.workflowExecution?.id) {
        console.error('Invalid callback data');
        return new Response(
          JSON.stringify({ error: 'Invalid callback data' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find verification by Jumio IDs
      const { data: verification } = await supabaseAdmin
        .from('identity_verifications')
        .select('*')
        .eq('jumio_account_id', callbackData.account.id)
        .eq('jumio_workflow_execution_id', callbackData.workflowExecution.id)
        .maybeSingle();

      if (!verification) {
        console.error('Verification not found for callback');
        return new Response(
          JSON.stringify({ error: 'Verification not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Determine status from Jumio response
      const decision = callbackData.decision?.type;
      let newStatus = 'pending';
      
      if (decision === 'PASSED') {
        newStatus = 'verified';
      } else if (decision === 'REJECTED' || decision === 'NOT_EXECUTED') {
        newStatus = 'rejected';
      } else if (decision === 'WARNING') {
        newStatus = 'review_needed';
      }

      // Extract identity data if available
      const extractedData = callbackData.capabilities?.extraction?.data;

      // Update verification record
      await supabaseAdmin
        .from('identity_verifications')
        .update({
          status: newStatus,
          first_name_extracted: extractedData?.firstName,
          last_name_extracted: extractedData?.lastName,
          document_type: extractedData?.idType,
          document_country: extractedData?.idCountry,
          verification_result: {
            ...verification.verification_result,
            jumio_callback: callbackData
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

        console.log(`User ${verification.user_id} identity verified successfully`);
      }

      return new Response(
        JSON.stringify({ success: true, status: newStatus }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Action non reconnue' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in jumio-verification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
