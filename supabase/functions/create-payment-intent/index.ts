import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
      console.error("STRIPE_SECRET_KEY is not set");
      return new Response(
        JSON.stringify({ 
          message: "Stripe non configuré", 
          code: "STRIPE_NOT_CONFIGURED" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-11-20.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase configuration missing");
      return new Response(
        JSON.stringify({ 
          message: "Configuration Supabase manquante", 
          code: "SUPABASE_NOT_CONFIGURED" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get("Authorization") || "" },
      },
    });

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ 
          message: "Non autorisé", 
          code: "UNAUTHORIZED" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ 
          message: "Corps de requête invalide", 
          code: "INVALID_BODY" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const { itemId, amount, currency } = body || {};

    if (!itemId) {
      return new Response(
        JSON.stringify({ 
          message: "itemId requis", 
          code: "MISSING_FIELDS" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Verify item exists and is available
    const { data: item, error: itemError } = await supabaseClient
      .from("marketplace_items")
      .select("*")
      .eq("id", itemId)
      .single();

    if (itemError || !item) {
      console.error("Item error:", itemError);
      return new Response(
        JSON.stringify({ 
          message: "Article introuvable", 
          code: "ITEM_NOT_FOUND" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    if (item.status !== "active") {
      return new Response(
        JSON.stringify({ 
          message: "L'article n'est pas disponible à l'achat", 
          code: "ITEM_NOT_AVAILABLE" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    if (item.user_id === user.id) {
      return new Response(
        JSON.stringify({ 
          message: "Vous ne pouvez pas acheter votre propre article", 
          code: "CANNOT_PURCHASE_OWN_ITEM" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Use item price if amount not provided, otherwise use provided amount
    const finalAmount = amount !== undefined ? Number(amount) : Number(item.price);
    const finalCurrency = (currency || item.currency || "EUR").toLowerCase();

    if (isNaN(finalAmount) || finalAmount <= 0) {
      return new Response(
        JSON.stringify({ 
          message: "Montant invalide", 
          code: "INVALID_AMOUNT" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount * 100), // Convert to cents
      currency: finalCurrency,
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
    const { error: paymentError } = await supabaseClient
      .from("marketplace_payments")
      .insert({
        item_id: itemId,
        buyer_id: user.id,
        seller_id: item.user_id,
        amount: finalAmount,
        currency: finalCurrency.toUpperCase(),
        stripe_payment_intent_id: paymentIntent.id,
        status: "pending",
      });

    if (paymentError) {
      console.error("Payment record error:", paymentError);
      // Continue anyway, the payment intent is created
    }

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: finalAmount,
        currency: finalCurrency.toUpperCase(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201,
      }
    );
  } catch (error: any) {
    console.error("STRIPE_CREATE_INTENT_ERROR:", error);
    return new Response(
      JSON.stringify({ 
        message: "Échec init paiement Stripe", 
        code: "STRIPE_CREATE_INTENT_ERROR",
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
