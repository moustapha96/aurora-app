import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { module, currentContent } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Configuration manquante" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const modulePrompts: Record<string, string> = {
      sports: `Génère une suggestion de contenu pour la section Sports d'un profil de membre d'un club privé ultra-exclusif. 
        Le membre pratique des sports d'élite (yachting, polo, golf, équitation, ski, tennis...).
        ${currentContent ? `Contenu actuel: ${currentContent}` : ""}
        Génère un texte élégant et personnel décrivant les activités sportives du membre.`,
      
      art_culture: `Génère une suggestion de contenu pour la section Art & Culture d'un profil de membre UHNWI.
        Le membre est amateur d'art, collectionneur, mécène ou passionné de culture.
        ${currentContent ? `Contenu actuel: ${currentContent}` : ""}
        Génère un texte décrivant les intérêts artistiques et culturels du membre.`,
      
      voyages: `Génère une suggestion de contenu pour la section Voyages d'un profil de membre fortuné.
        Le membre voyage dans des destinations exclusives (îles privées, lodges de luxe, palaces...).
        ${currentContent ? `Contenu actuel: ${currentContent}` : ""}
        Génère un texte décrivant les expériences de voyage du membre.`,
      
      gastronomie: `Génère une suggestion de contenu pour la section Gastronomie d'un profil de membre UHNWI.
        Le membre fréquente les tables étoilées, possède des caves, apprécie les produits d'exception.
        ${currentContent ? `Contenu actuel: ${currentContent}` : ""}
        Génère un texte décrivant les passions gastronomiques du membre.`,
      
      luxe: `Génère une suggestion de contenu pour la section Luxe d'un profil de membre ultra-fortuné.
        Le membre apprécie l'horlogerie, les automobiles de collection, la haute couture, les jets privés...
        ${currentContent ? `Contenu actuel: ${currentContent}` : ""}
        Génère un texte décrivant les affinités du membre avec le luxe.`,
      
      collections: `Génère une suggestion de contenu pour la section Collections d'un profil de collectionneur.
        Le membre possède des collections (art, montres, voitures, vins, livres rares...).
        ${currentContent ? `Contenu actuel: ${currentContent}` : ""}
        Génère un texte décrivant les collections du membre.`
    };

    const systemPrompt = `Tu es un assistant de rédaction pour Aurora Society, un club privé ultra-exclusif pour UHNWI.
      Tu génères du contenu élégant, sophistiqué et personnel pour les profils des membres.
      Écris en français, avec un ton raffiné mais authentique.
      Limite tes réponses à 2-3 paragraphes maximum.
      Ne mentionne jamais de noms spécifiques, utilise des formulations génériques que le membre pourra personnaliser.`;

    const userPrompt = modulePrompts[module] || modulePrompts.sports;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte. Réessayez dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Erreur du service IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ suggestion }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
