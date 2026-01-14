import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get Stripe secret key from environment
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-11-20.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Parse request body
    const { itemId, amount, currency } = await req.json();

    if (!itemId || !amount || !currency) {
      throw new Error("Missing required fields: itemId, amount, currency");
    }

    // Verify item exists and is available
    const { data: item, error: itemError } = await supabaseClient
      .from("marketplace_items")
      .select("*")
      .eq("id", itemId)
      .single();

    if (itemError || !item) {
      throw new Error("Item not found");
    }

    if (item.status !== "active") {
      throw new Error("Item is not available for purchase");
    }

    if (item.user_id === user.id) {
      throw new Error("Cannot purchase your own item");
    }

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency.toLowerCase(),
      metadata: {
        itemId: itemId,
        buyerId: user.id,
        sellerId: item.user_id,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Create payment record in database
    await supabaseClient.from("marketplace_payments").insert({
      item_id: itemId,
      buyer_id: user.id,
      seller_id: item.user_id,
      amount: amount / 100, // Convert from cents
      currency: currency,
      stripe_payment_intent_id: paymentIntent.id,
      status: "pending",
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
