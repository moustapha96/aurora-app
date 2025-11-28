/**
 * Email Service
 * Handles sending emails using admin-configured SMTP settings
 */

import { supabase } from '@/integrations/supabase/client';
import { useSettings } from '@/contexts/SettingsContext';

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  fromName?: string;
}

/**
 * Send email using Edge Function or Supabase email service
 * The actual implementation depends on your email infrastructure
 * Returns true if email was sent or queued, false on error
 * This function never throws - errors are logged but don't block operations
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    // Get settings from context (this should be called from a component)
    // For now, we'll use a direct approach via Edge Function
    
    // Option 1: Use Supabase Edge Function for email sending
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        from: options.from,
        fromName: options.fromName,
      },
    });

    if (error) {
      // Log error but don't throw - email failures shouldn't block operations
      console.warn('Email sending failed (non-blocking):', error.message || error);
      
      // Check if it's a function not found error (development/local)
      if (error.message?.includes('Failed to send a request') || 
          error.message?.includes('Edge Function') ||
          error.name === 'FunctionsFetchError') {
        console.warn('Edge Function "send-email" may not be deployed. Email not sent.');
      }
      
      return false;
    }

    // Check if there's a warning in the response (SMTP not configured, etc.)
    if (data?.warning) {
      console.warn('Email service warning:', data.warning);
    }

    // Return true if success or if email was queued (even if not actually sent)
    return data?.success !== false;
  } catch (error: any) {
    // Catch all errors and log but don't throw
    console.warn('Error in sendEmail (non-blocking):', error?.message || error);
    return false;
  }
};

/**
 * Send email notification for new user registration
 */
export const sendNewUserEmail = async (userEmail: string, userName: string): Promise<boolean> => {
  const subject = 'Bienvenue sur Aurora Society';
  const html = `
    <h1>Bienvenue ${userName} !</h1>
    <p>Votre compte a été créé avec succès sur Aurora Society.</p>
    <p>Nous sommes ravis de vous accueillir dans notre réseau exclusif.</p>
  `;

  return await sendEmail({
    to: userEmail,
    subject,
    html,
  });
};

/**
 * Send email notification for new connection request
 */
export const sendNewConnectionEmail = async (
  recipientEmail: string,
  requesterName: string
): Promise<boolean> => {
  const subject = 'Nouvelle demande de connexion';
  const html = `
    <h1>Nouvelle demande de connexion</h1>
    <p>${requesterName} souhaite se connecter avec vous.</p>
    <p>Connectez-vous pour voir la demande.</p>
  `;

  return await sendEmail({
    to: recipientEmail,
    subject,
    html,
  });
};

/**
 * Send email notification for new message
 */
export const sendNewMessageEmail = async (
  recipientEmail: string,
  senderName: string
): Promise<boolean> => {
  const subject = 'Nouveau message';
  const html = `
    <h1>Nouveau message</h1>
    <p>Vous avez reçu un nouveau message de ${senderName}.</p>
    <p>Connectez-vous pour le lire.</p>
  `;

  return await sendEmail({
    to: recipientEmail,
    subject,
    html,
  });
};

/**
 * Send email notification for content report
 */
export const sendReportEmail = async (
  adminEmail: string,
  reportDetails: string
): Promise<boolean> => {
  const subject = 'Nouveau signalement de contenu';
  const html = `
    <h1>Nouveau signalement</h1>
    <p>${reportDetails}</p>
    <p>Connectez-vous à l'interface admin pour examiner ce signalement.</p>
  `;

  return await sendEmail({
    to: adminEmail,
    subject,
    html,
  });
};

/**
 * Send email notification for system error
 */
export const sendErrorEmail = async (
  adminEmail: string,
  errorDetails: string
): Promise<boolean> => {
  const subject = 'Erreur système';
  const html = `
    <h1>Erreur système détectée</h1>
    <p>Une erreur s'est produite dans l'application :</p>
    <pre>${errorDetails}</pre>
  `;

  return await sendEmail({
    to: adminEmail,
    subject,
    html,
  });
};

