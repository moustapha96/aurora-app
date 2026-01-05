import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentResult {
  documentId: string;
  fileName: string;
  userId: string;
  section: string;
  status: 'valid' | 'invalid' | 'suspicious' | 'error';
  reason: string;
  confidence?: number;
}

const DOCUMENT_SECTIONS = [
  { name: 'family', tableName: 'family_documents', bucketName: 'family-documents', documentType: 'family_document' },
  { name: 'business', tableName: 'business_documents', bucketName: 'business-documents', documentType: 'business_document' },
  { name: 'personal', tableName: 'personal_documents', bucketName: 'personal-documents', documentType: 'personal_document' },
  { name: 'network', tableName: 'network_documents', bucketName: 'network-documents', documentType: 'network_document' }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[AUTO-VERIFY] Starting verification for all sections...');

    const allResults: DocumentResult[] = [];
    let totalProcessed = 0, totalVerified = 0, totalRejected = 0, totalErrors = 0;

    for (const section of DOCUMENT_SECTIONS) {
      console.log(`[AUTO-VERIFY] Processing ${section.name}...`);

      const { data: documents, error } = await supabaseAdmin.from(section.tableName).select('*');
      if (error || !documents?.length) continue;

      const docIds = documents.map(d => d.id);
      const { data: existingVerifs } = await supabaseAdmin
        .from('document_verifications')
        .select('document_id, status')
        .eq('document_type', section.documentType)
        .in('document_id', docIds);

      const verifiedDocs = new Set(existingVerifs?.filter(v => v.status === 'verified' || v.status === 'rejected').map(v => v.document_id) || []);
      const docsToVerify = documents.filter(doc => !verifiedDocs.has(doc.id));

      for (const doc of docsToVerify) {
        totalProcessed++;
        const isImage = doc.file_type?.startsWith('image/') || doc.file_type === 'application/pdf';
        
        if (!isImage || !lovableApiKey) {
          const result: DocumentResult = { documentId: doc.id, fileName: doc.file_name, userId: doc.user_id, section: section.name, status: 'valid', reason: 'Accepté automatiquement', confidence: 1.0 };
          allResults.push(result);
          await supabaseAdmin.from('document_verifications').upsert({
            document_id: doc.id, document_type: section.documentType, user_id: doc.user_id,
            status: 'verified', verification_result: { reason: result.reason, confidence: 1.0 }, verified_at: new Date().toISOString()
          }, { onConflict: 'document_id,document_type' });
          totalVerified++;
          continue;
        }

        const { data: signedUrl } = await supabaseAdmin.storage.from(section.bucketName).createSignedUrl(doc.file_path, 3600);
        if (!signedUrl?.signedUrl) { totalErrors++; continue; }

        try {
          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [{ role: 'user', content: [
                { type: 'text', text: `Analyse ce document. Retourne JSON: {"status":"valid"|"invalid"|"suspicious","reason":"explication","confidence":0-1}` },
                { type: 'image_url', image_url: { url: signedUrl.signedUrl } }
              ]}]
            }),
          });

          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || '';
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { status: 'valid', reason: 'Analysé' };

          const dbStatus = parsed.status === 'valid' ? 'verified' : parsed.status === 'invalid' ? 'rejected' : 'review_needed';
          await supabaseAdmin.from('document_verifications').upsert({
            document_id: doc.id, document_type: section.documentType, user_id: doc.user_id,
            status: dbStatus, rejection_reason: parsed.status === 'invalid' ? parsed.reason : null,
            verification_result: { reason: parsed.reason, confidence: parsed.confidence }, verified_at: new Date().toISOString()
          }, { onConflict: 'document_id,document_type' });

          if (parsed.status === 'valid') totalVerified++; else totalRejected++;
          allResults.push({ documentId: doc.id, fileName: doc.file_name, userId: doc.user_id, section: section.name, ...parsed });
        } catch { totalErrors++; }
      }
    }

    return new Response(JSON.stringify({ success: true, message: `${totalProcessed} documents traités`, stats: { totalProcessed, totalVerified, totalRejected, totalErrors }, results: allResults }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[AUTO-VERIFY] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
