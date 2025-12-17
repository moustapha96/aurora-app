import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cvText, linkedinUrl } = await req.json();

    if ((!cvText || cvText.trim().length === 0) && (!linkedinUrl || linkedinUrl.trim().length === 0)) {
      return new Response(JSON.stringify({ error: 'CV text or LinkedIn URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const inputText = cvText || `Analyse ce profil LinkedIn: ${linkedinUrl}`;

    const systemPrompt = `Tu es un expert en analyse de CV et profils professionnels pour extraire des informations business d'élite.
    
Analyse le contenu fourni et extrais les informations suivantes au format JSON strict:

{
  "bio_executive": "Une bio exécutive de 2-3 phrases résumant le parcours et la position actuelle",
  "achievements_text": "Les 3-5 réalisations majeures sous forme de liste à puces",
  "vision_text": "La vision professionnelle et les ambitions futures",
  "timeline": [
    { "year": "Année", "title": "Poste", "company": "Entreprise", "description": "Description courte" }
  ],
  "press": [
    { "title": "Titre article/distinction", "source": "Source/Média", "year": "Année", "distinction_type": "article/prix/mention" }
  ],
  "projects": [
    { "title": "Nom du projet", "description": "Description", "status": "En cours/Terminé" }
  ]
}

Instructions:
- Crée une bio exécutive élégante et professionnelle
- Identifie les réalisations marquantes (chiffres, acquisitions, créations d'emplois, levées de fonds)
- Déduis une vision basée sur le parcours
- Extrais le parcours chronologique (postes, entreprises)
- Trouve les mentions presse, distinctions, prix
- Liste les projets actuels ou passés significatifs

Si une catégorie n'a pas d'informations, retourne une valeur par défaut appropriée.
Réponds UNIQUEMENT avec le JSON, sans texte additionnel.`;

    console.log("Calling AI gateway for business CV parsing...");

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
          { role: "user", content: `Voici le contenu à analyser:\n\n${inputText}` }
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
    
    console.log("AI response received:", content.substring(0, 200));
    
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
        bio_executive: "Profil en cours d'analyse...",
        achievements_text: "",
        vision_text: "",
        timeline: [],
        press: [],
        projects: []
      };
    }

    return new Response(JSON.stringify({ 
      success: true,
      data: extractedData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in parse-cv-business:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
