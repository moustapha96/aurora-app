import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TEST-VERIFF-CONNECTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user and verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header provided" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !userData.user) {
      logStep("Auth error", { error: userError?.message });
      return new Response(
        JSON.stringify({ error: "Authentication failed" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is admin
    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc('has_role', {
      _user_id: userData.user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get Veriff config from database
    const { data: settings } = await supabaseAdmin
      .from('admin_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['veriff_api_key', 'veriff_shared_secret', 'veriff_base_url']);

    const configMap: Record<string, string> = {};
    settings?.forEach(item => {
      configMap[item.setting_key] = item.setting_value || '';
    });

    const apiKey = configMap['veriff_api_key'] || Deno.env.get("VERIFF_API_KEY");
    const sharedSecret = configMap['veriff_shared_secret'] || Deno.env.get("VERIFF_SHARED_SECRET");
    const baseUrl = configMap['veriff_base_url'] || 'https://stationapi.veriff.com';

    logStep("Config loaded", { 
      hasApiKey: !!apiKey, 
      hasSharedSecret: !!sharedSecret, 
      baseUrl 
    });

    if (!apiKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Veriff API key not configured",
        error_code: "no_api_key"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (!sharedSecret) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Veriff Shared Secret not configured",
        error_code: "no_shared_secret"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Test the API connection by checking the health/status endpoint
    // We'll try to create a minimal session to test if the API key is valid
    const testResponse = await fetch(`${baseUrl}/v1/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AUTH-CLIENT': apiKey,
      },
      body: JSON.stringify({
        verification: {
          callback: 'https://example.com/callback',
          person: {
            firstName: 'Test',
            lastName: 'User',
          },
          vendorData: 'api_test_' + Date.now()
        }
      }),
    });

    const testData = await testResponse.json();
    logStep("Veriff API response", { status: testResponse.status, data: testData });

    if (testResponse.ok && testData.verification?.id) {
      // API key is valid, we successfully created a test session
      // Note: This session won't be used, it's just for testing
      return new Response(JSON.stringify({ 
        success: true,
        message: "Veriff connection successful",
        baseUrl,
        sessionIdCreated: testData.verification.id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else if (testResponse.status === 401) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid Veriff API key - authentication failed",
        error_code: "invalid_api_key"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else if (testResponse.status === 403) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Veriff API key does not have required permissions",
        error_code: "insufficient_permissions"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        error: testData.message || testData.error || "Unknown Veriff API error",
        error_code: "api_error",
        details: testData
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
