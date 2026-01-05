import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour window
const RATE_LIMIT_MAX_REQUESTS = 3; // Max 3 requests per IP per hour for unauthenticated users
const RATE_LIMIT_MAX_AUTHENTICATED = 10; // Max 10 requests per hour for authenticated users

// In-memory rate limit store (resets on function restart, but provides basic protection)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(ip: string, isAuthenticated: boolean): string {
  return `${ip}:${isAuthenticated ? 'auth' : 'anon'}`;
}

function checkRateLimit(key: string, maxRequests: number): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    // New window
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: maxRequests - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }
  
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetIn: record.resetTime - now };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    // Check if user is authenticated (will be verified later)
    const authHeader = req.headers.get("Authorization");
    const isAuthenticated = !!authHeader;
    
    // Apply rate limiting
    const rateLimitKey = getRateLimitKey(clientIP, isAuthenticated);
    const maxRequests = isAuthenticated ? RATE_LIMIT_MAX_AUTHENTICATED : RATE_LIMIT_MAX_REQUESTS;
    const rateLimit = checkRateLimit(rateLimitKey, maxRequests);
    
    if (!rateLimit.allowed) {
      console.log(`Rate limit exceeded for IP: ${clientIP}, authenticated: ${isAuthenticated}`);
      return new Response(
        JSON.stringify({ 
          error: "Trop de requêtes. Veuillez réessayer plus tard.",
          retryAfter: Math.ceil(rateLimit.resetIn / 1000)
        }),
        {
          status: 429,
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000))
          },
        }
      );
    }

    const { subject, category, message, email, phone } = await req.json();

    // Input validation
    if (!subject || !category || !message) {
      return new Response(
        JSON.stringify({ error: "Subject, category, and message are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate input lengths to prevent abuse
    if (subject.length > 200) {
      return new Response(
        JSON.stringify({ error: "Le sujet est trop long (max 200 caractères)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (message.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Le message est trop long (max 5000 caractères)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (email && email.length > 255) {
      return new Response(
        JSON.stringify({ error: "L'email est trop long (max 255 caractères)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Basic email format validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "Format d'email invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Contact form submission from IP: ${clientIP}, authenticated: ${isAuthenticated}, remaining: ${rateLimit.remaining}`);

    // Create Supabase client with service role key
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

    // Get user info if authenticated
    const authHeader = req.headers.get("Authorization");
    let userEmail = email || "Non fourni";
    let userName = "Visiteur";
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      if (user) {
        userId = user.id;
        userEmail = user.email || email || "Non fourni";
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single();
        if (profile) {
          userName = `${profile.first_name} ${profile.last_name}`;
        }
      }
    }

    // Category labels
    const categoryLabels: { [key: string]: string } = {
      general: "Question générale",
      technical: "Problème technique",
      account: "Gestion du compte",
      billing: "Facturation",
      partnership: "Partenariat",
      feedback: "Suggestion / Feedback",
      other: "Autre",
    };

    // Prepare email content
    const emailSubject = `[Aurora Society] ${categoryLabels[category] || category}: ${subject}`;
    const emailBody = `
Nouveau message de contact depuis Aurora Society

Catégorie: ${categoryLabels[category] || category}
Sujet: ${subject}

Message:
${message}

---
Informations du contact:
Nom: ${userName}
Email: ${userEmail}
Téléphone: ${phone || "Non fourni"}

---
Ce message a été envoyé depuis le formulaire de contact de Aurora Society.
    `.trim();

    // Store message in database first
    const { data: insertedMessage, error: insertError } = await supabaseClient
      .from("contact_messages")
      .insert({
        subject: emailSubject,
        category: category,
        message: message,
        email: userEmail,
        phone: phone || null,
        user_name: userName,
        user_id: userId,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error storing contact message:", insertError);
      // Continue even if storage fails
    }

    // Envoyer l'email via Resend si configuré
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_API_KEY) {
      try {
        // 1. Envoyer l'email à l'équipe Aurora
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Aurora Society <noreply@aurorasociety.ch>",
            to: ["contact@aurorasociety.ch"],
            reply_to: userEmail !== "Non fourni" ? userEmail : undefined,
            subject: emailSubject,
            text: emailBody,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #d4af37;">Nouveau message de contact depuis Aurora Society</h2>
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>Catégorie:</strong> ${categoryLabels[category] || category}</p>
                  <p><strong>Sujet:</strong> ${subject}</p>
                </div>
                <div style="margin: 20px 0;">
                  <h3 style="color: #333;">Message:</h3>
                  <p style="white-space: pre-wrap; background-color: #fafafa; padding: 15px; border-left: 3px solid #d4af37;">${message}</p>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                  <h3 style="color: #333; font-size: 14px;">Informations du contact:</h3>
                  <p style="font-size: 14px; color: #666;">Nom: ${userName}</p>
                  <p style="font-size: 14px; color: #666;">Email: ${userEmail}</p>
                  <p style="font-size: 14px; color: #666;">Téléphone: ${phone || "Non fourni"}</p>
                </div>
                <p style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
                  Ce message a été envoyé depuis le formulaire de contact de Aurora Society.
                </p>
              </div>
            `,
          }),
        });

        if (!resendResponse.ok) {
          const errorText = await resendResponse.text();
          console.error("Error sending email to team via Resend:", errorText);
        } else {
          // Mettre à jour le statut du message si l'email a été envoyé
          if (insertedMessage?.id) {
            await supabaseClient
              .from("contact_messages")
              .update({ status: "sent" })
              .eq("id", insertedMessage.id);
          }
        }

        // 2. Envoyer un email de confirmation à l'expéditeur
        if (userEmail && userEmail !== "Non fourni") {
          const confirmationResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Aurora Society <noreply@aurorasociety.ch>",
              to: [userEmail],
              subject: "Confirmation - Votre message a bien été reçu | Aurora Society",
              html: `
                <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #ffffff; padding: 40px;">
                  <div style="text-align: center; margin-bottom: 40px;">
                    <h1 style="color: #d4af37; font-size: 28px; margin: 0; letter-spacing: 2px;">AURORA SOCIETY</h1>
                    <p style="color: #888; font-size: 12px; margin-top: 8px; letter-spacing: 1px;">CONCIERGERIE PRIVÉE</p>
                  </div>
                  
                  <div style="border-top: 1px solid #333; border-bottom: 1px solid #333; padding: 30px 0; margin: 30px 0;">
                    <h2 style="color: #d4af37; font-size: 20px; margin: 0 0 20px 0;">Cher(e) ${userName},</h2>
                    <p style="color: #ccc; line-height: 1.8; margin: 0 0 20px 0;">
                      Nous avons bien reçu votre message et nous vous remercions de nous avoir contactés.
                    </p>
                    <p style="color: #ccc; line-height: 1.8; margin: 0 0 20px 0;">
                      Notre équipe de conciergerie examine votre demande avec la plus grande attention et vous répondra dans les plus brefs délais.
                    </p>
                  </div>
                  
                  <div style="background-color: #1a1a1a; padding: 25px; border-radius: 5px; margin: 30px 0; border-left: 3px solid #d4af37;">
                    <h3 style="color: #d4af37; font-size: 14px; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">Récapitulatif de votre demande</h3>
                    <p style="color: #888; font-size: 13px; margin: 5px 0;"><strong style="color: #ccc;">Catégorie:</strong> ${categoryLabels[category] || category}</p>
                    <p style="color: #888; font-size: 13px; margin: 5px 0;"><strong style="color: #ccc;">Sujet:</strong> ${subject}</p>
                    <p style="color: #888; font-size: 13px; margin: 15px 0 5px 0;"><strong style="color: #ccc;">Votre message:</strong></p>
                    <p style="color: #aaa; font-size: 13px; margin: 0; white-space: pre-wrap; font-style: italic;">"${message}"</p>
                  </div>
                  
                  <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #333;">
                    <p style="color: #666; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} Aurora Society. Tous droits réservés.
                    </p>
                    <p style="color: #666; font-size: 11px; margin-top: 10px;">
                      Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.
                    </p>
                  </div>
                </div>
              `,
            }),
          });

          if (!confirmationResponse.ok) {
            const errorText = await confirmationResponse.text();
            console.error("Error sending confirmation email to user:", errorText);
          } else {
            console.log("Confirmation email sent successfully to:", userEmail);
          }
        }
      } catch (emailError) {
        console.error("Error in email sending:", emailError);
        // Ne pas échouer, le message est déjà stocké dans la base de données
      }
    } else {
      console.warn("RESEND_API_KEY not configured. Email not sent, but message stored in database.");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Message envoyé avec succès" }),
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

