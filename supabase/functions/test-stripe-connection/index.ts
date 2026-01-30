import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TEST-STRIPE-CONNECTION] ${step}${detailsStr}`);
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

    // Get the stripe mode
    const { data: modeData } = await supabaseAdmin
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'stripe_mode')
      .maybeSingle();

    const stripeMode = modeData?.setting_value || 'test';
    logStep("Stripe mode", { mode: stripeMode });

    // Get the appropriate key based on mode
    const keySettingKey = stripeMode === 'production' ? 'stripe_live_secret_key' : 'stripe_test_secret_key';
    const { data: keyData } = await supabaseAdmin
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', keySettingKey)
      .maybeSingle();

    const stripeKey = keyData?.setting_value || Deno.env.get("STRIPE_SECRET_KEY");

    if (!stripeKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Stripe API key not configured",
        error_code: "no_key",
        mode: stripeMode
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Validate key format - must be a standard secret key, not a restricted key
    const expectedPrefix = stripeMode === 'production' ? 'sk_live_' : 'sk_test_';
    if (stripeKey.startsWith('rk_')) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Restricted API keys (rk_*) are not supported. Please use a standard secret key starting with " + expectedPrefix,
        error_code: "restricted_key",
        mode: stripeMode
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (!stripeKey.startsWith('sk_test_') && !stripeKey.startsWith('sk_live_')) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid API key format. Please use a standard secret key starting with sk_test_ or sk_live_",
        error_code: "invalid_format",
        mode: stripeMode
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Warn if key doesn't match the mode
    if (stripeMode === 'production' && stripeKey.startsWith('sk_test_')) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "You are in production mode but using a test key. Please use a live key (sk_live_*)",
        error_code: "mode_mismatch",
        mode: stripeMode
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (stripeMode === 'test' && stripeKey.startsWith('sk_live_')) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "You are in test mode but using a live key. Please use a test key (sk_test_*)",
        error_code: "mode_mismatch",
        mode: stripeMode
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Test the connection
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Try to get the account to verify the key works
    const account = await stripe.accounts.retrieve();
    logStep("Stripe connection successful", { accountId: account.id });

    // Get products count
    const products = await stripe.products.list({ limit: 100, active: true });
    const prices = await stripe.prices.list({ limit: 100, active: true });
    
    logStep("Products and prices retrieved", { 
      productsCount: products.data.length, 
      pricesCount: prices.data.length 
    });

    return new Response(JSON.stringify({ 
      success: true,
      mode: stripeMode,
      accountId: account.id,
      productsCount: products.data.length,
      pricesCount: prices.data.length,
      products: products.data.map(p => ({
        id: p.id,
        name: p.name,
        active: p.active
      })),
      prices: prices.data.map(p => ({
        id: p.id,
        product: p.product,
        unit_amount: p.unit_amount,
        currency: p.currency,
        recurring: p.recurring
      }))
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

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
