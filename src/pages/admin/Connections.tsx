import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Network,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { useLanguage } from "@/contexts/LanguageContext";

interface Connection {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  business_access: boolean;
  family_access: boolean;
  personal_access: boolean;
  influence_access: boolean;
  network_access: boolean;
  user_name?: string;
  friend_name?: string;
}

interface ConnectionRequest {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  requester_name?: string;
  recipient_name?: string;
}

const AdminConnections = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadConnections(),
        loadConnectionRequests()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const loadConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          user:profiles!friendships_user_id_fkey(first_name, last_name),
          friend:profiles!friendships_friend_id_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedConnections = (data || []).map((conn: any) => ({
        ...conn,
        user_name: conn.user ? `${conn.user.first_name} ${conn.user.last_name}` : 'Unknown',
        friend_name: conn.friend ? `${conn.friend.first_name} ${conn.friend.last_name}` : 'Unknown',
      }));

      setConnections(formattedConnections);
    } catch (error) {
      console.error('Error loading connections:', error);
      toast.error(t('error'));
    }
  };

  const loadConnectionRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('connection_requests')
        .select(`
          *,
          requester:profiles!connection_requests_requester_id_fkey(first_name, last_name),
          recipient:profiles!connection_requests_recipient_id_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedRequests = (data || []).map((req: any) => ({
        ...req,
        requester_name: req.requester ? `${req.requester.first_name} ${req.requester.last_name}` : 'Unknown',
        recipient_name: req.recipient ? `${req.recipient.first_name} ${req.recipient.last_name}` : 'Unknown',
      }));

      setConnectionRequests(formattedRequests);
    } catch (error) {
      console.error('Error loading connection requests:', error);
      toast.error(t('error'));
    }
  };

  const handleDeleteConnection = async (id: string) => {
    if (!confirm(t('deleteConnectionConfirm'))) return;

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success(t('connectionDeleted'));
      loadConnections();
    } catch (error) {
      console.error('Error deleting connection:', error);
      toast.error(t('error'));
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm(t('deleteRequestConfirm'))) return;

    try {
      const { error } = await supabase
        .from('connection_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success(t('requestDeleted'));
      loadConnectionRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error(t('error'));
    }
  };

  const filteredConnections = connections.filter(conn =>
    conn.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conn.friend_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRequests = connectionRequests.filter(req =>
    req.requester_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30"><Clock className="mr-1 h-3 w-3" /> {t('pendingStatus')}</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30"><CheckCircle className="mr-1 h-3 w-3" /> {t('acceptedStatus')}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30"><XCircle className="mr-1 h-3 w-3" /> {t('rejectedStatus')}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif text-gold mb-2">{t('adminConnections')}</h1>
            <p className="text-gold/60">{t('adminConnectionsDescription')}</p>
          </div>
          <Button
            onClick={loadData}
            disabled={loading}
            variant="outline"
            className="border-gold/30 text-gold hover:bg-gold/10"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
        </div>

        <Tabs defaultValue="connections" className="space-y-4">
          <TabsList className="bg-[hsl(var(--navy-blue-light))] border border-gold/20">
            <TabsTrigger value="connections" className="text-gold data-[state=active]:bg-gold/20">
              <Users className="mr-2 h-4 w-4" />
              {t('connections')} ({connections.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="text-gold data-[state=active]:bg-gold/20">
              <Clock className="mr-2 h-4 w-4" />
              {t('connectionRequests')} ({connectionRequests.length})
            </TabsTrigger>
          </TabsList>

          {/* Connections Tab */}
          <TabsContent value="connections" className="space-y-4">
            <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gold">{t('establishedConnections')}</CardTitle>
                    <CardDescription className="text-gold/60">
                      {t('establishedConnectionsDescription')}
                    </CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gold/60" />
                    <Input
                      placeholder={t('search')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-black/50 border-gold/30 text-gold w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gold/20">
                      <TableHead className="text-gold">{t('member1')}</TableHead>
                      <TableHead className="text-gold">{t('member2')}</TableHead>
                      <TableHead className="text-gold">{t('date')}</TableHead>
                      <TableHead className="text-gold">{t('permissions')}</TableHead>
                      <TableHead className="text-gold">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredConnections.map((conn) => (
                        <TableRow key={conn.id} className="border-gold/10">
                          <TableCell className="text-gold/90">{conn.user_name}</TableCell>
                          <TableCell className="text-gold/90">{conn.friend_name}</TableCell>
                          <TableCell className="text-gold/60">
                            {new Date(conn.created_at).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {conn.business_access && <Badge variant="outline" className="text-xs border-gold/30 text-gold">Business</Badge>}
                              {conn.family_access && <Badge variant="outline" className="text-xs border-gold/30 text-gold">Family</Badge>}
                              {conn.personal_access && <Badge variant="outline" className="text-xs border-gold/30 text-gold">Personal</Badge>}
                              {conn.network_access && <Badge variant="outline" className="text-xs border-gold/30 text-gold">Network</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteConnection(conn.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gold">{t('connectionRequests')}</CardTitle>
                    <CardDescription className="text-gold/60">
                      {t('connectionRequestsDescription')}
                    </CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gold/60" />
                    <Input
                      placeholder={t('search')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-black/50 border-gold/30 text-gold w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gold/20">
                        <TableHead className="text-gold">{t('requester')}</TableHead>
                        <TableHead className="text-gold">{t('recipient')}</TableHead>
                        <TableHead className="text-gold">{t('status')}</TableHead>
                        <TableHead className="text-gold">{t('date')}</TableHead>
                        <TableHead className="text-gold">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((req) => (
                        <TableRow key={req.id} className="border-gold/10">
                          <TableCell className="text-gold/90">{req.requester_name}</TableCell>
                          <TableCell className="text-gold/90">{req.recipient_name}</TableCell>
                          <TableCell>{getStatusBadge(req.status)}</TableCell>
                          <TableCell className="text-gold/60">
                            {new Date(req.created_at).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRequest(req.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminConnections;

