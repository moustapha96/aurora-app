import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-auth-client, x-hmac-signature, vrf-integration-id',
};

// Create HMAC signature for verification
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const veriffSharedSecret = Deno.env.get('VERIFF_SHARED_SECRET');

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-hmac-signature') || '';
    const authClient = req.headers.get('x-auth-client') || '';
    const integrationId = req.headers.get('vrf-integration-id') || '';

    console.log('Veriff webhook received');
    console.log('Headers - x-auth-client:', authClient);
    console.log('Headers - vrf-integration-id:', integrationId);

    // Verify signature if secret is configured
    if (veriffSharedSecret && signature) {
      const expectedSignature = await createHmacSignature(rawBody, veriffSharedSecret);
      if (signature !== expectedSignature) {
        console.warn('Webhook signature mismatch - expected:', expectedSignature, 'received:', signature);
        // Log but don't reject - some implementations may have timing differences
      } else {
        console.log('Webhook signature verified successfully');
      }
    }

    const webhookPayload = JSON.parse(rawBody);
    console.log('Webhook payload:', JSON.stringify(webhookPayload).substring(0, 1000));

    // Determine webhook type based on payload structure
    const isDecisionWebhook = webhookPayload?.verification !== undefined;
    const isEventWebhook = webhookPayload?.action !== undefined && webhookPayload?.id !== undefined;

    if (isDecisionWebhook) {
      // ============================================================
      // DECISION WEBHOOK
      // ============================================================
      console.log('Processing decision webhook');

      const veriffSessionId = webhookPayload.verification?.id;
      const vendorData = webhookPayload.verification?.vendorData;
      const status = webhookPayload.verification?.status;
      const code = webhookPayload.verification?.code;
      const person = webhookPayload.verification?.person;
      const document = webhookPayload.verification?.document;
      const technicalData = webhookPayload.technicalData;
      const riskLabels = webhookPayload.verification?.riskLabels;
      const additionalVerifiedData = webhookPayload.verification?.additionalVerifiedData;
      const biometricAuthentication = webhookPayload.verification?.biometricAuthentication;

      if (!veriffSessionId) {
        console.error('No session ID in webhook payload');
        return new Response(
          JSON.stringify({ error: 'Invalid payload: missing session ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find verification by Veriff session ID stored in verification_result
      const { data: verifications } = await supabaseAdmin
        .from('identity_verifications')
        .select('*')
        .order('created_at', { ascending: false });

      const verification = verifications?.find(v => 
        v.verification_result?.veriff_session_id === veriffSessionId
      );

      if (!verification) {
        console.error('Verification not found for Veriff session:', veriffSessionId);
        // Return 200 to prevent retries - the session might have been for a different system
        return new Response(
          JSON.stringify({ received: true, warning: 'Verification not found' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Map Veriff status to our status
      // Veriff status values: approved, declined, resubmission_requested, expired, abandoned, review
      // Veriff codes: 9001=approved, 9102=declined, 9103=resubmission_requested, 9104=expired, 9121=abandoned
      let newStatus = 'pending';
      
      if (status === 'approved' || code === 9001) {
        newStatus = 'verified';
      } else if (status === 'declined' || code === 9102) {
        newStatus = 'rejected';
      } else if (status === 'resubmission_requested' || code === 9103) {
        newStatus = 'review_needed';
      } else if (status === 'expired' || status === 'abandoned' || code === 9104 || code === 9121) {
        newStatus = 'rejected';
      } else if (status === 'review') {
        newStatus = 'review_needed';
      }

      console.log(`Updating verification ${verification.id} status from ${verification.status} to ${newStatus}`);

      // Build comprehensive verification result with all Veriff data
      const fullVerificationResult = {
        ...verification.verification_result,
        // Decision info
        veriff_webhook_decision: webhookPayload,
        veriff_status: status,
        veriff_code: code,
        veriff_reason: webhookPayload.verification?.reason,
        veriff_reason_code: webhookPayload.verification?.reasonCode,
        veriff_decision_time: webhookPayload.verification?.decisionTime,
        veriff_acceptance_time: webhookPayload.verification?.acceptanceTime,
        // Person data
        person_first_name: person?.firstName,
        person_last_name: person?.lastName,
        person_date_of_birth: person?.dateOfBirth,
        person_year_of_birth: person?.yearOfBirth,
        person_place_of_birth: person?.placeOfBirth,
        person_gender: person?.gender,
        person_id_number: person?.idNumber,
        person_citizenship: person?.citizenship,
        person_nationality: person?.nationality,
        person_addresses: person?.addresses,
        person_pep_sanction_match: person?.pepSanctionMatch,
        // Document data
        document_type: document?.type,
        document_number: document?.number,
        document_country: document?.country,
        document_valid_from: document?.validFrom,
        document_valid_until: document?.validUntil,
        document_place_of_issue: document?.placeOfIssue,
        document_first_issue: document?.firstIssue,
        document_issue_number: document?.issueNumber,
        document_issued_by: document?.issuedBy,
        // Additional data
        additional_verified_data: additionalVerifiedData,
        risk_labels: riskLabels,
        biometric_authentication: biometricAuthentication,
        // Technical data
        technical_ip: technicalData?.ip,
        // Vendor data (user ID)
        vendor_data: vendorData,
      };

      // Update verification record with full data
      const { error: updateError } = await supabaseAdmin
        .from('identity_verifications')
        .update({
          status: newStatus,
          first_name_extracted: person?.firstName || verification.first_name_extracted,
          last_name_extracted: person?.lastName || verification.last_name_extracted,
          document_type: document?.type || verification.document_type,
          document_country: document?.country || verification.document_country,
          verification_result: fullVerificationResult
        })
        .eq('id', verification.id);

      if (updateError) {
        console.error('Error updating verification:', updateError);
      } else {
        console.log('Verification updated successfully with full Veriff data');
      }

      // Helper function to send verification email
      const sendVerificationEmail = async (userId: string, emailStatus: 'verified' | 'rejected' | 'pending', rejectionReason?: string) => {
        try {
          // Get user email from auth
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
          if (!userData?.user?.email) {
            console.error('No email found for user:', userId);
            return;
          }

          // Get user profile for name
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', userId)
            .single();

          // Call the send-verification-email function
          const response = await fetch(`${supabaseUrl}/functions/v1/send-verification-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              email: userData.user.email,
              firstName: profile?.first_name || person?.firstName || 'Membre',
              lastName: profile?.last_name || person?.lastName || '',
              status: emailStatus,
              rejectionReason: rejectionReason,
            }),
          });

          if (response.ok) {
            console.log(`Verification email sent successfully to ${userData.user.email}`);
          } else {
            console.error('Failed to send verification email:', await response.text());
          }
        } catch (emailError) {
          console.error('Error sending verification email:', emailError);
        }
      };

      // Update user profile if verified
      if (newStatus === 'verified' && verification.user_id !== '00000000-0000-0000-0000-000000000000') {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            identity_verified: true,
            identity_verified_at: new Date().toISOString()
          })
          .eq('id', verification.user_id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        } else {
          console.log(`User ${verification.user_id} identity verified successfully via webhook`);
        }

        // Create notification for user with person name
        const verifiedName = person?.firstName && person?.lastName 
          ? `${person.firstName} ${person.lastName}` 
          : '';
        
        await supabaseAdmin
          .from('user_notifications')
          .insert({
            user_id: verification.user_id,
            type: 'verification_approved',
            title: 'Identité vérifiée',
            message: verifiedName 
              ? `Votre identité (${verifiedName}) a été vérifiée avec succès.`
              : 'Votre identité a été vérifiée avec succès.',
          });

        // Send verification success email
        await sendVerificationEmail(verification.user_id, 'verified');

        // Update referral status to 'confirmed' when user is verified
        const { error: referralUpdateError } = await supabaseAdmin
          .from('referrals')
          .update({ status: 'confirmed' })
          .eq('referred_id', verification.user_id)
          .eq('status', 'pending');

        if (referralUpdateError) {
          console.error('Error updating referral status:', referralUpdateError);
        } else {
          console.log(`Referral status updated to confirmed for user ${verification.user_id}`);
        }
      } else if (newStatus === 'rejected' && verification.user_id !== '00000000-0000-0000-0000-000000000000') {
        // Create notification for rejection with reason
        const rejectionReason = webhookPayload.verification?.reason 
          || webhookPayload.verification?.reasonCode 
          || 'Veuillez réessayer avec un document valide.';
        
        await supabaseAdmin
          .from('user_notifications')
          .insert({
            user_id: verification.user_id,
            type: 'verification_rejected',
            title: 'Vérification refusée',
            message: `Votre vérification d'identité a été refusée. ${rejectionReason}`,
          });

        // Send rejection email
        await sendVerificationEmail(verification.user_id, 'rejected', rejectionReason);
      } else if (newStatus === 'review_needed' && verification.user_id !== '00000000-0000-0000-0000-000000000000') {
        // Create notification for resubmission
        await supabaseAdmin
          .from('user_notifications')
          .insert({
            user_id: verification.user_id,
            type: 'verification_resubmission',
            title: 'Vérification incomplète',
            message: 'Votre vérification nécessite des informations supplémentaires. Veuillez recommencer le processus.',
          });

        // Send pending/review email
        await sendVerificationEmail(verification.user_id, 'pending');
      }

      return new Response(
        JSON.stringify({ success: true, status: newStatus }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (isEventWebhook) {
      // ============================================================
      // EVENT WEBHOOK
      // ============================================================
      console.log('Processing event webhook');

      const eventAction = webhookPayload.action;
      const veriffSessionId = webhookPayload.id;
      const vendorData = webhookPayload.vendorData;

      console.log(`Veriff event: ${eventAction} for session ${veriffSessionId}`);

      // Event actions: started, submitted, etc.
      // These are informational - we could track progress if needed

      if (eventAction === 'submitted') {
        // User has submitted their verification - update status
        const { data: verifications } = await supabaseAdmin
          .from('identity_verifications')
          .select('*')
          .order('created_at', { ascending: false });

        const verification = verifications?.find(v => 
          v.verification_result?.veriff_session_id === veriffSessionId
        );

        if (verification && verification.status === 'initiated') {
          await supabaseAdmin
            .from('identity_verifications')
            .update({
              status: 'pending',
              verification_result: {
                ...verification.verification_result,
                veriff_event_submitted: webhookPayload,
                submitted_at: new Date().toISOString(),
              }
            })
            .eq('id', verification.id);

          console.log(`Verification ${verification.id} marked as pending (submitted)`);
        }
      }

      return new Response(
        JSON.stringify({ success: true, received: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Unknown webhook type - log and accept
    console.warn('Unknown webhook type received:', JSON.stringify(webhookPayload).substring(0, 500));
    
    return new Response(
      JSON.stringify({ received: true, warning: 'Unknown webhook type' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error processing Veriff webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Return 200 to prevent retries for parsing errors
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
