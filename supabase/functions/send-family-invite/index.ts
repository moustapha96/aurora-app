import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendEmail, getSmtpConfig, validateSmtpConfig } from "../_shared/smtp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FamilyInviteRequest {
  recipientEmail: string;
  senderName: string;
  inviteLink: string;
  linkName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, senderName, inviteLink, linkName }: FamilyInviteRequest = await req.json();

    if (!recipientEmail || !inviteLink) {
      throw new Error("Missing required fields");
    }

    const smtpConfig = await getSmtpConfig();
    const validation = validateSmtpConfig(smtpConfig);

    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: "SMTP not configured", details: validation.error }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" style="max-width: 600px; background: linear-gradient(145deg, #1a1a1a, #0d0d0d); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 16px; overflow: hidden;">
                <tr>
                  <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.1);">
                    <h1 style="margin: 0; color: #d4af37; font-size: 32px; font-weight: 300; letter-spacing: 4px;">AURORA</h1>
                    <p style="margin: 8px 0 0; color: rgba(212, 175, 55, 0.6); font-size: 12px; letter-spacing: 2px;">SOCIETY</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px; color: #ffffff; font-size: 24px; font-weight: 400;">Invitation exclusive</h2>
                    <p style="margin: 0 0 20px; color: rgba(255, 255, 255, 0.8); font-size: 16px; line-height: 1.6;">
                      <strong style="color: #d4af37;">${senderName}</strong> vous invite à rejoindre Aurora Society en tant que membre de son entourage proche.
                    </p>
                    ${linkName ? `<p style="margin: 0 0 20px; color: rgba(255, 255, 255, 0.6); font-size: 14px;">Invitation : <em>${linkName}</em></p>` : ''}
                    <div style="background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 12px; padding: 20px; margin: 24px 0;">
                      <p style="margin: 0 0 10px; color: rgba(255, 255, 255, 0.7); font-size: 14px;">En tant que membre associé, vous aurez accès à :</p>
                      <ul style="margin: 0; padding-left: 20px; color: rgba(255, 255, 255, 0.8); font-size: 14px; line-height: 1.8;">
                        <li>Profil Business</li>
                        <li>Section Lignage familial</li>
                        <li>Passions & Centres d'intérêt</li>
                        <li>Réseaux & Influence</li>
                      </ul>
                    </div>
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #d4af37, #b8962e); color: #000000; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; letter-spacing: 1px;">
                        ACCEPTER L'INVITATION
                      </a>
                    </div>
                    <p style="margin: 24px 0 0; color: rgba(255, 255, 255, 0.5); font-size: 12px; text-align: center;">
                      Si le bouton ne fonctionne pas, copiez ce lien :<br>
                      <a href="${inviteLink}" style="color: #d4af37; word-break: break-all;">${inviteLink}</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px 40px; border-top: 1px solid rgba(212, 175, 55, 0.1); text-align: center;">
                    <p style="margin: 0; color: rgba(255, 255, 255, 0.4); font-size: 12px;">
                      © ${new Date().getFullYear()} Aurora Society. Tous droits réservés.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const emailResult = await sendEmail({
      to: recipientEmail,
      subject: `${senderName} vous invite à rejoindre Aurora Society`,
      html: htmlContent,
      config: smtpConfig
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error || "Failed to send email");
    }

    console.log("Family invite email sent successfully to:", recipientEmail);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-family-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
