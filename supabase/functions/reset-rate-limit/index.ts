import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

interface ResetRateLimitRequest {
  identifier: string;
  endpoint: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req.headers.get('origin') || '') });
  }

  try {
    const { identifier, endpoint }: ResetRateLimitRequest = await req.json();

    if (!identifier || !endpoint) {
      return new Response(
        JSON.stringify({ error: 'Missing identifier or endpoint' }),
        {
          status: 400,
          headers: { ...getCorsHeaders(req.headers.get('origin') || ''), 'Content-Type': 'application/json' },
        }
      );
    }

    // Get Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Reset rate limit for this identifier and endpoint
    const { error } = await supabase
      .from('rate_limiting')
      .delete()
      .eq('identifier', identifier)
      .eq('endpoint', endpoint);

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned (not an error)
      console.error('Error resetting rate limit:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to reset rate limit' }),
        {
          status: 500,
          headers: { ...getCorsHeaders(req.headers.get('origin') || ''), 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Rate limit reset successfully' }),
      {
        status: 200,
        headers: { ...getCorsHeaders(req.headers.get('origin') || ''), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in reset rate limit:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req.headers.get('origin') || ''), 'Content-Type': 'application/json' },
      }
    );
  }
});

