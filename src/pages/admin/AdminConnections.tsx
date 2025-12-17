import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Link2, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConnectionStats {
  totalFriendships: number;
  pendingRequests: number;
  acceptedRequests: number;
  rejectedRequests: number;
}

interface ConnectionRequest {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: string;
  created_at: string;
  requester_name?: string;
  recipient_name?: string;
}

interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  user_name?: string;
  friend_name?: string;
  business_access: boolean;
  family_access: boolean;
  personal_access: boolean;
  influence_access: boolean;
}

export default function AdminConnections() {
  const [stats, setStats] = useState<ConnectionStats | null>(null);
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('requests');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchStats(), fetchRequests(), fetchFriendships()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const [
      { count: totalFriendships },
      { count: pendingRequests },
      { count: acceptedRequests },
      { count: rejectedRequests }
    ] = await Promise.all([
      supabase.from('friendships').select('*', { count: 'exact', head: true }),
      supabase.from('connection_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('connection_requests').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
      supabase.from('connection_requests').select('*', { count: 'exact', head: true }).eq('status', 'rejected')
    ]);

    setStats({
      totalFriendships: totalFriendships || 0,
      pendingRequests: pendingRequests || 0,
      acceptedRequests: acceptedRequests || 0,
      rejectedRequests: rejectedRequests || 0
    });
  };

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('connection_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching requests:', error);
      return;
    }

    // Get profile names for requests
    const userIds = new Set<string>();
    data?.forEach(r => {
      userIds.add(r.requester_id);
      userIds.add(r.recipient_id);
    });

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', Array.from(userIds));

    const profileMap = new Map(profiles?.map(p => [p.id, `${p.first_name} ${p.last_name}`]));

    setRequests(data?.map(r => ({
      ...r,
      requester_name: profileMap.get(r.requester_id) || r.requester_id.substring(0, 8),
      recipient_name: profileMap.get(r.recipient_id) || r.recipient_id.substring(0, 8)
    })) || []);
  };

  const fetchFriendships = async () => {
    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching friendships:', error);
      return;
    }

    // Get profile names for friendships
    const userIds = new Set<string>();
    data?.forEach(f => {
      userIds.add(f.user_id);
      userIds.add(f.friend_id);
    });

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', Array.from(userIds));

    const profileMap = new Map(profiles?.map(p => [p.id, `${p.first_name} ${p.last_name}`]));

    setFriendships(data?.map(f => ({
      ...f,
      user_name: profileMap.get(f.user_id) || f.user_id.substring(0, 8),
      friend_name: profileMap.get(f.friend_id) || f.friend_id.substring(0, 8)
    })) || []);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-400"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500/20 text-green-400"><CheckCircle className="h-3 w-3 mr-1" />Acceptée</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400"><XCircle className="h-3 w-3 mr-1" />Refusée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAccessBadges = (friendship: Friendship) => {
    const badges = [];
    if (friendship.business_access) badges.push(<Badge key="b" variant="outline" className="text-xs">Business</Badge>);
    if (friendship.family_access) badges.push(<Badge key="f" variant="outline" className="text-xs">Family</Badge>);
    if (friendship.personal_access) badges.push(<Badge key="p" variant="outline" className="text-xs">Personal</Badge>);
    if (friendship.influence_access) badges.push(<Badge key="i" variant="outline" className="text-xs">Influence</Badge>);
    return badges;
  };

  const filteredRequests = requests.filter(r =>
    r.requester_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFriendships = friendships.filter(f =>
    f.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.friend_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Connexions</h1>
          <p className="text-muted-foreground">Surveillez les demandes de connexion et les relations entre membres</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Link2 className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats?.totalFriendships || 0}</p>
              <p className="text-xs text-muted-foreground">Connexions actives</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-amber-500" />
              <p className="text-2xl font-bold">{stats?.pendingRequests || 0}</p>
              <p className="text-xs text-muted-foreground">En attente</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{stats?.acceptedRequests || 0}</p>
              <p className="text-xs text-muted-foreground">Acceptées</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <XCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold">{stats?.rejectedRequests || 0}</p>
              <p className="text-xs text-muted-foreground">Refusées</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Connexions & Demandes</CardTitle>
                <CardDescription>Historique des demandes et relations établies</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="requests">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Demandes ({requests.length})
                  </TabsTrigger>
                  <TabsTrigger value="friendships">
                    <Users className="h-4 w-4 mr-2" />
                    Connexions ({friendships.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="requests" className="mt-4">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                      Chargement...
                    </div>
                  ) : filteredRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      Aucune demande trouvée
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredRequests.map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              <UserPlus className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {request.requester_name} → {request.recipient_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(request.created_at).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="friendships" className="mt-4">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                      Chargement...
                    </div>
                  ) : filteredFriendships.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      Aucune connexion trouvée
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredFriendships.map((friendship) => (
                        <div
                          key={friendship.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              <Link2 className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {friendship.user_name} ↔ {friendship.friend_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Connectés le {new Date(friendship.created_at).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {getAccessBadges(friendship)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
