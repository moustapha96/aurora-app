import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-LIST-SUBSCRIPTIONS] ${step}${detailsStr}`);
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

    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");

    // Check if user is admin
    const { data: isAdmin, error: roleError } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError) throw new Error(`Role check error: ${roleError.message}`);
    if (!isAdmin) throw new Error("Access denied: Admin role required");

    logStep("Admin verified", { userId: user.id });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get all subscriptions from Stripe
    const [activeSubscriptions, trialingSubscriptions, pastDueSubscriptions, canceledSubscriptions] = await Promise.all([
      stripe.subscriptions.list({ status: "active", limit: 100 }),
      stripe.subscriptions.list({ status: "trialing", limit: 100 }),
      stripe.subscriptions.list({ status: "past_due", limit: 100 }),
      stripe.subscriptions.list({ status: "canceled", limit: 50 }),
    ]);

    logStep("Fetched subscriptions from Stripe", {
      active: activeSubscriptions.data.length,
      trialing: trialingSubscriptions.data.length,
      pastDue: pastDueSubscriptions.data.length,
      canceled: canceledSubscriptions.data.length,
    });

    const allSubscriptions = [
      ...activeSubscriptions.data,
      ...trialingSubscriptions.data,
      ...pastDueSubscriptions.data,
      ...canceledSubscriptions.data,
    ];

    // Collect unique customer IDs and product IDs
    const customerIds = new Set<string>();
    const productIds = new Set<string>();

    for (const sub of allSubscriptions) {
      if (typeof sub.customer === "string") {
        customerIds.add(sub.customer);
      }
      const priceItem = sub.items?.data?.[0];
      const productId = priceItem?.price?.product;
      if (typeof productId === "string") {
        productIds.add(productId);
      }
    }

    // Fetch all customers and products in parallel
    const [customers, products] = await Promise.all([
      Promise.all(Array.from(customerIds).map(id => stripe.customers.retrieve(id))),
      Promise.all(Array.from(productIds).map(id => stripe.products.retrieve(id))),
    ]);

    const customerMap = new Map<string, { email: string; name: string | null }>();
    for (const customer of customers) {
      if ('email' in customer && customer.email) {
        customerMap.set(customer.id, {
          email: customer.email,
          name: customer.name || null,
        });
      }
    }

    const productMap = new Map<string, string>();
    for (const product of products) {
      productMap.set(product.id, product.name);
    }

    logStep("Fetched customer and product details", {
      customers: customerMap.size,
      products: productMap.size,
    });

    // Collect all unique emails to find corresponding profiles
    const emails = Array.from(customerMap.values()).map(c => c.email);
    
    // Fetch profiles by email
    const { data: profiles } = await supabaseClient
      .from('profiles')
      .select('id, first_name, last_name, email, avatar_url')
      .in('email', emails);

    const profileMap = new Map<string, { id: string; first_name: string; last_name: string; avatar_url: string | null }>();
    if (profiles) {
      for (const profile of profiles) {
        if (profile.email) {
          profileMap.set(profile.email.toLowerCase(), {
            id: profile.id,
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            avatar_url: profile.avatar_url,
          });
        }
      }
    }

    logStep("Matched profiles", { count: profileMap.size });

    // Build subscription data
    const subscriptionsData = [];

    for (const sub of allSubscriptions) {
      const customerId = typeof sub.customer === "string" ? sub.customer : "";
      const customer = customerMap.get(customerId);
      const email = customer?.email || "";
      const profile = profileMap.get(email.toLowerCase());

      const priceItem = sub.items?.data?.[0];
      const price = priceItem?.price;
      const productId = typeof price?.product === "string" ? price.product : "";
      const productName = productMap.get(productId) || productId || "Subscription";

      subscriptionsData.push({
        id: sub.id,
        status: sub.status,
        customer_id: customerId,
        customer_email: email,
        customer_name: customer?.name || null,
        profile_id: profile?.id || null,
        profile_first_name: profile?.first_name || null,
        profile_last_name: profile?.last_name || null,
        profile_avatar_url: profile?.avatar_url || null,
        product_id: productId,
        product_name: productName,
        price_id: price?.id || "",
        amount: price?.unit_amount ? price.unit_amount / 100 : 0,
        currency: price?.currency?.toUpperCase() || "EUR",
        interval: price?.recurring?.interval || "month",
        current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
        current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
        cancel_at_period_end: sub.cancel_at_period_end,
        canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
        created: sub.created ? new Date(sub.created * 1000).toISOString() : null,
      });
    }

    // Sort by status (active first) then by created date
    subscriptionsData.sort((a, b) => {
      const statusOrder: Record<string, number> = { active: 0, trialing: 1, past_due: 2, canceled: 3 };
      const orderA = statusOrder[a.status] ?? 99;
      const orderB = statusOrder[b.status] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime();
    });

    // Compute stats
    const stats = {
      total: subscriptionsData.length,
      active: subscriptionsData.filter(s => s.status === 'active').length,
      trialing: subscriptionsData.filter(s => s.status === 'trialing').length,
      pastDue: subscriptionsData.filter(s => s.status === 'past_due').length,
      canceled: subscriptionsData.filter(s => s.status === 'canceled').length,
      totalRevenue: subscriptionsData
        .filter(s => s.status === 'active' || s.status === 'trialing')
        .reduce((sum, s) => sum + s.amount, 0),
    };

    logStep("Returning subscriptions", { count: subscriptionsData.length, stats });

    return new Response(JSON.stringify({
      subscriptions: subscriptionsData,
      stats,
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
