import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail, getSmtpConfig, validateSmtpConfig } from "../_shared/smtp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Send2FARequest {
  userId: string;
  email: string;
  language?: string;
}

const translations: Record<string, { subject: string; title: string; code: string; validity: string; warning: string }> = {
  fr: {
    subject: "Code de vérification Aurora Society",
    title: "Votre code de vérification",
    code: "Votre code de connexion est :",
    validity: "Ce code est valide pendant 5 minutes.",
    warning: "Si vous n'avez pas demandé ce code, veuillez ignorer cet email."
  },
  en: {
    subject: "Aurora Society Verification Code",
    title: "Your verification code",
    code: "Your login code is:",
    validity: "This code is valid for 5 minutes.",
    warning: "If you did not request this code, please ignore this email."
  },
  es: {
    subject: "Código de verificación Aurora Society",
    title: "Su código de verificación",
    code: "Su código de inicio de sesión es:",
    validity: "Este código es válido durante 5 minutos.",
    warning: "Si no solicitó este código, ignore este correo electrónico."
  },
  de: {
    subject: "Aurora Society Verifizierungscode",
    title: "Ihr Verifizierungscode",
    code: "Ihr Login-Code lautet:",
    validity: "Dieser Code ist 5 Minuten gültig.",
    warning: "Wenn Sie diesen Code nicht angefordert haben, ignorieren Sie diese E-Mail."
  },
  it: {
    subject: "Codice di verifica Aurora Society",
    title: "Il tuo codice di verifica",
    code: "Il tuo codice di accesso è:",
    validity: "Questo codice è valido per 5 minuti.",
    warning: "Se non hai richiesto questo codice, ignora questa email."
  },
  pt: {
    subject: "Código de verificação Aurora Society",
    title: "Seu código de verificação",
    code: "Seu código de login é:",
    validity: "Este código é válido por 5 minutos.",
    warning: "Se você não solicitou este código, ignore este email."
  },
  ar: {
    subject: "رمز التحقق من Aurora Society",
    title: "رمز التحقق الخاص بك",
    code: "رمز تسجيل الدخول الخاص بك هو:",
    validity: "هذا الرمز صالح لمدة 5 دقائق.",
    warning: "إذا لم تطلب هذا الرمز، يرجى تجاهل هذا البريد الإلكتروني."
  },
  ja: {
    subject: "Aurora Society 認証コード",
    title: "認証コード",
    code: "ログインコード:",
    validity: "このコードは5分間有効です。",
    warning: "このコードをリクエストしていない場合は、このメールを無視してください。"
  },
  zh: {
    subject: "Aurora Society 验证码",
    title: "您的验证码",
    code: "您的登录验证码是:",
    validity: "此验证码有效期为5分钟。",
    warning: "如果您没有请求此验证码，请忽略此邮件。"
  },
  ru: {
    subject: "Код подтверждения Aurora Society",
    title: "Ваш код подтверждения",
    code: "Ваш код входа:",
    validity: "Этот код действителен в течение 5 минут.",
    warning: "Если вы не запрашивали этот код, проигнорируйте это письмо."
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let requestData: Send2FARequest | null = null;

  try {
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
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
    
    const { userId, email, language = 'fr' } = requestData;

    console.log("Received 2FA request:", { userId, email: email?.substring(0, 3) + "***", language });

    if (!userId || !email) {
      console.error("Missing required fields:", { hasUserId: !!userId, hasEmail: !!email });
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId and email are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate SMTP configuration
    const smtpConfig = await getSmtpConfig();
    const validation = validateSmtpConfig(smtpConfig);
    
    if (!validation.valid) {
      console.error("SMTP not configured:", validation.error);
      return new Response(
        JSON.stringify({ 
          error: "SMTP not configured",
          details: validation.error
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration to 5 minutes from now
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase credentials not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Delete any existing unused codes for this user
    try {
      await supabaseAdmin
        .from("two_factor_codes")
        .delete()
        .eq("user_id", userId)
        .eq("used", false);
    } catch (deleteError) {
      console.error("Error deleting old codes (non-critical):", deleteError);
    }

    // Insert new code
    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from("two_factor_codes")
      .insert({
        user_id: userId,
        code,
        expires_at: expiresAt,
        used: false
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting 2FA code:", insertError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to generate code",
          details: insertError.message 
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("2FA code inserted successfully:", { userId, codeId: insertedData.id });

    // Get translation
    const t = translations[language] || translations.fr;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Invalid email format:", email);
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Prepare HTML content
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; margin: 0; padding: 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border: 1px solid #d4af37; border-radius: 12px; padding: 40px; text-align: center;">
    <div style="font-size: 28px; font-weight: bold; color: #d4af37; letter-spacing: 2px; margin-bottom: 20px;">AURORA SOCIETY</div>
    <h1 style="color: #d4af37; font-size: 24px; margin-bottom: 30px; font-weight: 400; letter-spacing: 2px;">${t.title}</h1>
    <p style="color: #d4af37; opacity: 0.8; margin-bottom: 20px;">${t.code}</p>
    <div style="background: rgba(212, 175, 55, 0.1); border: 2px solid #d4af37; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <span style="font-size: 36px; font-weight: bold; color: #d4af37; letter-spacing: 8px;">${code}</span>
    </div>
    <p style="color: #d4af37; opacity: 0.6; font-size: 14px; margin-top: 20px;">${t.validity}</p>
    <p style="color: #d4af37; opacity: 0.4; font-size: 12px; margin-top: 30px;">${t.warning}</p>
  </div>
</body>
</html>`;

    // Send email using shared SMTP service
    const emailResult = await sendEmail({
      to: email,
      subject: t.subject,
      html: htmlContent,
      config: smtpConfig
    });

    if (!emailResult.success) {
      // Delete the code since email failed
      try {
        await supabaseAdmin
          .from("two_factor_codes")
          .delete()
          .eq("user_id", userId)
          .eq("code", code)
          .eq("used", false);
        console.log("Cleaned up failed code from database");
      } catch (deleteError) {
        console.error("Error deleting failed code:", deleteError);
      }
      
      return new Response(
        JSON.stringify({ error: `Failed to send email: ${emailResult.error}` }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-2fa-code function:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
