import { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminPagination } from '@/components/ui/admin-pagination';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { fr, enUS, es, de, it, ptBR, ar, zhCN, ja, ru, type Locale } from 'date-fns/locale';

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
  const { t, language } = useLanguage();
  
  const localeMap: Record<string, Locale> = {
    'fr': fr,
    'en': enUS,
    'es': es,
    'de': de,
    'it': it,
    'pt': ptBR,
    'ar': ar,
    'zh': zhCN,
    'ja': ja,
    'ru': ru
  };
  const [stats, setStats] = useState<ConnectionStats | null>(null);
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('requests');

  // Pagination state for requests
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsPageSize, setRequestsPageSize] = useState(10);
  
  // Pagination state for friendships
  const [friendshipsPage, setFriendshipsPage] = useState(1);
  const [friendshipsPageSize, setFriendshipsPageSize] = useState(10);

  useEffect(() => {
    fetchData();
  }, []);

  // Reset page when search changes
  useEffect(() => {
    setRequestsPage(1);
    setFriendshipsPage(1);
  }, [searchTerm]);

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
      .order('created_at', { ascending: false });

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
      .order('created_at', { ascending: false });

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
        return <Badge className="bg-amber-500/20 text-amber-400"><Clock className="h-3 w-3 mr-1" />{t('adminPending')}</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500/20 text-green-400"><CheckCircle className="h-3 w-3 mr-1" />{t('adminAccepted')}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400"><XCircle className="h-3 w-3 mr-1" />{t('adminRefused')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAccessBadges = (friendship: Friendship) => {
    const badges = [];
    if (friendship.business_access) badges.push(<Badge key="b" variant="outline" className="text-xs">{t('adminBusiness')}</Badge>);
    if (friendship.family_access) badges.push(<Badge key="f" variant="outline" className="text-xs">{t('adminFamily')}</Badge>);
    if (friendship.personal_access) badges.push(<Badge key="p" variant="outline" className="text-xs">{t('adminPersonal')}</Badge>);
    if (friendship.influence_access) badges.push(<Badge key="i" variant="outline" className="text-xs">{t('adminInfluence')}</Badge>);
    return badges;
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(r =>
      r.requester_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [requests, searchTerm]);

  const filteredFriendships = useMemo(() => {
    return friendships.filter(f =>
      f.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.friend_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [friendships, searchTerm]);

  // Paginated data
  const paginatedRequests = useMemo(() => {
    const start = (requestsPage - 1) * requestsPageSize;
    return filteredRequests.slice(start, start + requestsPageSize);
  }, [filteredRequests, requestsPage, requestsPageSize]);

  const paginatedFriendships = useMemo(() => {
    const start = (friendshipsPage - 1) * friendshipsPageSize;
    return filteredFriendships.slice(start, start + friendshipsPageSize);
  }, [filteredFriendships, friendshipsPage, friendshipsPageSize]);

  // Pagination calculations
  const requestsTotalPages = Math.ceil(filteredRequests.length / requestsPageSize);
  const requestsStartIndex = filteredRequests.length > 0 ? (requestsPage - 1) * requestsPageSize + 1 : 0;
  const requestsEndIndex = Math.min(requestsPage * requestsPageSize, filteredRequests.length);

  const friendshipsTotalPages = Math.ceil(filteredFriendships.length / friendshipsPageSize);
  const friendshipsStartIndex = filteredFriendships.length > 0 ? (friendshipsPage - 1) * friendshipsPageSize + 1 : 0;
  const friendshipsEndIndex = Math.min(friendshipsPage * friendshipsPageSize, filteredFriendships.length);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('adminConnectionsManagement')}</h1>
          <p className="text-muted-foreground">{t('adminConnectionsDescription')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Link2 className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats?.totalFriendships || 0}</p>
              <p className="text-xs text-muted-foreground">{t('adminActiveConnections')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-amber-500" />
              <p className="text-2xl font-bold">{stats?.pendingRequests || 0}</p>
              <p className="text-xs text-muted-foreground">{t('adminPending')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{stats?.acceptedRequests || 0}</p>
              <p className="text-xs text-muted-foreground">{t('adminAccepted')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <XCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold">{stats?.rejectedRequests || 0}</p>
              <p className="text-xs text-muted-foreground">{t('adminRefused')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('adminConnectionsAndRequests')}</CardTitle>
                <CardDescription>{t('adminConnectionsHistory')}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {t('adminRefresh')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('adminSearchByName')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="requests" className="h-9 sm:h-10 px-2 sm:px-4">
                    <UserPlus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t('adminRequests')}</span>
                    <span className="sm:hidden">({filteredRequests.length})</span>
                    <span className="hidden sm:inline"> ({filteredRequests.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="friendships" className="h-9 sm:h-10 px-2 sm:px-4">
                    <Users className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t('adminConnections')}</span>
                    <span className="sm:hidden">({filteredFriendships.length})</span>
                    <span className="hidden sm:inline"> ({filteredFriendships.length})</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="requests" className="mt-4">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                      {t('loading')}
                    </div>
                  ) : filteredRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      {t('adminNoRequestFound')}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {paginatedRequests.map((request) => (
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
                                  {format(new Date(request.created_at), 'dd MMM yyyy, HH:mm', { 
                                    locale: localeMap[language] || fr 
                                  })}
                                </p>
                              </div>
                            </div>
                            {getStatusBadge(request.status)}
                          </div>
                        ))}
                      </div>

                      <AdminPagination
                        currentPage={requestsPage}
                        totalPages={requestsTotalPages}
                        totalItems={filteredRequests.length}
                        pageSize={requestsPageSize}
                        onPageChange={setRequestsPage}
                        onPageSizeChange={(size) => { setRequestsPageSize(size); setRequestsPage(1); }}
                        startIndex={requestsStartIndex}
                        endIndex={requestsEndIndex}
                      />
                    </>
                  )}
                </TabsContent>

                <TabsContent value="friendships" className="mt-4">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                      {t('loading')}
                    </div>
                  ) : filteredFriendships.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      {t('adminNoConnectionFound')}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {paginatedFriendships.map((friendship) => (
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
                                  {t('adminConnectedOn')} {format(new Date(friendship.created_at), 'dd MMM yyyy', { 
                                    locale: localeMap[language] || fr 
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {getAccessBadges(friendship)}
                            </div>
                          </div>
                        ))}
                      </div>

                      <AdminPagination
                        currentPage={friendshipsPage}
                        totalPages={friendshipsTotalPages}
                        totalItems={filteredFriendships.length}
                        pageSize={friendshipsPageSize}
                        onPageChange={setFriendshipsPage}
                        onPageSizeChange={(size) => { setFriendshipsPageSize(size); setFriendshipsPage(1); }}
                        startIndex={friendshipsStartIndex}
                        endIndex={friendshipsEndIndex}
                      />
                    </>
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
