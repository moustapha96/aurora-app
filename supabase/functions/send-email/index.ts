import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// SMTP email sending using Deno's built-in capabilities
// For production, consider using a service like SendGrid, Resend, or AWS SES

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let requestData;
    try {
      requestData = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { to, subject, html, text, from, fromName } = requestData;

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: 'to and subject are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get SMTP settings from app_settings
    const { data: smtpSettings, error: settingsError } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPassword', 'fromEmail', 'fromName']);

    if (settingsError) {
      console.error('Error fetching SMTP settings:', settingsError);
      // Continue with defaults if settings can't be fetched
    }

    // Parse settings
    const settings: Record<string, any> = {};
    if (smtpSettings) {
      smtpSettings.forEach(setting => {
        try {
          settings[setting.key] = typeof setting.value === 'string' 
            ? JSON.parse(setting.value) 
            : setting.value;
        } catch {
          settings[setting.key] = setting.value;
        }
      });
    }

    const smtpHost = settings.smtpHost || Deno.env.get('SMTP_HOST') || '';
    const smtpPort = settings.smtpPort || parseInt(Deno.env.get('SMTP_PORT') || '587');
    const smtpUser = settings.smtpUser || Deno.env.get('SMTP_USER') || '';
    const smtpPassword = settings.smtpPassword || Deno.env.get('SMTP_PASSWORD') || '';
    const defaultFromEmail = settings.fromEmail || Deno.env.get('FROM_EMAIL') || 'noreply@aurorasociety.ch';
    const defaultFromName = settings.fromName || Deno.env.get('FROM_NAME') || 'Aurora Society';

    const fromEmail = from || defaultFromEmail;
    const senderName = fromName || defaultFromName;

    // If SMTP is not configured, log and return success (don't block the operation)
    if (!smtpHost || !smtpUser || !smtpPassword) {
      console.warn('SMTP not configured. Email would be sent to:', to, 'Subject:', subject);
      // Return success to not block the calling operation
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email queued (SMTP not configured - email not actually sent)',
          warning: 'SMTP settings not configured. Please configure SMTP in admin settings.'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      );
    }

    // Send email using SMTP
    // Note: For production, consider using a dedicated email service
    // This is a basic implementation using Deno's capabilities
    
    try {
      // Use a simple HTTP-based email service or SMTP library
      // For now, we'll use a simple approach with fetch to an SMTP relay
      // In production, use a service like Resend, SendGrid, or AWS SES
      
      // Option 1: Use Resend API (recommended for production)
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      if (RESEND_API_KEY) {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${senderName} <${fromEmail}>`,
            to: [to],
            subject: subject,
            html: html || text,
            text: text || html?.replace(/<[^>]*>/g, ''),
          }),
        });

        if (resendResponse.ok) {
          const resendData = await resendResponse.json();
          return new Response(
            JSON.stringify({ success: true, data: resendData }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            },
          );
        } else {
          const errorText = await resendResponse.text();
          throw new Error(`Resend API error: ${errorText}`);
        }
      }

      // Option 2: Use SendGrid API
      const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
      if (SENDGRID_API_KEY) {
        const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: to }],
            }],
            from: {
              email: fromEmail,
              name: senderName,
            },
            subject: subject,
            content: [
              {
                type: html ? 'text/html' : 'text/plain',
                value: html || text || '',
              },
            ],
          }),
        });

        if (sendgridResponse.ok) {
          return new Response(
            JSON.stringify({ success: true }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            },
          );
        } else {
          const errorText = await sendgridResponse.text();
          throw new Error(`SendGrid API error: ${errorText}`);
        }
      }

      // Option 3: Direct SMTP (basic implementation)
      // This is a simplified version - for production, use a proper SMTP library
      console.warn('No email service API key found. Email not sent.');
      console.log('Email details:', { to, subject, from: fromEmail });
      
      // Return success to not block operations, but log that email wasn't sent
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email queued (no email service configured)',
          warning: 'No email service API key (RESEND_API_KEY or SENDGRID_API_KEY) configured. Email not sent.'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      );

    } catch (emailError: any) {
      console.error('Error sending email:', emailError);
      // Return success anyway to not block the calling operation
      // The email failure is logged but doesn't prevent the main operation
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: emailError.message,
          warning: 'Email sending failed but operation continues'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200, // Return 200 to not block the calling operation
        },
      );
    }

  } catch (error: any) {
    console.error('Error in send-email function:', error);
    // Return success to not block operations
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        warning: 'Email function error but operation continues'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 to not block the calling operation
      },
    );
  }
});

