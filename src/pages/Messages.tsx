import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Send, ArrowLeft, User, Trash2, MoreVertical } from "lucide-react";
import { NewConversationDialog } from "@/components/NewConversationDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/contexts/SettingsContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Conversation {
  id: string;
  title: string;
  type: string;
  updated_at: string;
  last_message?: string;
  other_user?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

const Messages = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { settings } = useSettings();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const [deleteConversationId, setDeleteConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkAuth();
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      subscribeToMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }
    setCurrentUserId(user.id);
  };

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memberData, error: memberError } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (memberError) throw memberError;

      const conversationIds = memberData?.map(m => m.conversation_id) || [];

      if (conversationIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: conversationsData, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .in("id", conversationIds)
        .order("updated_at", { ascending: false });

      if (convError) throw convError;

      // For each conversation, get the other user's info
      const conversationsWithUsers = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          // Get all members of this conversation
          const { data: members } = await supabase
            .from("conversation_members")
            .select("user_id")
            .eq("conversation_id", conv.id);

          // Find the other user (not the current user)
          const otherUserId = members?.find(m => m.user_id !== user.id)?.user_id;

          if (otherUserId) {
            // Get the other user's profile
            const { data: profile } = await supabase
              .from("profiles")
              .select("first_name, last_name, avatar_url")
              .eq("id", otherUserId)
              .single();

            return {
              ...conv,
              other_user: profile,
            };
          }

          return conv;
        })
      );

      setConversations(conversationsWithUsers);
    } catch (error: any) {
      console.error("Error loading conversations:", error);
      toast({
        title: t('error'),
        description: t('error'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Load profiles separately for each unique sender
      const senderIds = [...new Set(messagesData?.map(m => m.sender_id) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .in("id", senderIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const messagesWithProfiles = messagesData?.map(msg => ({
        ...msg,
        profiles: profilesMap.get(msg.sender_id)
      })) || [];

      setMessages(messagesWithProfiles as Message[]);

      // Get other user ID (the one who is not the current user)
      const otherSenderId = senderIds.find(id => id !== currentUserId);
      setOtherUserId(otherSenderId || null);
    } catch (error: any) {
      console.error("Error loading messages:", error);
      toast({
        title: t('error'),
        description: t('error'),
        variant: "destructive",
      });
    }
  };

  const subscribeToMessages = (conversationId: string) => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("first_name, last_name, avatar_url")
            .eq("id", payload.new.sender_id)
            .single();

          const newMessage = {
            ...payload.new,
            profiles: profileData,
          } as Message;

          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUserId) return;

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: selectedConversation,
        sender_id: currentUserId,
        content: newMessage.trim(),
      });

      if (error) throw error;

      // Send email notification if enabled
      if (settings.emailOnNewMessage && otherUserId) {
        try {
          // Get recipient email and sender name
          const { data: recipientAuth } = await supabase.rpc('get_user_auth_info' as any, {
            _user_id: otherUserId
          });
          
          if (recipientAuth && Array.isArray(recipientAuth) && recipientAuth.length > 0) {
            const { sendNewMessageEmail } = await import('@/lib/emailService');
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', currentUserId)
              .single();
            
            const senderName = senderProfile 
              ? `${senderProfile.first_name} ${senderProfile.last_name}`
              : 'Un utilisateur';
            
            await sendNewMessageEmail(recipientAuth[0].email, senderName);
          }
        } catch (emailError) {
          console.error('Error sending message email:', emailError);
          // Don't block message sending if email fails
        }
      }

      setNewMessage("");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: t('error'),
        description: t('error'),
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId)
        .eq("sender_id", currentUserId);

      if (error) throw error;

      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      toast({
        title: t('success'),
        description: t('success'),
      });
    } catch (error: any) {
      console.error("Error deleting message:", error);
      toast({
        title: t('error'),
        description: t('error'),
        variant: "destructive",
      });
    }
    setDeleteMessageId(null);
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      // Delete all messages first
      await supabase
        .from("messages")
        .delete()
        .eq("conversation_id", conversationId);

      // Delete conversation members
      await supabase
        .from("conversation_members")
        .delete()
        .eq("conversation_id", conversationId);

      // Delete conversation
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;

      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }

      toast({
        title: t('success'),
        description: t('success'),
      });
    } catch (error: any) {
      console.error("Error deleting conversation:", error);
      toast({
        title: t('error'),
        description: t('error'),
        variant: "destructive",
      });
    }
    setDeleteConversationId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto pb-4 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/member-card")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>{t('back')}</span>
          </Button>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{t('messages')}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
          {/* Conversations List */}
          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{t('conversations')}</h2>
              <NewConversationDialog onConversationCreated={loadConversations} />
            </div>
            
            <ScrollArea className="h-[520px]">
              {loading ? (
                <p className="text-muted-foreground text-center py-8">{t('loading')}</p>
              ) : conversations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {t('noConversations')}
                </p>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-3 rounded-lg mb-2 transition-colors ${
                      selectedConversation === conv.id
                        ? "bg-primary/10 border border-primary"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => setSelectedConversation(conv.id)}
                      >
                        <Avatar>
                          {conv.other_user?.avatar_url ? (
                            <AvatarImage src={conv.other_user.avatar_url} />
                          ) : null}
                          <AvatarFallback>
                            {conv.other_user 
                              ? `${conv.other_user.first_name[0]}${conv.other_user.last_name[0]}`
                              : <MessageSquare className="h-5 w-5" />
                            }
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {conv.other_user 
                              ? `${conv.other_user.first_name} ${conv.other_user.last_name}`
                              : conv.title || "Conversation"
                            }
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {new Date(conv.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteConversationId(conv.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Messages Area */}
          <div className="md:col-span-2 border rounded-lg flex flex-col bg-card">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    {(() => {
                      const conv = conversations.find(c => c.id === selectedConversation);
                      return conv?.other_user 
                        ? `${conv.other_user.first_name} ${conv.other_user.last_name}`
                        : conv?.title || t('conversation');
                    })()}
                  </h2>
                  {otherUserId && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/profile/${otherUserId}`)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      {t('viewProfile')}
                    </Button>
                  )}
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.sender_id === currentUserId ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`group max-w-[70%] rounded-lg p-3 relative ${
                            msg.sender_id === currentUserId
                              ? "bg-primary text-primary-foreground"
                              : "bg-accent"
                          }`}
                        >
                          {msg.sender_id === currentUserId && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setDeleteMessageId(msg.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                          {msg.sender_id !== currentUserId && (
                            <p className="text-xs font-semibold mb-1">
                              {msg.profiles?.first_name} {msg.profiles?.last_name}
                            </p>
                          )}
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={t('writeMessage')}
                      className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                      rows={2}
                    />
                    <Button onClick={sendMessage} size="icon" className="self-end">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('selectConversation')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Message Confirmation */}
      <AlertDialog open={!!deleteMessageId} onOpenChange={() => setDeleteMessageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteMessage')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteMessageConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMessageId && deleteMessage(deleteMessageId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Conversation Confirmation */}
      <AlertDialog open={!!deleteConversationId} onOpenChange={() => setDeleteConversationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConversation')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConversationConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConversationId && deleteConversation(deleteConversationId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Messages;