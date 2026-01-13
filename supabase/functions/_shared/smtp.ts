import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
}

// Cache for SMTP config to avoid repeated database queries
let smtpConfigCache: SmtpConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60000; // 1 minute cache

export async function getSmtpConfig(): Promise<SmtpConfig> {
  // Return cached config if still valid
  const now = Date.now();
  if (smtpConfigCache && (now - cacheTimestamp) < CACHE_TTL) {
    return smtpConfigCache;
  }

  // Try to get config from database first
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (supabaseUrl && supabaseServiceKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      const { data: settings, error } = await supabaseAdmin
        .from("admin_settings")
        .select("setting_key, setting_value")
        .in("setting_key", [
          "email_mode",
          "smtp_host",
          "smtp_port",
          "smtp_user",
          "smtp_password",
          "sender_email",
          "sender_name"
        ]);

      if (!error && settings && settings.length > 0) {
        const configMap = settings.reduce((acc, item) => {
          acc[item.setting_key] = item.setting_value;
          return acc;
        }, {} as Record<string, string | null>);

        const emailMode = configMap["email_mode"] || "test";
        
        // Mode production: use database config
        if (emailMode === "production" && configMap["smtp_host"] && configMap["smtp_user"]) {
          const host = configMap["smtp_host"] || "";
          const port = parseInt(configMap["smtp_port"] || "587", 10);
          const user = configMap["smtp_user"] || "";
          const pass = configMap["smtp_password"] || "";
          const fromEmail = configMap["sender_email"] || user;
          const fromName = configMap["sender_name"] || "Aurora Society";

          smtpConfigCache = {
            host,
            port,
            secure: port === 465,
            user,
            pass,
            fromEmail,
            fromName
          };
          cacheTimestamp = now;
          return smtpConfigCache;
        }
      }
    }
  } catch (error) {
    console.warn("Error loading SMTP config from database, falling back to environment variables:", error);
  }

  // Fallback to environment variables
  const host = Deno.env.get("SMTP_HOST") || "";
  const port = parseInt(Deno.env.get("SMTP_PORT") || "587", 10);
  const secure = port === 465;
  const user = Deno.env.get("SMTP_USER") || "";
  const pass = Deno.env.get("SMTP_PASS") || "";
  const fromEmail = Deno.env.get("SMTP_FROM_EMAIL") || user;
  const fromName = Deno.env.get("SMTP_FROM_NAME") || "Aurora Society";

  console.log("SMTP Config from env vars:", {
    host: host || "(empty)",
    port,
    user: user ? user.substring(0, 5) + "***" : "(empty)",
    fromEmail: fromEmail || "(empty)"
  });

  smtpConfigCache = { host, port, secure, user, pass, fromEmail, fromName };
  cacheTimestamp = now;
  return smtpConfigCache;
}

// Function to clear cache (useful after updating config)
export function clearSmtpConfigCache() {
  smtpConfigCache = null;
  cacheTimestamp = 0;
}

export function validateSmtpConfig(config: SmtpConfig): { valid: boolean; error?: string } {
  // For Resend, we just need the API key
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (resendApiKey) {
    return { valid: true }; // Resend is configured
  }
  
  // Fallback to SMTP validation
  if (!config.host) {
    return { valid: false, error: "SMTP_HOST not configured and RESEND_API_KEY not available" };
  }
  if (!config.user) {
    return { valid: false, error: "SMTP_USER not configured" };
  }
  if (!config.pass) {
    return { valid: false, error: "SMTP_PASS not configured" };
  }
  return { valid: true };
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  config?: SmtpConfig;
}): Promise<{ success: boolean; error?: string }> {
  const config = options.config || await getSmtpConfig();
  
  // Try Resend first (preferred method)
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (resendApiKey) {
    try {
      console.log("Sending email via Resend to:", options.to);
      const resend = new Resend(resendApiKey);
      
      // Use the configured sender or default
      const fromAddress = config.fromEmail 
        ? `${config.fromName || "Aurora Society"} <${config.fromEmail}>`
        : "Aurora Society <onboarding@resend.dev>";

      const emailResponse = await resend.emails.send({
        from: fromAddress,
        to: [options.to],
        subject: options.subject,
        html: options.html,
      });

      console.log("Email sent successfully via Resend:", emailResponse);
      return { success: true };
    } catch (error: any) {
      console.error("Resend error:", error);
      
      let errorMessage = error?.message || "Unknown Resend error";
      if (error?.message?.includes("domain")) {
        errorMessage = "Erreur Resend: domaine non vérifié. Utilisez onboarding@resend.dev ou vérifiez votre domaine sur resend.com";
      } else if (error?.message?.includes("API key")) {
        errorMessage = "Erreur Resend: clé API invalide";
      }
      
      return { success: false, error: errorMessage };
    }
  }

  // Fallback to SMTP (basic validation only - Resend is preferred)
  const validation = validateSmtpConfig(config);
  if (!validation.valid) {
    console.error("SMTP validation failed:", validation.error);
    return { success: false, error: validation.error };
  }

  // SMTP fallback - return error suggesting Resend
  return { 
    success: false, 
    error: "RESEND_API_KEY non configuré. Veuillez configurer Resend pour l'envoi d'emails." 
  };
}
