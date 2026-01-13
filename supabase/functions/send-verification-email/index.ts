import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendEmail, getSmtpConfig, validateSmtpConfig } from "../_shared/smtp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  firstName: string;
  lastName: string;
  status: 'verified' | 'rejected' | 'pending';
  rejectionReason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName, status, rejectionReason }: VerificationEmailRequest = await req.json();

    if (!email || !firstName || !status) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const smtpConfig = await getSmtpConfig();
    const validation = validateSmtpConfig(smtpConfig);

    if (!validation.valid) {
      console.error("SMTP credentials not configured");
      return new Response(
        JSON.stringify({ error: "SMTP not configured", details: validation.error }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let subject = "";
    let htmlContent = "";

    const baseStyles = `
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #d4af37; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 28px; font-weight: bold; color: #d4af37; letter-spacing: 2px; }
        .content { background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border: 1px solid #d4af3730; border-radius: 12px; padding: 40px; }
        .title { font-size: 24px; color: #d4af37; margin-bottom: 20px; text-align: center; }
        .message { color: #d4af37cc; line-height: 1.8; font-size: 16px; }
        .status-badge { display: inline-block; padding: 8px 20px; border-radius: 20px; font-weight: 600; margin: 20px 0; }
        .status-verified { background-color: #22c55e20; color: #22c55e; border: 1px solid #22c55e40; }
        .status-rejected { background-color: #ef444420; color: #ef4444; border: 1px solid #ef444440; }
        .status-pending { background-color: #f59e0b20; color: #f59e0b; border: 1px solid #f59e0b40; }
        .button { display: inline-block; background: linear-gradient(135deg, #d4af37, #c5a028); color: #000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
        .footer { text-align: center; margin-top: 40px; color: #d4af3760; font-size: 12px; }
        .divider { height: 1px; background: linear-gradient(90deg, transparent, #d4af3730, transparent); margin: 30px 0; }
      </style>
    `;

    const siteUrl = Deno.env.get("SITE_URL") || "https://app.aurorasociety.ch";

    if (status === 'verified') {
      subject = "✓ Votre identité a été vérifiée - Aurora Society";
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">AURORA SOCIETY</div>
            </div>
            <div class="content">
              <h1 class="title">Félicitations, ${firstName} !</h1>
              <div style="text-align: center;">
                <span class="status-badge status-verified">✓ Identité Vérifiée</span>
              </div>
              <div class="divider"></div>
              <p class="message">
                Nous avons le plaisir de vous confirmer que votre vérification d'identité a été approuvée.
              </p>
              <p class="message">
                Vous pouvez désormais accéder à l'ensemble des privilèges et services exclusifs réservés aux membres de l'Aurora Society.
              </p>
              <div style="text-align: center; margin-top: 30px;">
                <a href="${siteUrl}/login" class="button">
                  Accéder à mon espace
                </a>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Aurora Society. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (status === 'rejected') {
      subject = "Vérification d'identité non approuvée - Aurora Society";
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">AURORA SOCIETY</div>
            </div>
            <div class="content">
              <h1 class="title">Cher(e) ${firstName},</h1>
              <div style="text-align: center;">
                <span class="status-badge status-rejected">Vérification non approuvée</span>
              </div>
              <div class="divider"></div>
              <p class="message">
                Nous regrettons de vous informer que votre demande de vérification d'identité n'a pas pu être approuvée.
              </p>
              ${rejectionReason ? `<p class="message"><strong>Raison :</strong> ${rejectionReason}</p>` : ''}
              <p class="message">
                Vous pouvez soumettre une nouvelle demande en vous connectant à votre compte.
              </p>
              <div style="text-align: center; margin-top: 30px;">
                <a href="${siteUrl}/register?step=verification" class="button">
                  Relancer la vérification
                </a>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Aurora Society. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      subject = "Vérification en cours - Aurora Society";
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">AURORA SOCIETY</div>
            </div>
            <div class="content">
              <h1 class="title">Cher(e) ${firstName},</h1>
              <div style="text-align: center;">
                <span class="status-badge status-pending">⏳ Vérification en cours</span>
              </div>
              <div class="divider"></div>
              <p class="message">
                Nous avons bien reçu votre demande de vérification d'identité.
              </p>
              <p class="message">
                Notre équipe examine actuellement votre dossier. Ce processus peut prendre quelques heures.
              </p>
              <div style="text-align: center; margin-top: 30px;">
                <a href="${siteUrl}/login" class="button">
                  Vérifier mon statut
                </a>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Aurora Society. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    const emailResult = await sendEmail({
      to: email,
      subject: subject,
      html: htmlContent,
      config: smtpConfig
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error || "Failed to send email");
    }

    console.log(`Verification email sent successfully to ${email}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-verification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
