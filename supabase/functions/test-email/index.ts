import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendEmail, getSmtpConfig, validateSmtpConfig } from "../_shared/smtp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TestEmailRequest {
  recipientEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
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

    const smtpConfig = await getSmtpConfig();
    const validation = validateSmtpConfig(smtpConfig);

    if (!validation.valid) {
      return new Response(
        JSON.stringify({ 
          error: "SMTP non configuré",
          details: validation.error
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
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
                <strong>Serveur SMTP:</strong> ${smtpConfig.host}<br>
                <strong>Port:</strong> ${smtpConfig.port}<br>
                <strong>Expéditeur:</strong> ${smtpConfig.fromName} &lt;${smtpConfig.fromEmail}&gt;<br>
                <strong>Date:</strong> ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}
              </div>
            </div>
            <p class="message">
              Si vous recevez cet email, votre configuration SMTP fonctionne correctement.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Aurora Society. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log(`Testing email with config: host=${smtpConfig.host}, port=${smtpConfig.port}, user=${smtpConfig.user.substring(0, 3)}***`);

    const emailResult = await sendEmail({
      to: recipientEmail,
      subject: `🧪 Test Email - Aurora Society`,
      html: htmlContent,
      config: smtpConfig
    });

    if (!emailResult.success) {
      return new Response(
        JSON.stringify({ 
          error: emailResult.error,
          details: "Vérifiez les paramètres SMTP (host, port, credentials)"
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Test email sent successfully to ${recipientEmail}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email de test envoyé à ${recipientEmail}`,
        config: {
          host: smtpConfig.host,
          port: smtpConfig.port,
          sender: `${smtpConfig.fromName} <${smtpConfig.fromEmail}>`
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in test-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Vérifiez les paramètres SMTP"
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
