import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPDATE-STRIPE-CONFIG] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user from auth header
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

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Check if user is admin using the has_role function
    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      logStep("Admin check failed", { roleError });
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    logStep("Admin access verified");

    const body = await req.json();
    const { 
      stripe_mode,
      stripe_test_secret_key, 
      stripe_live_secret_key
    } = body;

    logStep("Updating Stripe config", { 
      mode: stripe_mode,
      hasTestSecretKey: !!stripe_test_secret_key,
      hasLiveSecretKey: !!stripe_live_secret_key
    });

    // Update admin_settings in database
    const settings = [];
    
    if (stripe_mode) {
      settings.push({
        setting_key: 'stripe_mode',
        setting_value: stripe_mode,
        description: 'Stripe Mode (test or production)'
      });
    }
    
    if (stripe_test_secret_key !== undefined) {
      settings.push({
        setting_key: 'stripe_test_secret_key',
        setting_value: stripe_test_secret_key,
        description: 'Stripe Test Secret API Key'
      });
    }
    
    if (stripe_live_secret_key !== undefined) {
      settings.push({
        setting_key: 'stripe_live_secret_key',
        setting_value: stripe_live_secret_key,
        description: 'Stripe Live Secret API Key'
      });
    }

    for (const setting of settings) {
      const { error } = await supabaseAdmin
        .from('admin_settings')
        .upsert(setting, { onConflict: 'setting_key' });
      
      if (error) {
        logStep("Error saving setting", { key: setting.setting_key, error: error.message });
        throw error;
      }
    }

    logStep("Stripe config saved successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Stripe configuration updated successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
