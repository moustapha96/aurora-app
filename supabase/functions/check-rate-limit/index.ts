import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const RATE_LIMIT_CONFIG = {
  login: {
    maxAttempts: 5,
    windowMinutes: 15,
    blockMinutes: 30,
  },
  register: {
    maxAttempts: 3,
    windowMinutes: 60,
    blockMinutes: 60,
  },
  'reset-password': {
    maxAttempts: 3,
    windowMinutes: 60,
    blockMinutes: 60,
  },
  'forgot-password': {
    maxAttempts: 3,
    windowMinutes: 60,
    blockMinutes: 60,
  },
  default: {
    maxAttempts: 5,
    windowMinutes: 15,
    blockMinutes: 30,
  },
};

interface RateLimitRequest {
  identifier: string; // email or IP address
  endpoint: string; // 'login', 'register', etc.
}

interface RateLimitResponse {
  allowed: boolean;
  remainingAttempts?: number;
  blockedUntil?: string;
  retryAfter?: number; // seconds
  message?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req.headers.get('origin') || '') });
  }

  try {
    const { identifier, endpoint }: RateLimitRequest = await req.json();

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

    // Get rate limit config for this endpoint
    const config = RATE_LIMIT_CONFIG[endpoint as keyof typeof RATE_LIMIT_CONFIG] || RATE_LIMIT_CONFIG.default;

    // Check if identifier is currently blocked
    const { data: existingRecord, error: fetchError } = await supabase
      .from('rate_limiting')
      .select('*')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching rate limit:', fetchError);
      // On error, allow the request (fail open for availability)
      return new Response(
        JSON.stringify({ allowed: true, message: 'Rate limit check failed, allowing request' }),
        {
          status: 200,
          headers: { ...getCorsHeaders(req.headers.get('origin') || ''), 'Content-Type': 'application/json' },
        }
      );
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMinutes * 60 * 1000);

    // If record exists and is blocked
    if (existingRecord && existingRecord.blocked_until) {
      const blockedUntil = new Date(existingRecord.blocked_until);
      
      if (blockedUntil > now) {
        // Still blocked
        const retryAfter = Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000);
        return new Response(
          JSON.stringify({
            allowed: false,
            blockedUntil: blockedUntil.toISOString(),
            retryAfter,
            message: `Too many attempts. Please try again after ${Math.ceil(retryAfter / 60)} minutes.`,
          } as RateLimitResponse),
          {
            status: 200,
            headers: { ...getCorsHeaders(req.headers.get('origin') || ''), 'Content-Type': 'application/json' },
          }
        );
      } else {
        // Block expired, reset
        await supabase
          .from('rate_limiting')
          .update({
            attempt_count: 1,
            first_attempt_at: now.toISOString(),
            last_attempt_at: now.toISOString(),
            blocked_until: null,
          })
          .eq('id', existingRecord.id);
        
        return new Response(
          JSON.stringify({
            allowed: true,
            remainingAttempts: config.maxAttempts - 1,
          } as RateLimitResponse),
          {
            status: 200,
            headers: { ...getCorsHeaders(req.headers.get('origin') || ''), 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // If record exists but not blocked, check attempt count
    if (existingRecord) {
      const firstAttempt = new Date(existingRecord.first_attempt_at);
      
      // Check if we're still in the same window
      if (firstAttempt >= windowStart) {
        // Still in window
        if (existingRecord.attempt_count >= config.maxAttempts) {
          // Exceeded limit, block
          const blockedUntil = new Date(now.getTime() + config.blockMinutes * 60 * 1000);
          
          await supabase
            .from('rate_limiting')
            .update({
              attempt_count: existingRecord.attempt_count + 1,
              last_attempt_at: now.toISOString(),
              blocked_until: blockedUntil.toISOString(),
            })
            .eq('id', existingRecord.id);

          const retryAfter = Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000);
          
          return new Response(
            JSON.stringify({
              allowed: false,
              blockedUntil: blockedUntil.toISOString(),
              retryAfter,
              message: `Too many attempts. Please try again after ${config.blockMinutes} minutes.`,
            } as RateLimitResponse),
            {
              status: 200,
              headers: { ...getCorsHeaders(req.headers.get('origin') || ''), 'Content-Type': 'application/json' },
            }
          );
        } else {
          // Within limit, increment count
          await supabase
            .from('rate_limiting')
            .update({
              attempt_count: existingRecord.attempt_count + 1,
              last_attempt_at: now.toISOString(),
            })
            .eq('id', existingRecord.id);

          return new Response(
            JSON.stringify({
              allowed: true,
              remainingAttempts: config.maxAttempts - existingRecord.attempt_count - 1,
            } as RateLimitResponse),
            {
              status: 200,
              headers: { ...getCorsHeaders(req.headers.get('origin') || ''), 'Content-Type': 'application/json' },
            }
          );
        }
      } else {
        // Window expired, reset
        await supabase
          .from('rate_limiting')
          .update({
            attempt_count: 1,
            first_attempt_at: now.toISOString(),
            last_attempt_at: now.toISOString(),
            blocked_until: null,
          })
          .eq('id', existingRecord.id);

        return new Response(
          JSON.stringify({
            allowed: true,
            remainingAttempts: config.maxAttempts - 1,
          } as RateLimitResponse),
          {
            status: 200,
            headers: { ...getCorsHeaders(req.headers.get('origin') || ''), 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // No record exists, create new one
    const { error: insertError } = await supabase
      .from('rate_limiting')
      .insert({
        identifier,
        endpoint,
        attempt_count: 1,
        first_attempt_at: now.toISOString(),
        last_attempt_at: now.toISOString(),
        blocked_until: null,
      });

    if (insertError) {
      console.error('Error inserting rate limit:', insertError);
      // Fail open
      return new Response(
        JSON.stringify({ allowed: true, message: 'Rate limit check failed, allowing request' }),
        {
          status: 200,
          headers: { ...getCorsHeaders(req.headers.get('origin') || ''), 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        allowed: true,
        remainingAttempts: config.maxAttempts - 1,
      } as RateLimitResponse),
      {
        status: 200,
        headers: { ...getCorsHeaders(req.headers.get('origin') || ''), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in rate limit check:', error);
    // Fail open for availability
    return new Response(
      JSON.stringify({ allowed: true, message: 'Rate limit check failed, allowing request' }),
      {
        status: 200,
        headers: { ...getCorsHeaders(req.headers.get('origin') || ''), 'Content-Type': 'application/json' },
      }
    );
  }
});

