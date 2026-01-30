import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ 
        subscribed: false,
        subscriptions: []
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get all subscriptions (active, trialing, and canceled)
    const [activeSubscriptions, trialingSubscriptions, canceledSubscriptions] = await Promise.all([
      stripe.subscriptions.list({
        customer: customerId,
        status: "active",
      }),
      stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
      }),
      stripe.subscriptions.list({
        customer: customerId,
        status: "canceled",
        limit: 10,
      }),
    ]);

    // Collect all unique product IDs to fetch
    const productIds = new Set<string>();
    const allSubscriptions = [
      ...activeSubscriptions.data,
      ...trialingSubscriptions.data,
      ...canceledSubscriptions.data,
    ];
    
    for (const sub of allSubscriptions) {
      const priceItem = sub.items?.data?.[0];
      const productId = priceItem?.price?.product;
      if (typeof productId === "string") {
        productIds.add(productId);
      }
    }

    // Fetch all products in parallel
    const productMap = new Map<string, string>();
    if (productIds.size > 0) {
      const products = await Promise.all(
        Array.from(productIds).map(id => stripe.products.retrieve(id))
      );
      for (const product of products) {
        productMap.set(product.id, product.name);
      }
    }


    const subscriptionsData: Array<{
      id: string;
      status: string;
      product_id: string;
      product_name: string;
      price_id: string;
      amount: number;
      currency: string;
      interval: string | undefined;
      current_period_start: string;
      current_period_end: string;
      cancel_at_period_end: boolean;
      canceled_at: string | null;
      created: string;
    }> = [];

    for (const sub of allSubscriptions) {
      try {
        if (!sub.items?.data?.length) continue;
        const priceItem = sub.items.data[0];
        const price = priceItem?.price;
        if (!price) continue;
        const productId = typeof price.product === "string" ? price.product : "";
        const productName = productMap.get(productId) || productId || "Subscription";
        subscriptionsData.push({
          id: sub.id,
          status: sub.status ?? "unknown",
          product_id: productId,
          product_name: productName,
          price_id: price.id,
          amount: price.unit_amount ?? 0,
          currency: price.currency ?? "eur",
          interval: price.recurring?.interval,
          current_period_start: new Date((sub.current_period_start ?? 0) * 1000).toISOString(),
          current_period_end: new Date((sub.current_period_end ?? 0) * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
          canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
          created: new Date((sub.created ?? 0) * 1000).toISOString(),
        });
      } catch (itemErr) {
        logStep("Skip invalid subscription item", { subId: sub.id, error: String(itemErr) });
      }
    }

    const hasActiveSub =
      activeSubscriptions.data.length > 0 || trialingSubscriptions.data.length > 0;
    logStep("Subscriptions found", { active: hasActiveSub, total: subscriptionsData.length });

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscriptions: subscriptionsData,
    }), {
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
