import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentAnalysis {
  documentId: string;
  fileName: string;
  userId: string;
  section: string;
  extractedContent: {
    documentType?: string;
    title?: string;
    names?: string[];
    dates?: string[];
    organizations?: string[];
    addresses?: string[];
    amounts?: string[];
    summary?: string;
    rawText?: string;
    language?: string;
  };
  status: 'analyzed' | 'error' | 'not_readable';
  errorMessage?: string;
  analyzedAt: string;
}

const DOCUMENT_SECTIONS = [
  { name: 'family', tableName: 'family_documents', bucketName: 'family-documents' },
  { name: 'business', tableName: 'business_documents', bucketName: 'business-documents' },
  { name: 'personal', tableName: 'personal_documents', bucketName: 'personal-documents' },
  { name: 'network', tableName: 'network_documents', bucketName: 'network-documents' }
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

    // Check if specific document requested
    const body = await req.json().catch(() => ({}));
    const { documentId, section: requestedSection } = body;

    console.log('[ANALYZE-SECTION-DOCS] Starting analysis...');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const allResults: DocumentAnalysis[] = [];
    let totalProcessed = 0;
    let totalAnalyzed = 0;
    let totalErrors = 0;

    // Get existing analyzed documents
    const { data: existingAnalyses } = await supabaseAdmin
      .from('admin_settings')
      .select('setting_key, setting_value')
      .like('setting_key', 'doc_analysis_%');

    const analyzedDocIds = new Set(
      (existingAnalyses || []).map(a => {
        const data = JSON.parse(a.setting_value || '{}');
        return data.documentId;
      }).filter(Boolean)
    );

    const sectionsToProcess = requestedSection 
      ? DOCUMENT_SECTIONS.filter(s => s.name === requestedSection)
      : DOCUMENT_SECTIONS;

    for (const section of sectionsToProcess) {
      console.log(`[ANALYZE-SECTION-DOCS] Processing ${section.name}...`);

      // Build query
      let query = supabaseAdmin.from(section.tableName).select('*');
      if (documentId) {
        query = query.eq('id', documentId);
      }
      
      const { data: documents, error } = await query;
      
      if (error) {
        console.error(`[ANALYZE-SECTION-DOCS] Error fetching ${section.name}:`, error);
        continue;
      }

      if (!documents?.length) continue;

      // Filter already analyzed (unless specific doc requested)
      const docsToAnalyze = documentId 
        ? documents 
        : documents.filter(doc => !analyzedDocIds.has(doc.id));

      console.log(`[ANALYZE-SECTION-DOCS] ${docsToAnalyze.length} documents to analyze in ${section.name}`);

      for (const doc of docsToAnalyze) {
        totalProcessed++;
        
        // Check if it's an image or PDF
        const isAnalyzable = doc.file_type?.startsWith('image/') || doc.file_type === 'application/pdf';
        
        if (!isAnalyzable) {
          console.log(`[ANALYZE-SECTION-DOCS] Skipping non-analyzable file: ${doc.file_name}`);
          continue;
        }

        try {
          // Get signed URL
          const { data: signedUrl } = await supabaseAdmin.storage
            .from(section.bucketName)
            .createSignedUrl(doc.file_path, 3600);

          if (!signedUrl?.signedUrl) {
            console.error(`[ANALYZE-SECTION-DOCS] Could not get signed URL for ${doc.file_name}`);
            totalErrors++;
            continue;
          }

          console.log(`[ANALYZE-SECTION-DOCS] Analyzing ${doc.file_name}...`);

          // Call Lovable AI for document analysis
          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [{
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Analyse ce document en détail et extrait toutes les informations pertinentes.
                    
Retourne le résultat au format JSON avec les champs suivants:
{
  "documentType": "type de document (carte d'identité, passeport, facture, contrat, certificat, lettre, etc.)",
  "title": "titre ou objet du document si visible",
  "names": ["liste des noms de personnes mentionnés"],
  "dates": ["liste des dates importantes trouvées"],
  "organizations": ["liste des organisations, entreprises, institutions mentionnées"],
  "addresses": ["adresses trouvées"],
  "amounts": ["montants financiers si présents"],
  "summary": "résumé du contenu du document en 2-3 phrases",
  "rawText": "texte brut extrait du document (max 500 caractères)",
  "language": "langue du document"
}

Si tu ne peux pas lire le document ou si c'est une image non-documentaire, indique-le dans le champ summary.`
                  },
                  {
                    type: 'image_url',
                    image_url: { url: signedUrl.signedUrl }
                  }
                ]
              }],
              temperature: 0.1,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[ANALYZE-SECTION-DOCS] AI API error:`, errorText);
            totalErrors++;
            continue;
          }

          const data = await response.json();
          const aiResponse = data.choices?.[0]?.message?.content;

          if (!aiResponse) {
            console.error(`[ANALYZE-SECTION-DOCS] No response from AI for ${doc.file_name}`);
            totalErrors++;
            continue;
          }

          // Parse JSON response
          let extractedContent;
          try {
            const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
            extractedContent = JSON.parse(jsonString.trim());
          } catch (e) {
            console.error(`[ANALYZE-SECTION-DOCS] Failed to parse AI response:`, aiResponse);
            extractedContent = { 
              summary: aiResponse.substring(0, 500),
              rawText: aiResponse.substring(0, 500)
            };
          }

          const analysisResult: DocumentAnalysis = {
            documentId: doc.id,
            fileName: doc.file_name,
            userId: doc.user_id,
            section: section.name,
            extractedContent,
            status: 'analyzed',
            analyzedAt: new Date().toISOString(),
          };

          // Save analysis result
          await supabaseAdmin
            .from('admin_settings')
            .upsert({
              setting_key: `doc_analysis_${doc.id}`,
              setting_value: JSON.stringify(analysisResult),
              description: `Analyse du document ${doc.file_name} (${section.name})`,
            }, { onConflict: 'setting_key' });

          allResults.push(analysisResult);
          totalAnalyzed++;
          console.log(`[ANALYZE-SECTION-DOCS] Successfully analyzed ${doc.file_name}`);

        } catch (error) {
          console.error(`[ANALYZE-SECTION-DOCS] Error analyzing ${doc.file_name}:`, error);
          
          const errorResult: DocumentAnalysis = {
            documentId: doc.id,
            fileName: doc.file_name,
            userId: doc.user_id,
            section: section.name,
            extractedContent: {},
            status: 'error',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            analyzedAt: new Date().toISOString(),
          };

          await supabaseAdmin
            .from('admin_settings')
            .upsert({
              setting_key: `doc_analysis_${doc.id}`,
              setting_value: JSON.stringify(errorResult),
              description: `Erreur analyse du document ${doc.file_name}`,
            }, { onConflict: 'setting_key' });

          allResults.push(errorResult);
          totalErrors++;
        }
      }
    }

    console.log(`[ANALYZE-SECTION-DOCS] Completed: ${totalAnalyzed} analyzed, ${totalErrors} errors`);

    return new Response(JSON.stringify({
      success: true,
      message: `${totalProcessed} documents traités, ${totalAnalyzed} analysés`,
      stats: {
        totalProcessed,
        totalAnalyzed,
        totalErrors,
      },
      results: allResults,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ANALYZE-SECTION-DOCS] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
