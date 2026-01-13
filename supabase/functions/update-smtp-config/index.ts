import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { clearSmtpConfigCache } from "../_shared/smtp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UpdateSmtpConfigRequest {
  smtp_host?: string;
  smtp_port?: string;
  smtp_user?: string;
  smtp_password?: string;
  sender_email?: string;
  sender_name?: string;
  email_mode?: 'test' | 'production';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify user is admin
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse request body
    let requestData: UpdateSmtpConfigRequest | null = null;
    try {
      requestData = await req.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: "Invalid request body format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!requestData) {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Prepare settings to update
    const settingsToUpdate: Array<{
      setting_key: string;
      setting_value: string;
      description: string;
    }> = [];

    if (requestData.email_mode !== undefined) {
      settingsToUpdate.push({
        setting_key: 'email_mode',
        setting_value: requestData.email_mode,
        description: 'Email sending mode (test/production)'
      });
    }

    if (requestData.smtp_host !== undefined) {
      settingsToUpdate.push({
        setting_key: 'smtp_host',
        setting_value: requestData.smtp_host,
        description: 'SMTP server hostname'
      });
    }

    if (requestData.smtp_port !== undefined) {
      settingsToUpdate.push({
        setting_key: 'smtp_port',
        setting_value: requestData.smtp_port,
        description: 'SMTP server port'
      });
    }

    if (requestData.smtp_user !== undefined) {
      settingsToUpdate.push({
        setting_key: 'smtp_user',
        setting_value: requestData.smtp_user,
        description: 'SMTP username'
      });
    }

    if (requestData.smtp_password !== undefined) {
      settingsToUpdate.push({
        setting_key: 'smtp_password',
        setting_value: requestData.smtp_password,
        description: 'SMTP password'
      });
    }

    if (requestData.sender_email !== undefined) {
      settingsToUpdate.push({
        setting_key: 'sender_email',
        setting_value: requestData.sender_email,
        description: 'Sender email address'
      });
    }

    if (requestData.sender_name !== undefined) {
      settingsToUpdate.push({
        setting_key: 'sender_name',
        setting_value: requestData.sender_name,
        description: 'Sender name'
      });
    }

    // Update settings in database
    for (const setting of settingsToUpdate) {
      const { error } = await supabaseAdmin
        .from("admin_settings")
        .upsert(setting, { onConflict: "setting_key" });

      if (error) {
        console.error("Error updating setting:", setting.setting_key, error);
        return new Response(
          JSON.stringify({
            error: `Failed to update ${setting.setting_key}`,
            details: error.message
          }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Clear SMTP config cache to force reload on next request
    clearSmtpConfigCache();

    console.log("SMTP configuration updated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "SMTP configuration updated successfully",
        updated: settingsToUpdate.map(s => s.setting_key)
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in update-smtp-config function:", error);
    return new Response(
      JSON.stringify({
        error: error?.message || "Internal server error"
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
