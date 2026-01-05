import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { link_code } = await req.json();

    if (!link_code) {
      return new Response(
        JSON.stringify({ error: "link_code is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Récupérer le lien
    const { data: link, error: linkError } = await supabaseClient
      .from("referral_links")
      .select("id, is_active, expires_at, click_count")
      .eq("link_code", link_code)
      .single();

    if (linkError || !link) {
      return new Response(
        JSON.stringify({ error: "Link not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Vérifier si le lien est actif
    if (!link.is_active) {
      return new Response(
        JSON.stringify({ error: "Link is not active" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Vérifier l'expiration
    if (link.expires_at) {
      const expiresAt = new Date(link.expires_at);
      if (expiresAt < new Date()) {
        return new Response(
          JSON.stringify({ error: "Link has expired" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Récupérer les informations de la requête
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const referer = req.headers.get("referer") || null;

    // Enregistrer le clic
    const { error: clickError } = await supabaseClient
      .from("referral_link_clicks")
      .insert({
        link_id: link.id,
        ip_address: ipAddress,
        user_agent: userAgent,
        referer: referer,
      });

    if (clickError) {
      console.error("Error inserting click:", clickError);
      // Ne pas échouer si l'insertion du clic échoue
    }

    // Incrémenter le compteur de clics
    const { error: updateError } = await supabaseClient
      .from("referral_links")
      .update({ click_count: (link.click_count || 0) + 1 })
      .eq("id", link.id);

    if (updateError) {
      console.error("Error updating click count:", updateError);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Click tracked" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

