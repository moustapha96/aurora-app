import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { MessageSquare, Send, ArrowLeft, User, Trash2, MoreVertical, Search, Menu, X } from "lucide-react";
import { Header } from "@/components/Header";
import { PageNavigation } from "@/components/BackButton";
import { NewConversationDialog } from "@/components/NewConversationDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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
  const [searchParams] = useSearchParams();
  const { setCurrentConversation } = useMessageNotifications();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const [deleteConversationId, setDeleteConversationId] = useState<string | null>(null);
  const [showMobileConversations, setShowMobileConversations] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Handle conversation from URL (when clicking notification)
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversations.length > 0) {
      setSelectedConversation(conversationId);
    }
  }, [searchParams, conversations]);

  // Track current conversation to avoid duplicate notifications
  useEffect(() => {
    setCurrentConversation(selectedConversation);
  }, [selectedConversation, setCurrentConversation]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      subscribeToMessages(selectedConversation);
      // On mobile, hide conversations list when a conversation is selected
      if (isMobile) {
        setShowMobileConversations(false);
      }
    }
  }, [selectedConversation, isMobile]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [newMessage]);

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

      // For each conversation, get the other user's info and last message
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

            // Get last message
            const { data: lastMsg } = await supabase
              .from("messages")
              .select("content")
              .eq("conversation_id", conv.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            return {
              ...conv,
              other_user: profile,
              last_message: lastMsg?.content,
            };
          }

          return conv;
        })
      );

      setConversations(conversationsWithUsers);
    } catch (error: any) {
      console.error("Error loading conversations:", error);
      toast.error(t('unableToLoadConversations'));
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
      toast.error(t('unableToLoadMessages'));
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

      // Update conversation updated_at
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", selectedConversation);

      setNewMessage("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      // Focus back on textarea for quick reply
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(t('unableToSendMessage'));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
      toast.success(t('messageDeleted'));
    } catch (error: any) {
      console.error("Error deleting message:", error);
      toast.error(t('unableToDeleteMessage'));
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

      toast.success(t('conversationDeleted'));
    } catch (error: any) {
      console.error("Error deleting conversation:", error);
      toast.error(t('unableToDeleteConversation'));
    }
    setDeleteConversationId(null);
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const userName = conv.other_user
      ? `${conv.other_user.first_name} ${conv.other_user.last_name}`.toLowerCase()
      : conv.title.toLowerCase();
    return userName.includes(searchLower);
  });

  const selectedConv = conversations.find((c) => c.id === selectedConversation);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageNavigation to="/member-card" />
      
      <div className="flex h-[calc(100vh-80px)] sm:h-[calc(100vh-100px)] md:h-[calc(100vh-120px)] mt-16 sm:mt-20 md:mt-24 lg:mt-28">
        <div className="flex w-full max-w-[1800px] mx-auto relative">
              {/* Mobile overlay for sidebar */}
              {showMobileConversations && isMobile && (
                <div
                  className="fixed inset-0 bg-black/50 z-20 sm:hidden"
                  onClick={() => setShowMobileConversations(false)}
                />
              )}

              {/* Conversations Sidebar */}
              <div
                className={cn(
                  "flex flex-col border-r bg-card transition-all duration-300 ease-in-out",
                  "w-full sm:w-[280px] md:w-[320px] lg:w-[360px] xl:w-[400px]",
                  "fixed sm:relative inset-0 z-30 sm:z-auto",
                  showMobileConversations ? "translate-x-0" : "-translate-x-full sm:translate-x-0",
                )}
              >
                {/* Sidebar Header */}
                <div className="flex-shrink-0 p-3 sm:p-4 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
                  <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                    <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold truncate flex-1">{t('messaging')}</h1>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <NewConversationDialog onConversationCreated={loadConversations} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="sm:hidden h-8 w-8"
                        onClick={() => setShowMobileConversations(false)}
                        title={t('close')}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder={t('search')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                    />
                  </div>
                </div>

                {/* Conversations List */}
                <ScrollArea className="flex-1">
                  {loading ? (
                    <div className="flex justify-center items-center py-8 sm:py-12">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 sm:border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
                      <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 mb-2 sm:mb-3 text-muted-foreground/50" />
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {searchQuery ? t('noMembersFound') : t('noConversation')}
                      </p>
                    </div>
                  ) : (
                    <div className="p-1.5 sm:p-2 space-y-1">
                      {filteredConversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => {
                            setSelectedConversation(conv.id);
                            setShowMobileConversations(false);
                          }}
                          className={cn(
                            "w-full p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200 text-left",
                            "hover:bg-accent/70 active:scale-[0.98]",
                            selectedConversation === conv.id
                              ? "bg-primary/10 shadow-sm ring-1 ring-primary/20"
                              : "bg-transparent",
                          )}
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="relative flex-shrink-0">
                              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-1 sm:ring-2 ring-offset-1 ring-offset-background ring-border">
                                {conv.other_user?.avatar_url ? (
                                  <AvatarImage
                                    src={conv.other_user.avatar_url}
                                    className="object-cover"
                                  />
                                ) : null}
                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-xs sm:text-sm font-semibold">
                                  {conv.other_user ? (
                                    `${conv.other_user.first_name[0]}${conv.other_user.last_name[0]}`
                                  ) : (
                                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-green-500 border-2 border-background rounded-full" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between gap-1.5 sm:gap-2 mb-0.5">
                                <p className="font-semibold text-xs sm:text-sm truncate">
                                  {conv.other_user
                                    ? `${conv.other_user.first_name} ${conv.other_user.last_name}`
                                    : conv.title}
                                </p>
                                <span className="text-[10px] sm:text-[11px] text-muted-foreground flex-shrink-0">
                                  {new Date(conv.updated_at).toLocaleDateString("fr-FR", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </span>
                              </div>
                              {conv.last_message && (
                                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{conv.last_message}</p>
                              )}
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 sm:h-8 sm:w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                >
                                  <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive text-xs sm:text-sm"
                                  onClick={() => setDeleteConversationId(conv.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                                  {t('delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Messages Area */}
              <div className="flex-1 flex flex-col min-w-0">
                {selectedConversation && selectedConv ? (
                  <>
                    <div className="flex-shrink-0 h-14 sm:h-16 md:h-18 px-2 sm:px-3 md:px-4 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 flex items-center gap-2 sm:gap-3 min-h-[56px] sm:min-h-[64px]">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="sm:hidden flex-shrink-0 h-9 w-9"
                        onClick={() => setShowMobileConversations(true)}
                        title={t('showConversations')}
                      >
                        <Menu className="h-5 w-5" />
                      </Button>

                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <Avatar className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 ring-1 sm:ring-2 ring-offset-1 ring-offset-background ring-border flex-shrink-0">
                          {selectedConv.other_user?.avatar_url ? (
                            <AvatarImage src={selectedConv.other_user.avatar_url} />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-[10px] sm:text-xs md:text-sm font-semibold">
                            {selectedConv.other_user ? (
                              `${selectedConv.other_user.first_name[0]}${selectedConv.other_user.last_name[0]}`
                            ) : (
                              <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                            )}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <h2 className="font-semibold text-xs sm:text-sm md:text-base truncate">
                            {selectedConv.other_user
                              ? `${selectedConv.other_user.first_name} ${selectedConv.other_user.last_name}`
                              : selectedConv.title}
                          </h2>
                          <p className="text-[10px] sm:text-[11px] md:text-xs text-muted-foreground flex items-center gap-1">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></span>
                            {t('online')}
                          </p>
                        </div>
                      </div>

                      {otherUserId && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => navigate(`/profile/${otherUserId}`)}
                          className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 hover:bg-accent transition-colors flex-shrink-0"
                          title={t('viewProfile')}
                        >
                          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 flex-shrink-0">
                            <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive text-xs sm:text-sm"
                            onClick={() => setDeleteConversationId(selectedConv.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                            {t('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <ScrollArea className="flex-1 p-2 sm:p-3 md:p-4">
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-8 sm:py-12 md:py-16">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
                            <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
                          </div>
                          <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-xs px-4">
                            {t('noMessagesYet')}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 sm:space-y-3 md:space-y-4 max-w-4xl mx-auto pb-2">
                          {messages.map((msg, index) => {
                            const isCurrentUser = msg.sender_id === currentUserId;
                            const showAvatar =
                              !isCurrentUser && (index === 0 || messages[index - 1].sender_id !== msg.sender_id);
                            const showTime = index === messages.length - 1 ||
                              new Date(msg.created_at).getTime() - new Date(messages[index + 1].created_at).getTime() > 300000;

                            return (
                              <div
                                key={msg.id}
                                className={cn("flex gap-1.5 sm:gap-2 items-end group", isCurrentUser ? "flex-row-reverse" : "flex-row")}
                              >
                                {!isCurrentUser && (
                                  <div className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
                                    {showAvatar && (
                                      <Avatar className="h-7 w-7 sm:h-8 sm:w-8 ring-1 ring-border">
                                        {msg.profiles?.avatar_url ? (
                                          <AvatarImage src={msg.profiles.avatar_url} />
                                        ) : null}
                                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-[10px] sm:text-xs">
                                          {msg.profiles?.first_name?.[0]}{msg.profiles?.last_name?.[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                    )}
                                  </div>
                                )}

                                <div
                                  className={cn(
                                    "flex flex-col max-w-[85%] sm:max-w-[80%] md:max-w-[70%] lg:max-w-[60%] xl:max-w-[55%]",
                                    isCurrentUser ? "items-end" : "items-start",
                                  )}
                                >
                                  {!isCurrentUser && showAvatar && (
                                    <p className="text-[10px] sm:text-[11px] md:text-xs font-semibold mb-0.5 sm:mb-1 opacity-90 px-1">
                                      {msg.profiles?.first_name} {msg.profiles?.last_name}
                                    </p>
                                  )}
                                  <div
                                    className={cn(
                                      "relative px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm break-words",
                                      "transition-all duration-200",
                                      isCurrentUser
                                        ? "bg-primary text-primary-foreground rounded-br-sm"
                                        : "bg-muted text-foreground rounded-bl-sm",
                                    )}
                                  >
                                    {isCurrentUser && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute -left-7 sm:-left-8 md:-left-10 top-1/2 -translate-y-1/2 h-6 w-6 sm:h-7 sm:w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur hover:bg-destructive/20"
                                        onClick={() => setDeleteMessageId(msg.id)}
                                      >
                                        <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                      </Button>
                                    )}
                                    <p className="text-xs sm:text-[13px] md:text-sm leading-relaxed whitespace-pre-wrap break-words">
                                      {msg.content}
                                    </p>
                                  </div>
                                  {showTime && (
                                    <span className="text-[9px] sm:text-[10px] md:text-[11px] text-muted-foreground mt-0.5 sm:mt-1 px-1">
                                      {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  )}
                                </div>

                                {isCurrentUser && <div className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0" />}
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </ScrollArea>

                    <div className="flex-shrink-0 p-2 sm:p-3 md:p-4 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 safe-area-bottom">
                      <div className="max-w-4xl mx-auto">
                        <div className="flex gap-1.5 sm:gap-2 md:gap-3 items-end">
                          <div className="flex-1 relative">
                            <Textarea
                              ref={textareaRef}
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder={t('typeMessage')}
                              className="min-h-[44px] sm:min-h-[48px] md:min-h-[52px] max-h-[120px] sm:max-h-[140px] md:max-h-[160px] resize-none pr-11 sm:pr-12 md:pr-14 py-2.5 sm:py-3 md:py-3.5 text-xs sm:text-sm md:text-base rounded-lg sm:rounded-xl border-border focus-visible:ring-2 focus-visible:ring-ring transition-all"
                              rows={1}
                            />
                          </div>
                          <Button
                            onClick={sendMessage}
                            disabled={!newMessage.trim()}
                            size="icon"
                            className="h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-lg sm:rounded-xl flex-shrink-0 shadow-md hover:shadow-lg transition-all"
                          >
                            <Send className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
                    <div className="text-center max-w-md px-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-semibold mb-2">{t('messaging')}</h2>
                      <p className="text-muted-foreground text-xs sm:text-sm">
                        {t('selectConversation')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

      <AlertDialog open={!!deleteMessageId} onOpenChange={() => setDeleteMessageId(null)}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-[425px] p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">{t('deleteMessage')}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {t('deleteMessageConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto text-sm">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMessageId && deleteMessage(deleteMessageId)}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteConversationId} onOpenChange={() => setDeleteConversationId(null)}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-[425px] p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">{t('deleteConversation')}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {t('deleteConversationDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto text-sm">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConversationId && deleteConversation(deleteConversationId)}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm"
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
