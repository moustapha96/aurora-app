import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate base64 format and size
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageSize = (base64Data.length * 3) / 4;
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (imageSize > maxSize) {
      return new Response(
        JSON.stringify({ error: 'Image too large. Maximum size is 10MB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate image format
    const formatMatch = imageBase64.match(/^data:image\/(jpeg|jpg|png|webp|gif);base64,/);
    if (!formatMatch) {
      return new Response(
        JSON.stringify({ error: 'Invalid image format. Supported formats: JPEG, PNG, WebP, GIF' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing profile image...');

    // Call Lovable AI to analyze the profile image
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
                text: `Analyze this image and determine if it's suitable as a profile picture.

BE PERMISSIVE - Accept most images as long as they meet these MINIMAL criteria:
1. Is there at least one human face visible (even partially)? Selfies are OK, any angle is OK.
2. Is the image appropriate (no explicit nudity, no hate symbols, no graphic violence)?
3. Is the image usable (can you see the person, even if quality is not perfect)?

IMPORTANT: Be lenient! Accept:
- Selfies from any angle
- Photos with any background
- Photos with imperfect lighting
- Casual or formal photos
- Group photos where one face is identifiable

Only REJECT if:
- No human face at all
- Explicit/offensive content
- Completely unrecognizable image

Respond ONLY with a valid JSON object in this exact format:
{
  "isValid": true/false,
  "hasFace": true/false,
  "isAppropriate": true/false,
  "qualityOk": true/false,
  "reason": "Brief explanation if rejected, or 'Photo de profil acceptée' if accepted"
}

Do not include any markdown formatting or code blocks. Just the raw JSON.`
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
        max_tokens: 500,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to analyze image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'Failed to get analysis result' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI response:', content);

    // Parse the JSON response
    let analysisResult;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      analysisResult = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Default to accepting if we can't parse
      analysisResult = {
        isValid: true,
        hasFace: true,
        isAppropriate: true,
        qualityOk: true,
        reason: 'Image accepted'
      };
    }

    return new Response(
      JSON.stringify({
        isValid: analysisResult.isValid === true,
        hasFace: analysisResult.hasFace === true,
        isAppropriate: analysisResult.isAppropriate === true,
        qualityOk: analysisResult.qualityOk === true,
        reason: analysisResult.reason || (analysisResult.isValid ? 'Valid profile image' : 'Image not suitable as profile picture')
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing profile image:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
