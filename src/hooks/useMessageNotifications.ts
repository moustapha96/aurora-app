/**
 * Hook for handling message notifications globally
 * Shows native notifications on mobile and web notifications on desktop
 */

import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { showLocalNotification } from '@/services/notificationService';
import { toast } from '@/hooks/use-toast';

interface MessagePayload {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export function useMessageNotifications() {
  const navigate = useNavigate();
  const currentUserIdRef = useRef<string | null>(null);
  const currentConversationRef = useRef<string | null>(null);
  const conversationIdsRef = useRef<string[]>([]);

  // Function to set current conversation (to avoid notifying when already viewing)
  const setCurrentConversation = useCallback((conversationId: string | null) => {
    currentConversationRef.current = conversationId;
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      currentUserIdRef.current = user.id;

      // Get all conversations the user is part of
      const { data: memberData } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", user.id);

      conversationIdsRef.current = memberData?.map(m => m.conversation_id) || [];
      
      if (conversationIdsRef.current.length === 0) return;

      // Subscribe to new messages in all user's conversations
      channel = supabase
        .channel('global-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          async (payload) => {
            const message = payload.new as MessagePayload;
            
            // Don't notify for own messages
            if (message.sender_id === currentUserIdRef.current) return;
            
            // Don't notify if user is not in this conversation
            if (!conversationIdsRef.current.includes(message.conversation_id)) return;
            
            // Don't notify if user is already viewing this conversation
            if (message.conversation_id === currentConversationRef.current) return;

            // Get sender profile
            const { data: senderProfile } = await supabase
              .from("profiles")
              .select("first_name, last_name, avatar_url")
              .eq("id", message.sender_id)
              .single();

            const senderName = senderProfile 
              ? `${senderProfile.first_name} ${senderProfile.last_name}`
              : 'Nouveau message';

            const truncatedContent = message.content.length > 100 
              ? `${message.content.substring(0, 100)}...` 
              : message.content;

            // Show notification based on platform
            if (Capacitor.isNativePlatform()) {
              // Native mobile notification (Android/iOS)
              await showLocalNotification({
                title: senderName,
                body: truncatedContent,
                data: { 
                  type: 'message', 
                  conversationId: message.conversation_id,
                  route: `/messages?conversation=${message.conversation_id}`
                },
              });
            } else {
              // Web toast notification
              toast({
                title: `💬 ${senderName}`,
                description: truncatedContent,
                duration: 5000,
              });
              
              // Navigate on click for web - using a custom event
              const handleClick = () => {
                navigate(`/messages?conversation=${message.conversation_id}`);
              };
              
              // Emit custom event for navigation
              window.dispatchEvent(new CustomEvent('message-notification-click', {
                detail: { conversationId: message.conversation_id, onClick: handleClick }
              }));
            }

            // Also create a notification in the database
            try {
              await supabase
                .from("user_notifications")
                .insert({
                  user_id: currentUserIdRef.current,
                  type: 'message',
                  title: 'Nouveau message',
                  message: `${senderName}: ${truncatedContent}`,
                  related_document_id: message.conversation_id,
                });
            } catch (error) {
              console.error('Error creating notification:', error);
            }
          }
        )
        .subscribe();
    };

    setupNotifications();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [navigate]);

  return { setCurrentConversation };
}
