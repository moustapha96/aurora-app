import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Verify2FARequest {
  userId: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let requestData: Verify2FARequest | null = null;

  try {
    // Parse request body
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid request body format", valid: false }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!requestData) {
      return new Response(
        JSON.stringify({ error: "Invalid request body", valid: false }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { userId, code } = requestData;

    console.log("Received 2FA verification request:", { userId, codeLength: code?.length });

    if (!userId || !code) {
      console.error("Missing required fields:", { hasUserId: !!userId, hasCode: !!code });
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId and code are required", valid: false }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      console.error("Invalid code format:", { code, codeLength: code.length });
      return new Response(
        JSON.stringify({ error: "Invalid code format - must be 6 digits", valid: false }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase credentials not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error", valid: false }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Find the code
    const { data: codeData, error: selectError } = await supabaseAdmin
      .from("two_factor_codes")
      .select("*")
      .eq("user_id", userId)
      .eq("code", code)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (selectError) {
      console.error("Error selecting 2FA code:", {
        error: selectError,
        message: selectError.message,
        code: selectError.code,
        userId: userId
      });
      return new Response(
        JSON.stringify({ error: "Error verifying code", valid: false }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!codeData) {
      console.log("Invalid or expired 2FA code for user:", userId, "code:", code);
      return new Response(
        JSON.stringify({ error: "Invalid or expired code", valid: false }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark code as used
    await supabaseAdmin
      .from("two_factor_codes")
      .update({ used: true })
      .eq("id", codeData.id);

    // Clean up old codes for this user
    await supabaseAdmin
      .from("two_factor_codes")
      .delete()
      .eq("user_id", userId)
      .lt("expires_at", new Date().toISOString());

    console.log("2FA code verified successfully for user:", userId);

    return new Response(
      JSON.stringify({ success: true, valid: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in verify-2fa-code function:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      userId: requestData?.userId
    });
    return new Response(
      JSON.stringify({ 
        error: error?.message || "Internal server error", 
        valid: false 
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);