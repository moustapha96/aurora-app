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
    const { moduleType, context } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompts: Record<string, string> = {
      media: `Génère une suggestion de présence médiatique pour un membre d'élite. 
        Contexte: ${context || 'Membre influent'}
        Format: Titre court, plateforme, et description engageante de la présence médiatique.
        Exemple: Interview Forbes, apparition TV, podcast influent, couverture presse.`,
      
      events: `Génère une suggestion d'événement exclusif pour un membre d'élite.
        Contexte: ${context || 'Membre influent'}
        Format: Nom de l'événement, type, lieu prestigieux, et description.
        Exemple: Gala de charité, dîner privé, vernissage, conférence exclusive.`,
      
      influence: `Génère une suggestion de métrique d'influence pour un membre d'élite.
        Contexte: ${context || 'Membre influent'}
        Format: Titre, catégorie, métrique et valeur, description de l'impact.
        Exemple: Followers LinkedIn, citations presse, invitations conférences.`,
      
      philanthropy: `Génère une suggestion d'engagement philanthropique pour un membre d'élite.
        Contexte: ${context || 'Membre influent'}
        Format: Nom de l'initiative, organisation, rôle, cause, et description.
        Exemple: Fondation personnelle, mécénat culturel, parrainage éducatif.`,
      
      clubs: `Génère une suggestion de club ou association exclusive pour un membre d'élite.
        Contexte: ${context || 'Membre influent'}
        Format: Nom du club, type, rôle du membre, année d'adhésion, description.
        Exemple: Yacht Club, Club d'affaires, Cercle privé, Association caritative.`,
      
      ambitions: `Génère une suggestion d'ambition sociale pour un membre d'élite.
        Contexte: ${context || 'Membre influent'}
        Format: Titre de l'ambition, catégorie, horizon temporel, description détaillée.
        Exemple: Création fondation, influence sectorielle, impact sociétal.`
    };

    // Tool definitions for structured output
    const toolDefinitions: Record<string, any> = {
      events: {
        name: "create_event",
        description: "Crée un événement complet avec tous les détails",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Nom de l'événement" },
            event_type: { type: "string", description: "Type d'événement (Gala, Conférence, Vernissage, Dîner privé, etc.)" },
            location: { type: "string", description: "Lieu prestigieux de l'événement" },
            date: { type: "string", description: "Date ou période de l'événement (ex: Juin 2024)" },
            description: { type: "string", description: "Description détaillée de l'événement" }
          },
          required: ["title", "event_type", "location", "date", "description"],
          additionalProperties: false
        }
      },
      media: {
        name: "create_media",
        description: "Crée une entrée de présence médiatique",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Titre de l'apparition médiatique" },
            platform: { type: "string", description: "Plateforme ou média" },
            description: { type: "string", description: "Description de la présence médiatique" },
            url: { type: "string", description: "URL optionnelle" }
          },
          required: ["title", "platform", "description"],
          additionalProperties: false
        }
      },
      influence: {
        name: "create_influence",
        description: "Crée une métrique d'influence",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Titre de la métrique" },
            category: { type: "string", description: "Catégorie d'influence" },
            metric: { type: "string", description: "Type de métrique" },
            value: { type: "string", description: "Valeur de la métrique" },
            description: { type: "string", description: "Description de l'impact" }
          },
          required: ["title", "category", "description"],
          additionalProperties: false
        }
      },
      philanthropy: {
        name: "create_philanthropy",
        description: "Crée un engagement philanthropique",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Nom de l'initiative" },
            organization: { type: "string", description: "Organisation concernée" },
            role: { type: "string", description: "Rôle du membre" },
            cause: { type: "string", description: "Cause soutenue" },
            description: { type: "string", description: "Description de l'engagement" }
          },
          required: ["title", "organization", "role", "cause", "description"],
          additionalProperties: false
        }
      },
      clubs: {
        name: "create_club",
        description: "Crée une adhésion à un club",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Nom du club" },
            club_type: { type: "string", description: "Type de club" },
            role: { type: "string", description: "Rôle du membre" },
            since_year: { type: "string", description: "Année d'adhésion" },
            description: { type: "string", description: "Description du club" }
          },
          required: ["title", "club_type", "description"],
          additionalProperties: false
        }
      },
      ambitions: {
        name: "create_ambition",
        description: "Crée une ambition sociale",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Titre de l'ambition" },
            category: { type: "string", description: "Catégorie" },
            timeline: { type: "string", description: "Horizon temporel" },
            description: { type: "string", description: "Description détaillée" }
          },
          required: ["title", "category", "timeline", "description"],
          additionalProperties: false
        }
      }
    };

    const prompt = prompts[moduleType] || prompts.media;
    const toolDef = toolDefinitions[moduleType];

    const requestBody: any = {
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant spécialisé dans la création de profils pour des membres de clubs privés d\'élite. Génère des suggestions raffinées et prestigieuses en français. Utilise l\'outil fourni pour structurer ta réponse.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
    };

    // Add tool calling for structured output
    if (toolDef) {
      requestBody.tools = [{
        type: "function",
        function: toolDef
      }];
      requestBody.tool_choice = { type: "function", function: { name: toolDef.name } };
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract structured data from tool call or fallback to text
    let suggestion = '';
    let structuredData = null;
    
    const toolCalls = data.choices?.[0]?.message?.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      try {
        structuredData = JSON.parse(toolCalls[0].function.arguments);
        console.log('Structured data extracted:', structuredData);
      } catch (e) {
        console.error('Failed to parse tool call arguments:', e);
      }
    }
    
    // Fallback to text content
    if (!structuredData) {
      suggestion = data.choices?.[0]?.message?.content || '';
    }

    return new Response(JSON.stringify({ suggestion, structuredData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in network-ai-suggest:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
