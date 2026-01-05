import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { module, currentContent } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const modulePrompts: Record<string, string> = {
      lineage: "Génère une description élégante des origines familiales et de la lignée, avec un ton narratif et respectueux des traditions.",
      close: "Décris la famille proche avec chaleur et distinction, en soulignant les liens et les parcours de chacun.",
      influential: "Présente les personnes marquantes ayant influencé le parcours, avec leurs contributions et l'impact qu'elles ont eu.",
      board: "Décris le cercle de conseillers et le réseau professionnel de confiance, leurs expertises et leurs rôles.",
      commitments: "Présente les engagements familiaux philanthropiques et sociaux, leurs causes et leurs impacts.",
      heritage: "Développe une vision de l'héritage et de la transmission des valeurs familiales, avec une perspective sur l'avenir.",
      bio: "Rédige une biographie personnelle élégante et concise.",
      philanthropy_text: "Décris les engagements philanthropiques avec passion et détails sur les causes soutenues.",
      network_text: "Présente le réseau et les affiliations clés avec distinction."
    };

    const systemPrompt = `Tu es un rédacteur expert pour une plateforme exclusive de networking pour UHNWI (Ultra High Net Worth Individuals).
Tu génères du contenu élégant, raffiné et personnel pour les profils de membres.
Ton style est:
- Élégant et distingué
- Personnel mais pas familier
- Narratif et engageant
- Authentique et sincère
Réponds uniquement avec le contenu demandé, sans commentaires ni explications.`;

    const userPrompt = `${modulePrompts[module] || "Génère un contenu approprié pour cette section."}
${currentContent ? `\nContenu actuel à améliorer ou compléter:\n${currentContent}` : ""}
\nGénère un contenu de 2-4 paragraphes, élégant et personnel.`;

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
          { role: "user", content: userPrompt }
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, réessayez plus tard." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content || "";

    console.log("Generated suggestion for module:", module);

    return new Response(JSON.stringify({ suggestion }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("family-ai-suggest error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
