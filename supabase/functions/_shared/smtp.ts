import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { SMTPClient, SendConfig } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
  provider: 'smtp' | 'resend';
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
          "email_provider",
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
        const emailProvider = (configMap["email_provider"] || "resend") as 'smtp' | 'resend';
        
        // Mode production: use database config
        if (emailMode === "production") {
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
            fromName,
            provider: emailProvider
          };
          cacheTimestamp = now;
          console.log(`SMTP Config loaded (production mode, provider: ${emailProvider}):`, {
            host: host || "(empty)",
            port,
            user: user ? user.substring(0, 5) + "***" : "(empty)",
            fromEmail: fromEmail || "(empty)"
          });
          return smtpConfigCache;
        }
      }
    }
  } catch (error) {
    console.warn("Error loading SMTP config from database, falling back to environment variables:", error);
  }

  // Fallback to environment variables (test mode)
  const host = Deno.env.get("SMTP_HOST") || "";
  const port = parseInt(Deno.env.get("SMTP_PORT") || "587", 10);
  const secure = port === 465;
  const user = Deno.env.get("SMTP_USER") || "";
  const pass = Deno.env.get("SMTP_PASS") || "";
  const fromEmail = Deno.env.get("SMTP_FROM_EMAIL") || user;
  const fromName = Deno.env.get("SMTP_FROM_NAME") || "Aurora Society";

  // In test mode, default to Resend if available
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const provider: 'smtp' | 'resend' = resendApiKey ? 'resend' : 'smtp';

  console.log("SMTP Config from env vars (test mode):", {
    host: host || "(empty)",
    port,
    user: user ? user.substring(0, 5) + "***" : "(empty)",
    fromEmail: fromEmail || "(empty)",
    provider
  });

  smtpConfigCache = { host, port, secure, user, pass, fromEmail, fromName, provider };
  cacheTimestamp = now;
  return smtpConfigCache;
}

// Function to clear cache (useful after updating config)
export function clearSmtpConfigCache() {
  smtpConfigCache = null;
  cacheTimestamp = 0;
}

export function validateSmtpConfig(config: SmtpConfig): { valid: boolean; error?: string } {
  // For Resend provider, we just need the API key
  if (config.provider === 'resend') {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      return { valid: true };
    }
    return { valid: false, error: "RESEND_API_KEY non configuré. Ajoutez la clé API Resend ou utilisez un serveur SMTP." };
  }
  
  // For SMTP provider, validate SMTP config
  if (!config.host) {
    return { valid: false, error: "Serveur SMTP non configuré (host manquant)" };
  }
  if (!config.user) {
    return { valid: false, error: "Utilisateur SMTP non configuré" };
  }
  if (!config.pass) {
    return { valid: false, error: "Mot de passe SMTP non configuré" };
  }
  if (!config.fromEmail) {
    return { valid: false, error: "Email expéditeur non configuré" };
  }
  return { valid: true };
}

async function sendViaResend(options: {
  to: string;
  subject: string;
  html: string;
  config: SmtpConfig;
}): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return { success: false, error: "RESEND_API_KEY non configuré" };
  }

  try {
    console.log("Sending email via Resend to:", options.to);
    const resend = new Resend(resendApiKey);
    
    // Use the configured sender or default
    const fromAddress = options.config.fromEmail 
      ? `${options.config.fromName || "Aurora Society"} <${options.config.fromEmail}>`
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
    
    let errorMessage = error?.message || "Erreur Resend inconnue";
    if (error?.message?.includes("domain")) {
      errorMessage = "Erreur Resend: domaine non vérifié. Utilisez onboarding@resend.dev ou vérifiez votre domaine sur resend.com";
    } else if (error?.message?.includes("API key")) {
      errorMessage = "Erreur Resend: clé API invalide";
    }
    
    return { success: false, error: errorMessage };
  }
}

async function sendViaSmtp(options: {
  to: string;
  subject: string;
  html: string;
  config: SmtpConfig;
}): Promise<{ success: boolean; error?: string }> {
  const { config } = options;
  
  try {
    console.log(`Sending email via SMTP to: ${options.to}`);
    console.log(`SMTP Config: host=${config.host}, port=${config.port}, secure=${config.secure}`);

    const client = new SMTPClient({
      connection: {
        hostname: config.host,
        port: config.port,
        tls: config.secure,
        auth: {
          username: config.user,
          password: config.pass,
        },
      },
    });

    const sendConfig: SendConfig = {
      from: `${config.fromName} <${config.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      content: "Email HTML - veuillez utiliser un client compatible HTML",
      html: options.html,
    };

    await client.send(sendConfig);
    await client.close();

    console.log("Email sent successfully via SMTP");
    return { success: true };
  } catch (error: any) {
    console.error("SMTP error:", error);
    
    let errorMessage = error?.message || "Erreur SMTP inconnue";
    
    // Parse common SMTP errors
    if (errorMessage.includes("authentication") || errorMessage.includes("AUTH") || errorMessage.includes("535")) {
      errorMessage = "Erreur d'authentification SMTP: vérifiez l'utilisateur et le mot de passe";
    } else if (errorMessage.includes("connect") || errorMessage.includes("ECONNREFUSED")) {
      errorMessage = "Erreur de connexion au serveur SMTP: vérifiez l'adresse et le port";
    } else if (errorMessage.includes("tls") || errorMessage.includes("TLS") || errorMessage.includes("SSL")) {
      errorMessage = "Erreur TLS/SSL: essayez le port 587 (STARTTLS) ou 465 (SSL)";
    } else if (errorMessage.includes("timeout")) {
      errorMessage = "Délai d'attente dépassé: le serveur SMTP ne répond pas";
    } else if (errorMessage.includes("certificate")) {
      errorMessage = "Erreur de certificat SSL: le certificat du serveur n'est pas valide";
    }
    
    return { success: false, error: errorMessage };
  }
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  config?: SmtpConfig;
}): Promise<{ success: boolean; error?: string }> {
  const config = options.config || await getSmtpConfig();
  
  // Validate config
  const validation = validateSmtpConfig(config);
  if (!validation.valid) {
    console.error("SMTP validation failed:", validation.error);
    return { success: false, error: validation.error };
  }

  // Choose provider based on config
  if (config.provider === 'resend') {
    return sendViaResend({ ...options, config });
  } else {
    return sendViaSmtp({ ...options, config });
  }
}
