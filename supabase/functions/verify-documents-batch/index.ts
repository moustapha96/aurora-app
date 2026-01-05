import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyRequest {
  action: 'start-batch' | 'verify-single' | 'update-status' | 'get-pending' | 'notify-user';
  batchId?: string;
  documentVerificationId?: string;
  status?: string;
  rejectionReason?: string;
  userId?: string;
  documentId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Accès réservé aux administrateurs' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestBody: VerifyRequest = await req.json();
    const { action, batchId, documentVerificationId, status, rejectionReason, userId, documentId } = requestBody;

    console.log(`Document verification action: ${action}`, { userId: user.id, batchId, documentVerificationId });

    // Get all pending documents that need verification
    if (action === 'get-pending') {
      // Get all family documents that don't have a verification record
      const { data: familyDocs, error: familyError } = await supabaseAdmin
        .from('family_documents')
        .select('id, user_id, file_name, file_path, file_type, created_at');

      if (familyError) {
        console.error('Error fetching family documents:', familyError);
        throw familyError;
      }

      // Get existing verifications
      const { data: existingVerifications } = await supabaseAdmin
        .from('document_verifications')
        .select('document_id, status');

      const verificationMap = new Map(
        existingVerifications?.map(v => [v.document_id, v.status]) || []
      );

      // Get all identity verifications
      const { data: identityDocs } = await supabaseAdmin
        .from('identity_verifications')
        .select('id, user_id, document_url, document_type, status, created_at');

      // Get user profiles for names
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, first_name, last_name, avatar_url');

      const profileMap = new Map(
        profiles?.map(p => [p.id, p]) || []
      );

      // Format family documents
      const formattedFamilyDocs = (familyDocs || []).map(doc => ({
        id: doc.id,
        user_id: doc.user_id,
        document_type: 'family_document',
        file_name: doc.file_name,
        file_path: doc.file_path,
        file_type: doc.file_type,
        created_at: doc.created_at,
        verification_status: verificationMap.get(doc.id) || 'not_verified',
        user: profileMap.get(doc.user_id)
      }));

      // Format identity documents
      const formattedIdentityDocs = (identityDocs || []).map(doc => ({
        id: doc.id,
        user_id: doc.user_id,
        document_type: 'identity_document',
        file_name: doc.document_type || 'Pièce d\'identité',
        file_path: doc.document_url,
        file_type: 'image',
        created_at: doc.created_at,
        verification_status: doc.status,
        user: profileMap.get(doc.user_id)
      }));

      const allDocuments = [...formattedFamilyDocs, ...formattedIdentityDocs];

      return new Response(
        JSON.stringify({ 
          success: true, 
          documents: allDocuments,
          total: allDocuments.length 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Start a batch verification process
    if (action === 'start-batch') {
      // Get all unverified family documents
      const { data: familyDocs } = await supabaseAdmin
        .from('family_documents')
        .select('id, user_id, file_name, file_path');

      // Get existing verifications
      const { data: existingVerifications } = await supabaseAdmin
        .from('document_verifications')
        .select('document_id');

      const verifiedIds = new Set(existingVerifications?.map(v => v.document_id) || []);
      const unverifiedDocs = (familyDocs || []).filter(doc => !verifiedIds.has(doc.id));

      // Create batch record
      const { data: batch, error: batchError } = await supabaseAdmin
        .from('verification_batches')
        .insert({
          admin_id: user.id,
          status: 'in_progress',
          total_documents: unverifiedDocs.length,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Create verification records for each document
      const verificationRecords = unverifiedDocs.map(doc => ({
        user_id: doc.user_id,
        document_type: 'family_document',
        document_id: doc.id,
        document_path: doc.file_path,
        file_name: doc.file_name,
        status: 'pending'
      }));

      if (verificationRecords.length > 0) {
        const { error: insertError } = await supabaseAdmin
          .from('document_verifications')
          .insert(verificationRecords);

        if (insertError) {
          console.error('Error creating verification records:', insertError);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          batchId: batch.id,
          totalDocuments: unverifiedDocs.length,
          message: `Batch de vérification créé pour ${unverifiedDocs.length} documents`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update single document verification status
    if (action === 'update-status') {
      if (!documentVerificationId || !status) {
        return new Response(
          JSON.stringify({ error: 'ID de vérification et statut requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updateData: any = {
        status,
        verified_by: user.id,
        verified_at: new Date().toISOString()
      };

      if (rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error: updateError } = await supabaseAdmin
        .from('document_verifications')
        .update(updateData)
        .eq('id', documentVerificationId);

      if (updateError) throw updateError;

      // Get verification details for notification
      const { data: verification } = await supabaseAdmin
        .from('document_verifications')
        .select('user_id, file_name, document_type')
        .eq('id', documentVerificationId)
        .single();

      if (verification) {
        // Create notification for user
        const notificationType = status === 'verified' ? 'document_verified' : 
                                 status === 'rejected' ? 'document_rejected' : 'document_review';
        
        const notificationTitle = status === 'verified' ? 'Document vérifié' :
                                  status === 'rejected' ? 'Document rejeté' : 'Document en révision';

        const notificationMessage = status === 'verified' 
          ? `Votre document "${verification.file_name}" a été vérifié avec succès.`
          : status === 'rejected'
          ? `Votre document "${verification.file_name}" a été rejeté. ${rejectionReason || ''}`
          : `Votre document "${verification.file_name}" nécessite une révision.`;

        await supabaseAdmin
          .from('user_notifications')
          .insert({
            user_id: verification.user_id,
            type: notificationType,
            title: notificationTitle,
            message: notificationMessage,
            related_document_id: documentVerificationId
          });

        // Update notification sent status
        await supabaseAdmin
          .from('document_verifications')
          .update({
            notification_sent: true,
            notification_sent_at: new Date().toISOString()
          })
          .eq('id', documentVerificationId);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Statut mis à jour et notification envoyée' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify single document (manual mode)
    if (action === 'verify-single') {
      if (!documentId || !userId) {
        return new Response(
          JSON.stringify({ error: 'ID document et ID utilisateur requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get document details
      const { data: docDetails } = await supabaseAdmin
        .from('family_documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (!docDetails) {
        return new Response(
          JSON.stringify({ error: 'Document non trouvé' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get signed URL for the document
      const { data: signedUrlData } = await supabaseAdmin.storage
        .from('family-documents')
        .createSignedUrl(docDetails.file_path, 3600);

      return new Response(
        JSON.stringify({
          success: true,
          mode: 'manual',
          documentUrl: signedUrlData?.signedUrl,
          message: 'Document prêt pour vérification manuelle'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Notify user about document status
    if (action === 'notify-user') {
      if (!userId || !documentId) {
        return new Response(
          JSON.stringify({ error: 'ID utilisateur et ID document requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get verification status
      const { data: verification } = await supabaseAdmin
        .from('document_verifications')
        .select('*')
        .eq('document_id', documentId)
        .single();

      if (!verification) {
        return new Response(
          JSON.stringify({ error: 'Vérification non trouvée' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create notification
      const notificationType = verification.status === 'verified' ? 'document_verified' : 
                               verification.status === 'rejected' ? 'document_rejected' : 'document_review';
      
      const notificationTitle = verification.status === 'verified' ? 'Document vérifié' :
                                verification.status === 'rejected' ? 'Document rejeté' : 'Document en révision';

      const { error: notifError } = await supabaseAdmin
        .from('user_notifications')
        .insert({
          user_id: userId,
          type: notificationType,
          title: notificationTitle,
          message: `Votre document "${verification.file_name}" a été traité.`,
          related_document_id: verification.id
        });

      if (notifError) throw notifError;

      return new Response(
        JSON.stringify({ success: true, message: 'Notification envoyée' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Action non reconnue' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in verify-documents-batch:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
