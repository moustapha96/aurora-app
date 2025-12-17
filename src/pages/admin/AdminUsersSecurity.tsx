import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Search, Shield, Fingerprint, Smartphone, Monitor, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UserSecurity {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  biometric_enabled: boolean;
  webauthn_enabled: boolean;
  created_at: string;
  updated_at: string;
  webauthn_devices_count: number;
  last_activity: string | null;
}

const AdminUsersSecurity = () => {
  const [users, setUsers] = useState<UserSecurity[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserSecurity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(user =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, biometric_enabled, webauthn_enabled, created_at, updated_at');

      if (profilesError) throw profilesError;

      // Get WebAuthn credentials count for each user
      const { data: credentials, error: credentialsError } = await supabase
        .from('webauthn_credentials')
        .select('user_id');

      if (credentialsError) throw credentialsError;

      // Get last activity from activity_logs
      const { data: activityLogs, error: logsError } = await supabase
        .from('activity_logs')
        .select('user_id, created_at')
        .order('created_at', { ascending: false });

      // Count credentials per user
      const credentialCounts: Record<string, number> = {};
      credentials?.forEach(cred => {
        credentialCounts[cred.user_id] = (credentialCounts[cred.user_id] || 0) + 1;
      });

      // Get last activity per user
      const lastActivity: Record<string, string> = {};
      activityLogs?.forEach(log => {
        if (log.user_id && !lastActivity[log.user_id]) {
          lastActivity[log.user_id] = log.created_at;
        }
      });

      const usersWithSecurity: UserSecurity[] = (profiles || []).map(profile => ({
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        avatar_url: profile.avatar_url,
        biometric_enabled: profile.biometric_enabled || false,
        webauthn_enabled: profile.webauthn_enabled || false,
        created_at: profile.created_at || '',
        updated_at: profile.updated_at || '',
        webauthn_devices_count: credentialCounts[profile.id] || 0,
        last_activity: lastActivity[profile.id] || null
      }));

      setUsers(usersWithSecurity);
      setFilteredUsers(usersWithSecurity);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSecurityLevel = (user: UserSecurity) => {
    const hasWebAuthn = user.webauthn_enabled && user.webauthn_devices_count > 0;
    const hasBiometric = user.biometric_enabled;
    
    if (hasWebAuthn && hasBiometric) return { level: 'high', label: 'Élevé', color: 'bg-green-500' };
    if (hasWebAuthn || hasBiometric) return { level: 'medium', label: 'Moyen', color: 'bg-yellow-500' };
    return { level: 'low', label: 'Basique', color: 'bg-red-500' };
  };

  const formatLastActivity = (date: string | null) => {
    if (!date) return 'Jamais';
    const activityDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 5) return 'En ligne';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)}h`;
    return format(activityDate, 'dd MMM yyyy', { locale: fr });
  };

  const getActivityStatus = (date: string | null) => {
    if (!date) return 'offline';
    const diffMs = new Date().getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 5) return 'online';
    if (diffMins < 30) return 'away';
    return 'offline';
  };

  const stats = {
    total: users.length,
    withWebAuthn: users.filter(u => u.webauthn_enabled).length,
    withBiometric: users.filter(u => u.biometric_enabled).length,
    highSecurity: users.filter(u => getSecurityLevel(u).level === 'high').length
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sécurité des Utilisateurs</h1>
          <p className="text-muted-foreground">Gérez et surveillez les paramètres de sécurité des membres</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Utilisateurs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Monitor className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.withWebAuthn}</p>
                  <p className="text-sm text-muted-foreground">WebAuthn activé</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Smartphone className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.withBiometric}</p>
                  <p className="text-sm text-muted-foreground">Biométrie mobile</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gold/10 rounded-lg">
                  <Fingerprint className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.highSecurity}</p>
                  <p className="text-sm text-muted-foreground">Sécurité élevée</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Liste des utilisateurs</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>WebAuthn</TableHead>
                    <TableHead>Biométrie Mobile</TableHead>
                    <TableHead>Appareils</TableHead>
                    <TableHead>Niveau Sécurité</TableHead>
                    <TableHead>Dernière activité</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const securityLevel = getSecurityLevel(user);
                    const activityStatus = getActivityStatus(user.last_activity);
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={user.avatar_url || ''} />
                                <AvatarFallback className="bg-gold/20 text-gold">
                                  {user.first_name[0]}{user.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                                activityStatus === 'online' ? 'bg-green-500' :
                                activityStatus === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium">{user.first_name} {user.last_name}</p>
                              <p className="text-xs text-muted-foreground">
                                Inscrit le {format(new Date(user.created_at), 'dd MMM yyyy', { locale: fr })}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={activityStatus === 'online' ? 'default' : 'secondary'} className={
                            activityStatus === 'online' ? 'bg-green-500' :
                            activityStatus === 'away' ? 'bg-yellow-500' : ''
                          }>
                            {activityStatus === 'online' ? 'En ligne' :
                             activityStatus === 'away' ? 'Absent' : 'Hors ligne'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.webauthn_enabled ? (
                            <div className="flex items-center gap-1 text-green-500">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">Activé</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <XCircle className="h-4 w-4" />
                              <span className="text-sm">Désactivé</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.biometric_enabled ? (
                            <div className="flex items-center gap-1 text-green-500">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">Activé</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <XCircle className="h-4 w-4" />
                              <span className="text-sm">Désactivé</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {user.webauthn_devices_count} appareil{user.webauthn_devices_count !== 1 ? 's' : ''}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${securityLevel.color} text-white`}>
                            {securityLevel.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatLastActivity(user.last_activity)}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminUsersSecurity;
