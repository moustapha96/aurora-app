import { supabase } from "@/integrations/supabase/client";

export type ActivityType = 
  | 'login'
  | 'logout'
  | 'profile_update'
  | 'password_change'
  | 'email_verification'
  | 'connection_request'
  | 'message_sent'
  | 'content_created'
  | 'content_updated'
  | 'content_deleted'
  | 'settings_updated'
  | 'other';

interface LogActivityParams {
  activityType: ActivityType;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Log a user activity to the database
 * @param params Activity parameters
 */
export const logActivity = async ({
  activityType,
  description,
  metadata
}: LogActivityParams): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('Cannot log activity: user not authenticated');
      return;
    }

    // Get IP address and user agent from browser
    const ipAddress = null; // Will be set by the database function if available
    const userAgent = navigator.userAgent;

    // Call the database function to log activity
    const { error } = await supabase.rpc('log_user_activity', {
      p_activity_type: activityType,
      p_activity_description: description || null,
      p_metadata: metadata || null
    });

    if (error) {
      // If the function doesn't exist or table doesn't exist, fail silently
      // This allows the app to work even if activity logging isn't set up
      if (error.code !== '42883' && error.code !== '42P01') {
        console.error('Error logging activity:', error);
      }
    }
  } catch (error) {
    // Fail silently to not break the app if logging fails
    console.warn('Failed to log activity:', error);
  }
};

/**
 * Helper functions for common activities
 */
export const activityLogger = {
  login: () => logActivity({
    activityType: 'login',
    description: 'User logged in',
    metadata: { timestamp: new Date().toISOString() }
  }),

  logout: () => logActivity({
    activityType: 'logout',
    description: 'User logged out'
  }),

  profileUpdate: (changes: Record<string, any>) => logActivity({
    activityType: 'profile_update',
    description: 'Profile updated',
    metadata: { changes }
  }),

  passwordChange: () => logActivity({
    activityType: 'password_change',
    description: 'Password changed'
  }),

  emailVerification: () => logActivity({
    activityType: 'email_verification',
    description: 'Email verified'
  }),

  connectionRequest: (targetUserId: string) => logActivity({
    activityType: 'connection_request',
    description: 'Connection request sent',
    metadata: { target_user_id: targetUserId }
  }),

  messageSent: (conversationId: string) => logActivity({
    activityType: 'message_sent',
    description: 'Message sent',
    metadata: { conversation_id: conversationId }
  }),

  contentCreated: (contentType: string, contentId: string) => logActivity({
    activityType: 'content_created',
    description: `Content created: ${contentType}`,
    metadata: { content_type: contentType, content_id: contentId }
  }),

  contentUpdated: (contentType: string, contentId: string) => logActivity({
    activityType: 'content_updated',
    description: `Content updated: ${contentType}`,
    metadata: { content_type: contentType, content_id: contentId }
  }),

  contentDeleted: (contentType: string, contentId: string) => logActivity({
    activityType: 'content_deleted',
    description: `Content deleted: ${contentType}`,
    metadata: { content_type: contentType, content_id: contentId }
  }),

  settingsUpdated: (settings: string[]) => logActivity({
    activityType: 'settings_updated',
    description: 'Settings updated',
    metadata: { updated_settings: settings }
  }),
};

