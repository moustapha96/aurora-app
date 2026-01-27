import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "stripe-signature, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Verify Stripe webhook signature manually
async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = signature.split(",");
    let timestamp = "";
    let signatures: string[] = [];

    for (const part of parts) {
      const [key, value] = part.split("=");
      if (key === "t") {
        timestamp = value;
      } else if (key === "v1") {
        signatures.push(value);
      }
    }

    if (!timestamp || signatures.length === 0) {
      console.error("Invalid signature format");
      return false;
    }

    // Check timestamp (allow 5 minutes tolerance)
    const timestampSeconds = parseInt(timestamp, 10);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTimestamp - timestampSeconds) > 300) {
      console.error("Timestamp too old or in the future");
      return false;
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(signedPayload)
    );

    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Compare signatures
    return signatures.some((sig) => sig === expectedSignature);
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature) {
    console.error("Missing stripe-signature header");
    return new Response(
      JSON.stringify({ error: "Missing signature" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
  }

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return new Response(
      JSON.stringify({ error: "Webhook secret not configured" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }

  try {
    const body = await req.text();
    
    // Verify signature
    const isValid = await verifyStripeSignature(body, signature, webhookSecret);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    const event = JSON.parse(body);
    console.log("Received Stripe event:", event.type, event.id);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase configuration missing");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const { itemId, buyerId, sellerId } = session.metadata || {};

        console.log("Processing checkout.session.completed:", {
          sessionId: session.id,
          itemId,
          buyerId,
          sellerId,
          paymentStatus: session.payment_status,
        });

        if (!itemId || !buyerId || !sellerId) {
          console.error("Missing metadata in checkout session:", session.id);
          break;
        }

        // Verify payment status
        if (session.payment_status !== "paid") {
          console.log(`Session ${session.id} not paid yet, status: ${session.payment_status}`);
          break;
        }

        // Update payment record using session ID
        const { error: paymentUpdateError } = await supabase
          .from("marketplace_payments")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            stripe_payment_intent_id: session.payment_intent || session.id,
          })
          .eq("stripe_payment_intent_id", session.id);

        if (paymentUpdateError) {
          console.error("Error updating payment status:", paymentUpdateError);
        } else {
          console.log(`Payment completed for session ${session.id}`);
        }

        // Mark item as sold
        const { error: itemUpdateError } = await supabase
          .from("marketplace_items")
          .update({
            status: "sold",
            updated_at: new Date().toISOString(),
          })
          .eq("id", itemId);

        if (itemUpdateError) {
          console.error("Error updating item status:", itemUpdateError);
        } else {
          console.log(`Item ${itemId} marked as sold`);
        }

        // Create notification for seller
        const amountTotal = (session.amount_total || 0) / 100;
        const currency = (session.currency || "eur").toUpperCase();
        
        const { error: sellerNotifError } = await supabase
          .from("notifications")
          .insert({
            user_id: sellerId,
            type: "marketplace_sale",
            title: "Vente effectuée",
            message: `Votre article a été vendu pour ${amountTotal} ${currency}`,
          });
        
        if (sellerNotifError) {
          console.error("Error creating seller notification:", sellerNotifError);
        }

        // Create notification for buyer
        const { error: buyerNotifError } = await supabase
          .from("notifications")
          .insert({
            user_id: buyerId,
            type: "marketplace_purchase",
            title: "Achat confirmé",
            message: `Votre achat a été confirmé. Le vendeur va vous contacter.`,
          });
        
        if (buyerNotifError) {
          console.error("Error creating buyer notification:", buyerNotifError);
        }

        console.log("Checkout session processed successfully");
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        const { itemId, buyerId, sellerId } = session.metadata || {};

        console.log("Processing async_payment_succeeded:", session.id);

        if (itemId && buyerId && sellerId) {
          await supabase
            .from("marketplace_payments")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("stripe_payment_intent_id", session.id);

          await supabase
            .from("marketplace_items")
            .update({
              status: "sold",
              updated_at: new Date().toISOString(),
            })
            .eq("id", itemId);
        }
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object;
        console.log("Processing async_payment_failed:", session.id);
        
        await supabase
          .from("marketplace_payments")
          .update({
            status: "failed",
          })
          .eq("stripe_payment_intent_id", session.id);

        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        console.log("Processing session expired:", session.id);
        
        await supabase
          .from("marketplace_payments")
          .update({
            status: "expired",
          })
          .eq("stripe_payment_intent_id", session.id);

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: `Webhook Error: ${err.message}` }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});
