import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Settings, Briefcase, User, TrendingUp, Network } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { EditConnectionPermissionsDialog } from "@/components/EditConnectionPermissionsDialog";

interface Connection {
  id: string;
  friend_id: string;
  created_at: string;
  business_access: boolean;
  family_access: boolean;
  personal_access: boolean;
  influence_access: boolean;
  network_access: boolean;
  friend_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    job_function: string | null;
  };
}

const Connections = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);

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

      // Load friendships where current user is user_id
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('id, friend_id, created_at, business_access, family_access, personal_access, influence_access, network_access')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load profiles for friends
      if (friendships && friendships.length > 0) {
        const friendIds = friendships.map(f => f.friend_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, job_function')
          .in('id', friendIds);

        if (profilesError) throw profilesError;

        const connectionsWithProfiles = friendships.map(friendship => ({
          ...friendship,
          friend_profile: profiles?.find(p => p.id === friendship.friend_id)
        }));

        setConnections(connectionsWithProfiles as Connection[]);
      } else {
        setConnections([]);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
      toast.error(t('errorLoadingConnections') || "Erreur lors du chargement des connexions");
    } finally {
      setLoading(false);
    }
  };

  const handleEditPermissions = (connection: Connection) => {
    setEditingConnection(connection);
    setPermissionsDialogOpen(true);
  };

  const handleSavePermissions = async (permissions: {
    business_access: boolean;
    family_access: boolean;
    personal_access: boolean;
    influence_access: boolean;
    network_access: boolean;
  }) => {
    if (!editingConnection) return;

    try {
      const { error } = await supabase
        .from('friendships')
        .update(permissions)
        .eq('id', editingConnection.id);

      if (error) throw error;

      toast.success(t('permissionsUpdated') || "Permissions mises à jour avec succès");
      setPermissionsDialogOpen(false);
      setEditingConnection(null);
      loadConnections();
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error(t('errorUpdatingPermissions') || "Erreur lors de la mise à jour des permissions");
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'business_access':
        return Briefcase;
      case 'family_access':
        return Users;
      case 'personal_access':
        return User;
      case 'influence_access':
        return TrendingUp;
      case 'network_access':
        return Network;
      default:
        return Settings;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p>{t('loading') || 'Chargement...'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('back') || 'Retour'}
              </Button>
              <h1 className="text-3xl font-serif text-primary tracking-wide">
                {t('myConnections') || 'Mes Connexions'}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {connections.length === 0 ? (
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg mb-2">
                  {t('noConnectionsYet') || 'Aucune connexion pour le moment'}
                </p>
                <p className="text-muted-foreground/60 text-sm">
                  {t('noConnectionsDesc') || 'Les connexions apparaîtront ici une fois que vous aurez accepté des demandes.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connections.map((connection) => {
              const friend = connection.friend_profile;
              if (!friend) return null;

              return (
                <Card key={connection.id} className="border-primary/20 hover:border-primary/40 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        <AvatarImage src={friend.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(friend.first_name, friend.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {friend.first_name} {friend.last_name}
                        </CardTitle>
                        {friend.job_function && (
                          <CardDescription className="text-sm">
                            {friend.job_function}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        {t('permissions') || 'Permissions accordées:'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries({
                          business_access: connection.business_access,
                          family_access: connection.family_access,
                          personal_access: connection.personal_access,
                          influence_access: connection.influence_access,
                          network_access: connection.network_access,
                        }).map(([key, value]) => {
                          if (!value) return null;
                          const Icon = getPermissionIcon(key);
                          return (
                            <Badge
                              key={key}
                              variant="outline"
                              className="text-xs border-primary/30"
                            >
                              <Icon className="w-3 h-3 mr-1" />
                              {t(key) || key.replace('_access', '')}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleEditPermissions(connection)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {t('editPermissions') || 'Modifier les permissions'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {editingConnection && (
        <EditConnectionPermissionsDialog
          open={permissionsDialogOpen}
          onOpenChange={setPermissionsDialogOpen}
          friendName={`${editingConnection.friend_profile?.first_name || ''} ${editingConnection.friend_profile?.last_name || ''}`.trim()}
          currentPermissions={{
            business_access: editingConnection.business_access,
            family_access: editingConnection.family_access,
            personal_access: editingConnection.personal_access,
            influence_access: editingConnection.influence_access,
            network_access: editingConnection.network_access,
          }}
          onSave={handleSavePermissions}
        />
      )}
    </div>
  );
};

export default Connections;

