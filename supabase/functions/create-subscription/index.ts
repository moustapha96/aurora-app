import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

async function getStripeSecretKey(supabaseAdmin: any): Promise<string> {
  // First get the stripe mode
  const { data: modeData } = await supabaseAdmin
    .from('admin_settings')
    .select('setting_value')
    .eq('setting_key', 'stripe_mode')
    .maybeSingle();

  const stripeMode = modeData?.setting_value || 'test';
  logStep("Stripe mode", { mode: stripeMode });

  // Get the appropriate key based on mode
  const keySettingKey = stripeMode === 'production' ? 'stripe_live_secret_key' : 'stripe_test_secret_key';
  const { data: keyData, error: keyError } = await supabaseAdmin
    .from('admin_settings')
    .select('setting_value')
    .eq('setting_key', keySettingKey)
    .maybeSingle();

  if (keyError) {
    logStep("Error getting Stripe key from settings", { error: keyError.message });
  }

  // Use admin_settings key if available, otherwise fall back to env
  const stripeKey = keyData?.setting_value || Deno.env.get("STRIPE_SECRET_KEY");
  
  if (!stripeKey) {
    throw new Error("Stripe API key not configured. Please configure it in Admin Settings.");
  }

  // Validate key format - must be a standard secret key, not a restricted key
  if (stripeKey.startsWith('rk_')) {
    throw new Error("Restricted API keys (rk_*) are not supported. Please use a standard secret key (sk_test_* or sk_live_*) in Admin Settings.");
  }

  if (!stripeKey.startsWith('sk_test_') && !stripeKey.startsWith('sk_live_')) {
    throw new Error("Invalid API key format. Please use a standard secret key starting with sk_test_ or sk_live_");
  }

  logStep("Using Stripe key", { source: keyData?.setting_value ? 'admin_settings' : 'env', mode: stripeMode });
  return stripeKey;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { priceId } = await req.json();
    if (!priceId) throw new Error("Price ID is required");
    logStep("Price ID received", { priceId });

    // Get the appropriate Stripe key
    const stripeKey = await getStripeSecretKey(supabaseAdmin);
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/subscription?success=true`,
      cancel_url: `${req.headers.get("origin")}/subscription?canceled=true`,
      metadata: {
        user_id: user.id,
      },
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
