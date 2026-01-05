import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    // Input validation
    if (!imageBase64) {
      throw new Error('Image is required');
    }

    // Validate image size (max 10MB base64)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (imageBase64.length > MAX_SIZE) {
      throw new Error('Image too large. Maximum size is 10MB');
    }

    // Validate base64 format
    if (!imageBase64.startsWith('data:image/')) {
      throw new Error('Invalid image format. Must be a valid base64 image');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Call Lovable AI with vision model to analyze the ID card
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
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
                text: `Analyse cette carte d'identité et extrait UNIQUEMENT le prénom et le nom de famille. 
                Retourne le résultat au format JSON avec les champs "firstName" et "lastName".
                Si tu ne peux pas lire clairement les informations, retourne des champs vides.
                Exemple de réponse attendue: {"firstName": "Jean", "lastName": "Dupont"}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API error: ${error}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response from AI
    let parsedData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || 
                       aiResponse.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
      parsedData = JSON.parse(jsonString.trim());
    } catch (e) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('Failed to parse AI response');
    }

    // Sanitize output - only allow alphanumeric, spaces, hyphens, apostrophes
    const sanitizeName = (name: string): string => {
      if (!name || typeof name !== 'string') return '';
      return name.replace(/[^a-zA-ZÀ-ÿ\s\-']/g, '').substring(0, 100).trim();
    };

    return new Response(
      JSON.stringify({
        firstName: sanitizeName(parsedData.firstName),
        lastName: sanitizeName(parsedData.lastName),
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});