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
    const { type, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "bio":
        systemPrompt = `Tu es un rédacteur de profils exécutifs pour une communauté ultra-exclusive de dirigeants et entrepreneurs fortunés. 
        Tu rédiges des bio exécutives élégantes, concises et professionnelles. Style Forbes/Bloomberg. Maximum 150 mots. 
        Ton: institutionnel, discret, prestigieux. Ne pas exagérer. Rester factuel et élégant.`;
        userPrompt = `Rédige une bio exécutive pour cette personne:
        - Nom: ${context.name || "Non spécifié"}
        - Fonction: ${context.role || "Non spécifié"}
        - Domaine: ${context.domain || "Non spécifié"}
        - Description fournie: ${context.description || "Aucune"}`;
        break;

      case "achievements":
        systemPrompt = `Tu es un rédacteur spécialisé dans la mise en valeur des réalisations professionnelles pour des dirigeants d'exception.
        Tu structures les accomplissements de manière impactante et chiffrée quand possible. Maximum 5 réalisations.`;
        userPrompt = `Structure les réalisations de cette personne:
        - Fonction: ${context.role || "Non spécifié"}
        - Informations: ${context.info || "Non spécifié"}
        Formate en liste à puces élégante.`;
        break;

      case "vision":
        systemPrompt = `Tu es un rédacteur de visions stratégiques pour des leaders d'industrie.
        Tu rédiges des visions inspirantes mais réalistes. Maximum 100 mots. Ton: visionnaire mais ancré.`;
        userPrompt = `Rédige une vision/ambition pour:
        - Domaine: ${context.domain || "Non spécifié"}  
        - Contexte: ${context.info || "Non spécifié"}`;
        break;

      case "timeline":
        systemPrompt = `Tu es un assistant qui structure des parcours professionnels.
        Tu génères une timeline de carrière avec années, postes et entreprises. Format JSON array.`;
        userPrompt = `Génère une timeline de carrière basée sur:
        ${context.info || "Non spécifié"}
        Retourne un JSON array avec: [{year, title, company, description}]`;
        break;

      case "press":
        systemPrompt = `Tu es un rédacteur spécialisé dans les relations presse pour des dirigeants d'exception.
        Tu rédiges des descriptions de couverture médiatique élégantes et factuelles. Maximum 100 mots.`;
        userPrompt = `Rédige une description de couverture presse pour:
        - Contexte: ${context.info || "Non spécifié"}
        Style: professionnel, factuel, prestigieux.`;
        break;

      case "projects":
        systemPrompt = `Tu es un rédacteur de projets stratégiques pour des leaders d'industrie.
        Tu décris des projets business de manière impactante et visionnaire. Maximum 100 mots.`;
        userPrompt = `Rédige une description de projet stratégique pour:
        - Contexte: ${context.info || "Non spécifié"}
        Style: ambitieux, concret, inspirant.`;
        break;

      case "full_profile":
        systemPrompt = `Tu es un rédacteur de profils business complets pour une communauté exclusive d'UHNWI.
        Tu génères un profil business complet: bio exécutive, réalisations, vision.
        Style Forbes/Bloomberg. Ton: institutionnel, prestigieux, discret.`;
        userPrompt = `Génère un profil business complet basé sur ces réponses:
        1. Rôle actuel: ${context.q1 || "Non spécifié"}
        2. 3 réalisations majeures: ${context.q2 || "Non spécifié"}  
        3. Ton préféré: ${context.tone || "institutionnel"}
        
        Retourne un JSON avec: {bio_executive, achievements_text, vision_text}`;
        break;

      default:
        throw new Error("Type de suggestion non supporté");
    }

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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Erreur du service IA");
    }

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ suggestion }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("business-ai-suggest error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
