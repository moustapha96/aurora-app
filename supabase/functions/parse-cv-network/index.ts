import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cvText } = await req.json();

    if (!cvText || cvText.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'CV text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Tu es un expert en analyse de CV pour extraire des informations de réseau professionnel d'élite.
    
Analyse le CV fourni et extrais les informations suivantes au format JSON strict:

{
  "media": [
    { "title": "Titre", "platform": "Plateforme", "description": "Description", "url": "" }
  ],
  "events": [
    { "title": "Nom événement", "event_type": "Type", "location": "Lieu", "date": "", "description": "Description" }
  ],
  "influence": [
    { "title": "Titre", "category": "Catégorie", "metric": "Métrique", "value": "Valeur", "description": "Description" }
  ],
  "philanthropy": [
    { "title": "Titre", "organization": "Organisation", "role": "Rôle", "cause": "Cause", "description": "Description" }
  ],
  "clubs": [
    { "title": "Nom club", "club_type": "Type", "role": "Rôle", "since_year": "Année", "description": "Description" }
  ],
  "ambitions": [
    { "title": "Titre", "category": "Catégorie", "timeline": "Horizon", "description": "Description" }
  ]
}

Instructions:
- Extrais les apparitions médiatiques, interviews, publications
- Identifie les événements organisés ou auxquels la personne a participé
- Détecte les métriques d'influence (followers, citations, récompenses)
- Trouve les engagements philanthropiques et caritatifs
- Liste les clubs, associations et cercles professionnels
- Déduis les ambitions professionnelles basées sur le parcours

Si une catégorie n'a pas d'informations, retourne un tableau vide pour cette catégorie.
Réponds UNIQUEMENT avec le JSON, sans texte additionnel.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Voici le contenu du CV à analyser:\n\n${cvText}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse the JSON response
    let extractedData;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      extractedData = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      extractedData = {
        media: [],
        events: [],
        influence: [],
        philanthropy: [],
        clubs: [],
        ambitions: []
      };
    }

    return new Response(JSON.stringify({ 
      success: true,
      data: extractedData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in parse-cv-network:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
