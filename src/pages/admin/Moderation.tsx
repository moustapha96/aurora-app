import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  AlertTriangle,
  MessageSquare,
  FileText,
  Image,
  User,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Ban
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdmin } from "@/hooks/useAdmin";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/contexts/SettingsContext";
import AdminLayout from "@/components/AdminLayout";

interface ReportedContent {
  id: string;
  content_type: 'message' | 'profile' | 'artwork' | 'other';
  content_id: string;
  reported_by: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  reporter_name?: string;
  content_preview?: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  sender_name?: string;
}

const AdminModeration = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'delete' | 'warn' | 'ban' | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  useEffect(() => {
    loadRecentMessages();
  }, []);

  const loadRecentMessages = async () => {
    try {
      setLoading(true);
      
      // Get recent messages with sender info
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (messagesError) {
        if (messagesError.code === '42P01') {
          setRecentMessages([]);
          return;
        }
        throw messagesError;
      }

      // Get sender profiles
      if (messages && messages.length > 0) {
        const senderIds = [...new Set(messages.map(m => m.sender_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', senderIds);

        const messagesWithNames = messages.map(msg => ({
          ...msg,
          sender_name: profiles?.find(p => p.id === msg.sender_id)
            ? `${profiles.find(p => p.id === msg.sender_id)?.first_name} ${profiles.find(p => p.id === msg.sender_id)?.last_name}`
            : 'Utilisateur inconnu'
        }));

        setRecentMessages(messagesWithNames);
      } else {
        setRecentMessages([]);
      }
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast.error("Erreur lors du chargement des messages");
      setRecentMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    setMessageDialogOpen(true);
  };

  const handleAction = (action: 'delete' | 'warn' | 'ban', userId: string) => {
    setSelectedAction(action);
    setSelectedUserId(userId);
    setActionDialogOpen(true);
  };

  const executeAction = async () => {
    if (!selectedAction || !selectedUserId) return;

    try {
      switch (selectedAction) {
        case 'delete':
          // Delete user's messages
          const { error: deleteError } = await supabase
            .from('messages')
            .delete()
            .eq('sender_id', selectedUserId);
          
          if (deleteError) throw deleteError;
          toast.success("Messages supprimés");
          break;

        case 'warn':
          // Log warning (could be stored in a warnings table)
          toast.success("Avertissement enregistré");
          break;

        case 'ban':
          // Ban user (could update a banned_users table or user metadata)
          const { error: banError } = await supabase.auth.admin.updateUserById(
            selectedUserId,
            { ban_duration: '87600h' } // 10 years
          );
          
          if (banError) throw banError;
          toast.success("Utilisateur banni");
          
          // Send email notification if enabled
          if (settings.emailOnReport) {
            try {
              const { sendReportEmail } = await import('@/lib/emailService');
              const reportDetails = `Utilisateur banni: ${selectedUserId}`;
              // Get admin email (you might want to get it from settings or a config)
              const { data: { user: adminUser } } = await supabase.auth.getUser();
              if (adminUser?.email) {
                await sendReportEmail(adminUser.email, reportDetails);
              }
            } catch (emailError) {
              console.error('Error sending report email:', emailError);
              // Don't block the action if email fails
            }
          }
          break;
      }

      setActionDialogOpen(false);
      setSelectedAction(null);
      setSelectedUserId("");
      loadRecentMessages();
    } catch (error: any) {
      console.error('Error executing action:', error);
      toast.error(`Erreur lors de l'action: ${error.message}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(language === 'ar' ? 'ar-SA' : language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : language === 'ru' ? 'ru-RU' : language, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gold">{t('loading')}</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif text-gold mb-2">{t('adminModeration')}</h1>
            <p className="text-gold/60">{t('adminModerationDescription') || 'Gestion de la modération du contenu'}</p>
          </div>
          <Button
            onClick={loadRecentMessages}
            variant="outline"
            className="border-gold/30 text-gold hover:bg-gold/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('refresh')}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="messages" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/40 border border-gold/20">
            <TabsTrigger value="messages" className="data-[state=active]:bg-gold/20">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-gold/20">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Signalements
            </TabsTrigger>
            <TabsTrigger value="actions" className="data-[state=active]:bg-gold/20">
              <Ban className="w-4 h-4 mr-2" />
              Actions
            </TabsTrigger>
          </TabsList>

          {/* Messages Tab */}
          <TabsContent value="messages" className="mt-6">
            <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">Messages Récents</CardTitle>
                <CardDescription className="text-gold/60">
                  Derniers messages envoyés sur la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentMessages.length === 0 ? (
                  <div className="text-center py-12 text-gold/60">
                    Aucun message trouvé
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gold/20">
                        <TableHead className="text-gold">Expéditeur</TableHead>
                        <TableHead className="text-gold">Contenu</TableHead>
                        <TableHead className="text-gold">Date</TableHead>
                        <TableHead className="text-gold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentMessages.map((message) => (
                        <TableRow key={message.id} className="border-gold/10">
                          <TableCell className="text-gold/80">
                            {message.sender_name}
                          </TableCell>
                          <TableCell className="text-gold/60 max-w-md truncate">
                            {message.content}
                          </TableCell>
                          <TableCell className="text-gold/60 text-sm">
                            {formatDate(message.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewMessage(message)}
                                className="text-gold hover:bg-gold/10"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAction('delete', message.sender_id)}
                                className="text-red-400 hover:bg-red-900/20"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-6">
            <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">Signalements</CardTitle>
                <CardDescription className="text-gold/60">
                  Contenu signalé par les utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gold/60">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gold/40" />
                  <p>Système de signalements à implémenter</p>
                  <p className="text-sm text-gold/40 mt-2">
                    Créez une table `content_reports` pour gérer les signalements
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="mt-6">
            <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">Actions de Modération</CardTitle>
                <CardDescription className="text-gold/60">
                  Actions disponibles pour modérer le contenu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-black/20 border border-gold/10 rounded-lg">
                    <h4 className="text-gold font-medium mb-2">Supprimer des Messages</h4>
                    <p className="text-gold/60 text-sm">
                      Supprime tous les messages d'un utilisateur
                    </p>
                  </div>
                  <div className="p-4 bg-black/20 border border-gold/10 rounded-lg">
                    <h4 className="text-gold font-medium mb-2">Avertir un Utilisateur</h4>
                    <p className="text-gold/60 text-sm">
                      Envoie un avertissement à un utilisateur
                    </p>
                  </div>
                  <div className="p-4 bg-black/20 border border-gold/10 rounded-lg">
                    <h4 className="text-gold font-medium mb-2">Bannir un Utilisateur</h4>
                    <p className="text-gold/60 text-sm">
                      Bannit un utilisateur de la plateforme
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Message View Dialog */}
        <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
          <DialogContent className="bg-black border-gold/20 text-gold">
            <DialogHeader>
              <DialogTitle>Détails du Message</DialogTitle>
              <DialogDescription className="text-gold/60">
                Contenu complet du message
              </DialogDescription>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-gold/80 text-sm">Expéditeur</label>
                  <p className="text-gold">{selectedMessage.sender_name}</p>
                </div>
                <div>
                  <label className="text-gold/80 text-sm">Date</label>
                  <p className="text-gold/60">{formatDate(selectedMessage.created_at)}</p>
                </div>
                <div>
                  <label className="text-gold/80 text-sm">Contenu</label>
                  <p className="text-gold/80 mt-2 p-4 bg-black/20 rounded-lg">
                    {selectedMessage.content}
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setMessageDialogOpen(false)}
                className="text-gold border-gold/30"
              >
                Fermer
              </Button>
              {selectedMessage && (
                <Button
                  onClick={() => {
                    setMessageDialogOpen(false);
                    handleAction('delete', selectedMessage.sender_id);
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Supprimer
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Action Confirmation Dialog */}
        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent className="bg-black border-gold/20 text-gold">
            <DialogHeader>
              <DialogTitle className="text-red-400">Confirmer l'Action</DialogTitle>
              <DialogDescription className="text-gold/60">
                {selectedAction === 'delete' && "Supprimer tous les messages de cet utilisateur ?"}
                {selectedAction === 'warn' && "Envoyer un avertissement à cet utilisateur ?"}
                {selectedAction === 'ban' && "Bannir cet utilisateur de la plateforme ?"}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setActionDialogOpen(false)}
                className="text-gold border-gold/30"
              >
                Annuler
              </Button>
              <Button
                onClick={executeAction}
                className="bg-red-600 hover:bg-red-700"
              >
                Confirmer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminModeration;

