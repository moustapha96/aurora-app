import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Settings, Trash2, MessageCircle, Calendar, Shield, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Header } from "@/components/Header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface Connection {
  id: string;
  friendId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  jobFunction: string | null;
  country: string | null;
  createdAt: string;
  businessAccess: boolean;
  familyAccess: boolean;
  personalAccess: boolean;
  influenceAccess: boolean;
}

const Connections = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [permissions, setPermissions] = useState({
    businessAccess: true,
    familyAccess: true,
    personalAccess: true,
    influenceAccess: true,
  });

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Get all friendships where user is involved
      const { data: friendships, error: friendshipsError } = await supabase
        .from("friendships")
        .select("*")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (friendshipsError) throw friendshipsError;

      // Get unique friend IDs
      const friendIds = new Set<string>();
      const friendshipMap = new Map();
      
      friendships?.forEach(f => {
        const friendId = f.user_id === user.id ? f.friend_id : f.user_id;
        if (!friendIds.has(friendId)) {
          friendIds.add(friendId);
          friendshipMap.set(friendId, f);
        }
      });

      if (friendIds.size === 0) {
        setConnections([]);
        setIsLoading(false);
        return;
      }

      // Get profiles for all friends
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, job_function, country")
        .in("id", Array.from(friendIds));

      if (profilesError) throw profilesError;

      const connectionsList: Connection[] = (profiles || []).map(profile => {
        const friendship = friendshipMap.get(profile.id);
        return {
          id: friendship.id,
          friendId: profile.id,
          firstName: profile.first_name,
          lastName: profile.last_name,
          avatarUrl: profile.avatar_url,
          jobFunction: profile.job_function,
          country: profile.country,
          createdAt: friendship.created_at,
          businessAccess: friendship.business_access ?? true,
          familyAccess: friendship.family_access ?? true,
          personalAccess: friendship.personal_access ?? true,
          influenceAccess: friendship.influence_access ?? true,
        };
      });

      setConnections(connectionsList);
    } catch (error) {
      console.error("Error loading connections:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les connexions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openPermissionsDialog = (connection: Connection) => {
    setSelectedConnection(connection);
    setPermissions({
      businessAccess: connection.businessAccess,
      familyAccess: connection.familyAccess,
      personalAccess: connection.personalAccess,
      influenceAccess: connection.influenceAccess,
    });
    setShowPermissionsDialog(true);
  };

  const savePermissions = async () => {
    if (!selectedConnection) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update friendship where current user is the owner
      const { error } = await supabase
        .from("friendships")
        .update({
          business_access: permissions.businessAccess,
          family_access: permissions.familyAccess,
          personal_access: permissions.personalAccess,
          influence_access: permissions.influenceAccess,
        })
        .eq("id", selectedConnection.id);

      if (error) throw error;

      toast({
        title: "Permissions mises à jour",
        description: "Les permissions d'accès ont été modifiées",
      });

      setShowPermissionsDialog(false);
      loadConnections();
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les permissions",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = (connection: Connection) => {
    setSelectedConnection(connection);
    setShowDeleteDialog(true);
  };

  const deleteConnection = async () => {
    if (!selectedConnection) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete both directions of the friendship
      const { error: error1 } = await supabase
        .from("friendships")
        .delete()
        .eq("user_id", user.id)
        .eq("friend_id", selectedConnection.friendId);

      const { error: error2 } = await supabase
        .from("friendships")
        .delete()
        .eq("user_id", selectedConnection.friendId)
        .eq("friend_id", user.id);

      if (error1 && error2) throw error1;

      toast({
        title: "Connexion supprimée",
        description: "La connexion a été supprimée des deux côtés",
      });

      setShowDeleteDialog(false);
      loadConnections();
    } catch (error) {
      console.error("Error deleting connection:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la connexion",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 pt-20 sm:pt-24 pb-8 max-w-4xl safe-area-all">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Mes Connexions</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{connections.length} connexion(s)</p>
          </div>
        </div>

        {connections.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Aucune connexion</h3>
              <p className="text-muted-foreground text-center mb-4">
                Vous n'avez pas encore de connexions. Explorez le répertoire des membres pour en créer.
              </p>
              <Button onClick={() => navigate("/members")}>
                Voir les membres
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {connections.map((connection) => (
              <Card key={connection.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <Avatar 
                      className="h-12 w-12 sm:h-16 sm:w-16 cursor-pointer shrink-0"
                      onClick={() => navigate(`/profile/${connection.friendId}`)}
                    >
                      <AvatarImage src={connection.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {connection.firstName[0]}{connection.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="font-semibold text-sm sm:text-base text-foreground cursor-pointer hover:text-primary"
                        onClick={() => navigate(`/profile/${connection.friendId}`)}
                      >
                        {connection.firstName} {connection.lastName}
                      </h3>
                      {connection.jobFunction && (
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{connection.jobFunction}</p>
                      )}
                      {connection.country && (
                        <p className="text-xs text-muted-foreground">{connection.country}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span className="truncate">Connecté le {formatDate(connection.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      <div className="hidden sm:flex flex-wrap gap-1">
                        {connection.businessAccess && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">Business</span>
                        )}
                        {connection.familyAccess && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Family</span>
                        )}
                        {connection.personalAccess && (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">Personal</span>
                        )}
                        {connection.influenceAccess && (
                          <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">Influence</span>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/messages")}
                        title="Envoyer un message"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openPermissionsDialog(connection)}
                        title="Gérer les permissions"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDelete(connection)}
                        className="text-destructive hover:text-destructive"
                        title="Supprimer la connexion"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permissions d'accès
            </DialogTitle>
            <DialogDescription>
              Gérez les sections de votre profil auxquelles {selectedConnection?.firstName} peut accéder.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="business" className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full" />
                Business Access
              </Label>
              <Switch
                id="business"
                checked={permissions.businessAccess}
                onCheckedChange={(checked) => setPermissions({ ...permissions, businessAccess: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="family" className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full" />
                Family Access
              </Label>
              <Switch
                id="family"
                checked={permissions.familyAccess}
                onCheckedChange={(checked) => setPermissions({ ...permissions, familyAccess: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="personal" className="flex items-center gap-2">
                <span className="w-3 h-3 bg-purple-500 rounded-full" />
                Personal Access
              </Label>
              <Switch
                id="personal"
                checked={permissions.personalAccess}
                onCheckedChange={(checked) => setPermissions({ ...permissions, personalAccess: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="influence" className="flex items-center gap-2">
                <span className="w-3 h-3 bg-orange-500 rounded-full" />
                Influence Access
              </Label>
              <Switch
                id="influence"
                checked={permissions.influenceAccess}
                onCheckedChange={(checked) => setPermissions({ ...permissions, influenceAccess: checked })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
              Annuler
            </Button>
            <Button onClick={savePermissions}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la connexion ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera la connexion avec {selectedConnection?.firstName} {selectedConnection?.lastName} des deux côtés. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={deleteConnection} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Connections;
