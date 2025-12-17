import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    // Authentication is optional for registration flow
    // The function can be called during registration when user is not yet authenticated
    // verify_jwt is set to false in config.toml

    let requestData;
    try {
      requestData = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { imageBase64 } = requestData;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Image is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate base64 format (basic check)
    if (!imageBase64.startsWith('data:image/')) {
      return new Response(
        JSON.stringify({ error: 'Invalid image format. Expected data URI' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Limit image size (base64 is ~33% larger than binary)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageBase64.length > maxSize) {
      return new Response(
        JSON.stringify({ error: 'Image is too large. Maximum size is 10MB' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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

    return new Response(
      JSON.stringify({
        firstName: parsedData.firstName || '',
        lastName: parsedData.lastName || '',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});