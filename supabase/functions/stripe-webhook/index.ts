import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-11-20.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature || !webhookSecret) {
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { itemId, buyerId, sellerId } = paymentIntent.metadata;

        // Update payment status
        await supabaseClient
          .from("marketplace_payments")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        // Mark item as sold
        await supabaseClient
          .from("marketplace_items")
          .update({
            status: "sold",
            updated_at: new Date().toISOString(),
          })
          .eq("id", itemId);

        // Create notification for seller
        await supabaseClient.from("notifications").insert({
          user_id: sellerId,
          type: "marketplace_sale",
          title: "Vente effectuée",
          message: `Votre article a été vendu pour ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()}`,
        });

        // Create notification for buyer
        await supabaseClient.from("notifications").insert({
          user_id: buyerId,
          type: "marketplace_purchase",
          title: "Achat confirmé",
          message: `Votre achat a été confirmé. Le vendeur va vous contacter.`,
        });

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Update payment status
        await supabaseClient
          .from("marketplace_payments")
          .update({
            status: "failed",
          })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
