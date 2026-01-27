import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

    // Get Supabase configuration
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
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

    // Client for authentication (with user context)
    const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get("Authorization") || "" },
      },
    });

    // Client for database operations (bypasses RLS)
    const supabaseClient = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey)
      : createClient(supabaseUrl, supabaseAnonKey);

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabaseAuthClient.auth.getUser();

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

    const customerEmail = user.email;
    const origin = req.headers.get("origin") || "https://aurora-society.com";

    // Create Checkout Session using Stripe API directly
    const checkoutResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "mode": "payment",
        "payment_method_types[0]": "card",
        "line_items[0][price_data][currency]": finalCurrency,
        "line_items[0][price_data][product_data][name]": item.title,
        ...(item.description && { "line_items[0][price_data][product_data][description]": item.description }),
        "line_items[0][price_data][unit_amount]": String(Math.round(finalAmount * 100)),
        "line_items[0][quantity]": "1",
        "metadata[itemId]": itemId,
        "metadata[buyerId]": user.id,
        "metadata[sellerId]": item.user_id,
        ...(customerEmail && { "customer_email": customerEmail }),
        "success_url": `${origin}/marketplace?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        "cancel_url": `${origin}/marketplace?payment=cancelled`,
      }),
    });

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.json();
      console.error("Stripe Checkout Session creation error:", errorData);
      return new Response(
        JSON.stringify({ 
          message: "Erreur lors de la création de la session de paiement Stripe", 
          code: "STRIPE_CHECKOUT_SESSION_ERROR",
          error: errorData.error?.message || "Unknown error"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const checkoutSession = await checkoutResponse.json();
    console.log("Checkout Session created:", checkoutSession.id);

    // Create payment record in database
    const { data: paymentData, error: paymentError } = await supabaseClient
      .from("marketplace_payments")
      .insert({
        item_id: itemId,
        buyer_id: user.id,
        seller_id: item.user_id,
        amount: finalAmount,
        currency: finalCurrency.toUpperCase(),
        stripe_payment_intent_id: checkoutSession.id,
        status: "pending",
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Payment record error:", paymentError);
      
      return new Response(
        JSON.stringify({ 
          message: "Erreur lors de l'enregistrement du paiement", 
          code: "DATABASE_INSERT_ERROR",
          error: paymentError.message,
          details: paymentError 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log("Payment record created:", paymentData?.id);

    return new Response(
      JSON.stringify({
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
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
    console.error("Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        message: "Erreur lors de l'initialisation du paiement", 
        code: "STRIPE_CREATE_INTENT_ERROR",
        error: error.message,
        type: error.constructor?.name || "Unknown"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
