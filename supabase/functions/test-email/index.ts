import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  recipientEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail }: TestEmailRequest = await req.json();

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ error: "Email destinataire requis" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client to fetch settings
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch email configuration from admin_settings
    const { data: settings, error: settingsError } = await supabase
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

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la récupération des paramètres" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const configMap = (settings || []).reduce((acc, item) => {
      acc[item.setting_key] = item.setting_value;
      return acc;
    }, {} as Record<string, string | null>);

    const emailMode = configMap["email_mode"] || "test";
    
    let smtpHost: string;
    let smtpPort: number;
    let smtpUser: string;
    let smtpPassword: string;
    let senderEmail: string;
    let senderName: string;

    if (emailMode === "production") {
      // Use custom SMTP configuration
      smtpHost = configMap["smtp_host"] || "";
      smtpPort = parseInt(configMap["smtp_port"] || "587", 10);
      smtpUser = configMap["smtp_user"] || "";
      smtpPassword = configMap["smtp_password"] || "";
      senderEmail = configMap["sender_email"] || "";
      senderName = configMap["sender_name"] || "Aurora Society";

      if (!smtpHost || !smtpUser || !smtpPassword || !senderEmail) {
        return new Response(
          JSON.stringify({ 
            error: "Configuration SMTP production incomplète",
            details: "Veuillez configurer tous les champs SMTP en mode production"
          }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } else {
      // Use default Infomaniak SMTP (test mode)
      smtpHost = "mail.infomaniak.com";
      smtpPort = 587;
      smtpUser = Deno.env.get("SMTP_USER") || "";
      smtpPassword = Deno.env.get("SMTP_PASSWORD") || "";
      senderEmail = smtpUser;
      senderName = "Aurora Society";

      if (!smtpUser || !smtpPassword) {
        return new Response(
          JSON.stringify({ 
            error: "Credentials SMTP non configurés",
            details: "Les variables SMTP_USER et SMTP_PASSWORD ne sont pas définies"
          }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #d4af37; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { font-size: 28px; font-weight: bold; color: #d4af37; letter-spacing: 2px; }
          .content { background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border: 1px solid #d4af3730; border-radius: 12px; padding: 40px; }
          .title { font-size: 24px; color: #d4af37; margin-bottom: 20px; text-align: center; }
          .message { color: #d4af37cc; line-height: 1.8; font-size: 16px; }
          .info-box { background-color: #22c55e20; border: 1px solid #22c55e40; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .info-title { color: #22c55e; font-weight: 600; margin-bottom: 10px; }
          .info-text { color: #22c55ecc; font-size: 14px; }
          .footer { text-align: center; margin-top: 40px; color: #d4af3760; font-size: 12px; }
          .divider { height: 1px; background: linear-gradient(90deg, transparent, #d4af3730, transparent); margin: 30px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AURORA SOCIETY</div>
          </div>
          <div class="content">
            <h1 class="title">🧪 Test de configuration email</h1>
            <div class="divider"></div>
            <p class="message">
              Ceci est un email de test envoyé depuis le panneau d'administration Aurora Society.
            </p>
            <div class="info-box">
              <div class="info-title">✓ Configuration validée</div>
              <div class="info-text">
                <strong>Mode:</strong> ${emailMode === "production" ? "Production" : "Test (Infomaniak)"}<br>
                <strong>Serveur SMTP:</strong> ${smtpHost}<br>
                <strong>Port:</strong> ${smtpPort}<br>
                <strong>Expéditeur:</strong> ${senderName} &lt;${senderEmail}&gt;<br>
                <strong>Date:</strong> ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}
              </div>
            </div>
            <p class="message">
              Si vous recevez cet email, votre configuration SMTP fonctionne correctement.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Aurora Society. Tous droits réservés.</p>
            <p>Email de test envoyé depuis le panneau d'administration.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log(`Testing email with config: mode=${emailMode}, host=${smtpHost}, port=${smtpPort}, user=${smtpUser}`);

    // Create SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPassword,
        },
      },
    });

    // Send the test email
    await client.send({
      from: `${senderName} <${senderEmail}>`,
      to: recipientEmail,
      subject: `🧪 Test Email - Aurora Society (${emailMode === "production" ? "Production" : "Test"})`,
      content: "auto",
      html: htmlContent,
    });

    await client.close();

    console.log(`Test email sent successfully to ${recipientEmail}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email de test envoyé à ${recipientEmail}`,
        config: {
          mode: emailMode,
          host: smtpHost,
          port: smtpPort,
          sender: `${senderName} <${senderEmail}>`
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in test-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Vérifiez les paramètres SMTP (host, port, credentials)"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
