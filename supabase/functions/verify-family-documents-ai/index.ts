import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyRequest {
  action: 'verify-all' | 'verify-single' | 'delete-document' | 'retry-verification';
  documentId?: string;
}

interface DocumentResult {
  documentId: string;
  fileName: string;
  userId: string;
  userName: string;
  status: 'valid' | 'invalid' | 'suspicious' | 'error';
  reason: string;
  details?: string;
  confidence?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

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
    const { action, documentId } = requestBody;

    console.log(`Family document verification action: ${action}`, { userId: user.id, documentId });

    // ============================================================
    // ACTION: Delete a document
    // ============================================================
    if (action === 'delete-document') {
      if (!documentId) {
        return new Response(
          JSON.stringify({ error: 'ID du document requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get document info first
      const { data: doc, error: docError } = await supabaseAdmin
        .from('family_documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (docError || !doc) {
        return new Response(
          JSON.stringify({ error: 'Document non trouvé' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete from storage
      const { error: storageError } = await supabaseAdmin.storage
        .from('family-documents')
        .remove([doc.file_path]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // Delete from database
      const { error: deleteError } = await supabaseAdmin
        .from('family_documents')
        .delete()
        .eq('id', documentId);

      if (deleteError) {
        throw deleteError;
      }

      // Delete verification record if exists
      await supabaseAdmin
        .from('document_verifications')
        .delete()
        .eq('document_id', documentId);

      return new Response(
        JSON.stringify({ success: true, message: 'Document supprimé' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // Helper function to analyze a document with AI
    // ============================================================
    async function analyzeDocument(docId: string, filePath: string, fileName: string, userId: string): Promise<DocumentResult> {
      // Get user name
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

      const userName = profile ? `${profile.first_name} ${profile.last_name}` : 'Utilisateur inconnu';

      // Get signed URL for the document
      const { data: signedUrlData, error: urlError } = await supabaseAdmin.storage
        .from('family-documents')
        .createSignedUrl(filePath, 3600);

      if (urlError || !signedUrlData?.signedUrl) {
        console.error('Error getting signed URL:', urlError);
        return {
          documentId: docId,
          fileName,
          userId,
          userName,
          status: 'error',
          reason: 'Impossible d\'accéder au document'
        };
      }

      // Check if it's an image
      const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName);
      const isPdf = /\.pdf$/i.test(fileName);

      if (!isImage && !isPdf) {
        // For non-image documents, we can't analyze with vision
        return {
          documentId: docId,
          fileName,
          userId,
          userName,
          status: 'valid',
          reason: 'Document accepté (format non analysable par IA)',
          details: 'Les documents Word, Excel et autres formats ne peuvent pas être analysés visuellement.'
        };
      }

      if (!lovableApiKey) {
        return {
          documentId: docId,
          fileName,
          userId,
          userName,
          status: 'error',
          reason: 'Service IA non configuré'
        };
      }

      try {
        // Call Lovable AI to analyze the document
        const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Analysez ce document familial et déterminez s'il est valide et approprié.

Critères d'évaluation:
1. Le document est-il lisible et de bonne qualité?
2. Le contenu semble-t-il authentique (pas de falsification évidente)?
3. Le document est-il approprié pour un dossier familial (pas de contenu offensant, illégal ou inapproprié)?
4. Y a-t-il des signes de manipulation d'image?

Répondez UNIQUEMENT avec un objet JSON dans ce format exact:
{
  "status": "valid" | "invalid" | "suspicious",
  "confidence": 0-100,
  "reason": "Explication courte en français (max 50 mots)",
  "details": "Détails supplémentaires si nécessaire"
}

Si vous ne pouvez pas analyser le document, utilisez status "error" avec une explication.`
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: signedUrlData.signedUrl
                    }
                  }
                ]
              }
            ],
            max_tokens: 500,
            temperature: 0.1
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('AI API error:', errorText);
          return {
            documentId: docId,
            fileName,
            userId,
            userName,
            status: 'error',
            reason: 'Erreur lors de l\'analyse IA'
          };
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return {
            documentId: docId,
            fileName,
            userId,
            userName,
            status: result.status || 'error',
            reason: result.reason || 'Analyse complète',
            details: result.details,
            confidence: result.confidence
          };
        }

        return {
          documentId: docId,
          fileName,
          userId,
          userName,
          status: 'valid',
          reason: 'Aucun problème détecté'
        };

      } catch (error) {
        console.error('Error analyzing document:', error);
        return {
          documentId: docId,
          fileName,
          userId,
          userName,
          status: 'error',
          reason: error instanceof Error ? error.message : 'Erreur inconnue'
        };
      }
    }

    // ============================================================
    // ACTION: Verify a single document
    // ============================================================
    if (action === 'verify-single' || action === 'retry-verification') {
      if (!documentId) {
        return new Response(
          JSON.stringify({ error: 'ID du document requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get document
      const { data: doc, error: docError } = await supabaseAdmin
        .from('family_documents')
        .select('id, user_id, file_name, file_path')
        .eq('id', documentId)
        .single();

      if (docError || !doc) {
        return new Response(
          JSON.stringify({ error: 'Document non trouvé' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await analyzeDocument(doc.id, doc.file_path, doc.file_name, doc.user_id);

      // Update or create verification record
      const verificationData = {
        user_id: doc.user_id,
        document_type: 'family_document',
        document_id: doc.id,
        document_path: doc.file_path,
        file_name: doc.file_name,
        status: result.status === 'valid' ? 'verified' : result.status === 'invalid' ? 'rejected' : 'review_needed',
        verification_result: {
          ai_analysis: true,
          status: result.status,
          reason: result.reason,
          details: result.details,
          confidence: result.confidence,
          analyzed_at: new Date().toISOString()
        },
        verified_by: user.id,
        verified_at: new Date().toISOString()
      };

      // Check if verification exists
      const { data: existingVerif } = await supabaseAdmin
        .from('document_verifications')
        .select('id')
        .eq('document_id', documentId)
        .maybeSingle();

      if (existingVerif) {
        await supabaseAdmin
          .from('document_verifications')
          .update(verificationData)
          .eq('id', existingVerif.id);
      } else {
        await supabaseAdmin
          .from('document_verifications')
          .insert(verificationData);
      }

      return new Response(
        JSON.stringify({ success: true, result }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================
    // ACTION: Verify all family documents
    // ============================================================
    if (action === 'verify-all') {
      console.log('Starting verification of all family documents');

      // Get all family documents
      const { data: familyDocs, error: docsError } = await supabaseAdmin
        .from('family_documents')
        .select('id, user_id, file_name, file_path, created_at')
        .order('created_at', { ascending: false });

      if (docsError) {
        throw docsError;
      }

      if (!familyDocs || familyDocs.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Aucun document à vérifier',
            results: [],
            stats: { total: 0, valid: 0, invalid: 0, suspicious: 0, error: 0 }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const results: DocumentResult[] = [];
      const stats = { total: familyDocs.length, valid: 0, invalid: 0, suspicious: 0, error: 0 };

      // Process documents in batches to avoid rate limits
      const batchSize = 5;
      for (let i = 0; i < familyDocs.length; i += batchSize) {
        const batch = familyDocs.slice(i, i + batchSize);
        
        const batchResults = await Promise.all(
          batch.map(doc => analyzeDocument(doc.id, doc.file_path, doc.file_name, doc.user_id))
        );

        for (const result of batchResults) {
          results.push(result);
          stats[result.status]++;

          // Update verification record
          const verificationData = {
            user_id: result.userId,
            document_type: 'family_document',
            document_id: result.documentId,
            file_name: result.fileName,
            status: result.status === 'valid' ? 'verified' : result.status === 'invalid' ? 'rejected' : 'review_needed',
            verification_result: {
              ai_analysis: true,
              status: result.status,
              reason: result.reason,
              details: result.details,
              confidence: result.confidence,
              analyzed_at: new Date().toISOString()
            },
            verified_by: user.id,
            verified_at: new Date().toISOString()
          };

          // Upsert verification
          const { data: existingVerif } = await supabaseAdmin
            .from('document_verifications')
            .select('id')
            .eq('document_id', result.documentId)
            .maybeSingle();

          if (existingVerif) {
            await supabaseAdmin
              .from('document_verifications')
              .update(verificationData)
              .eq('id', existingVerif.id);
          } else {
            await supabaseAdmin
              .from('document_verifications')
              .insert(verificationData);
          }
        }

        // Small delay between batches
        if (i + batchSize < familyDocs.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Vérification terminée: ${stats.valid} valides, ${stats.invalid} invalides, ${stats.suspicious} suspects, ${stats.error} erreurs`,
          results,
          stats
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Action non reconnue' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in verify-family-documents-ai:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
