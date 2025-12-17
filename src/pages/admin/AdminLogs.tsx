import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ScrollText, 
  Search, 
  RefreshCw,
  Database,
  Plus,
  Edit,
  Trash2,
  User,
  Calendar,
  Table2,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ActivityLog {
  id: string;
  user_id: string | null;
  table_name: string;
  operation: string;
  record_id: string | null;
  old_data: any;
  new_data: any;
  created_at: string;
  user_name?: string;
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableFilter, setTableFilter] = useState('all');
  const [operationFilter, setOperationFilter] = useState('all');
  const [tables, setTables] = useState<string[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      // Get unique user IDs
      const userIds = [...new Set(data?.filter(l => l.user_id).map(l => l.user_id) || [])];
      
      // Fetch user names
      let profileMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIds);
        
        profiles?.forEach(p => {
          profileMap.set(p.id, `${p.first_name} ${p.last_name}`);
        });
      }

      // Get unique tables
      const uniqueTables = [...new Set(data?.map(l => l.table_name) || [])];
      setTables(uniqueTables);

      setLogs(data?.map(log => ({
        ...log,
        user_name: log.user_id ? profileMap.get(log.user_id) || 'Utilisateur inconnu' : 'Système'
      })) || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Erreur lors du chargement des logs');
    } finally {
      setLoading(false);
    }
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'INSERT': return <Plus className="h-4 w-4 text-green-500" />;
      case 'UPDATE': return <Edit className="h-4 w-4 text-blue-500" />;
      case 'DELETE': return <Trash2 className="h-4 w-4 text-red-500" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getOperationBadge = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return <Badge className="bg-green-500/20 text-green-400">INSERT</Badge>;
      case 'UPDATE':
        return <Badge className="bg-blue-500/20 text-blue-400">UPDATE</Badge>;
      case 'DELETE':
        return <Badge className="bg-red-500/20 text-red-400">DELETE</Badge>;
      default:
        return <Badge variant="outline">{operation}</Badge>;
    }
  };

  const getTableBadge = (tableName: string) => {
    const colors: Record<string, string> = {
      'profiles': 'bg-purple-500/20 text-purple-400',
      'connection_requests': 'bg-amber-500/20 text-amber-400',
      'friendships': 'bg-cyan-500/20 text-cyan-400',
      'messages': 'bg-pink-500/20 text-pink-400',
      'business_content': 'bg-blue-500/20 text-blue-400',
      'family_content': 'bg-green-500/20 text-green-400',
      'personal_content': 'bg-orange-500/20 text-orange-400',
    };
    return <Badge className={colors[tableName] || 'bg-muted text-muted-foreground'}>{tableName}</Badge>;
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.record_id?.includes(searchTerm);
    const matchesTable = tableFilter === 'all' || log.table_name === tableFilter;
    const matchesOperation = operationFilter === 'all' || log.operation === operationFilter;
    return matchesSearch && matchesTable && matchesOperation;
  });

  const exportLogs = () => {
    const csvContent = [
      ['Date', 'Utilisateur', 'Table', 'Opération', 'Record ID'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.created_at).toISOString(),
        log.user_name || 'Système',
        log.table_name,
        log.operation,
        log.record_id || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success(`${filteredLogs.length} logs exportés`);
  };

  const stats = {
    total: logs.length,
    inserts: logs.filter(l => l.operation === 'INSERT').length,
    updates: logs.filter(l => l.operation === 'UPDATE').length,
    deletes: logs.filter(l => l.operation === 'DELETE').length,
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Logs d'Activité</h1>
          <p className="text-muted-foreground">Historique complet des opérations sur la base de données</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Database className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total logs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Plus className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{stats.inserts}</p>
              <p className="text-xs text-muted-foreground">Insertions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Edit className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{stats.updates}</p>
              <p className="text-xs text-muted-foreground">Modifications</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Trash2 className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold">{stats.deletes}</p>
              <p className="text-xs text-muted-foreground">Suppressions</p>
            </CardContent>
          </Card>
        </div>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ScrollText className="h-5 w-5" />
                  Journal des opérations
                </CardTitle>
                <CardDescription>
                  Toutes les entrées et sorties de la base de données
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportLogs}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter CSV
                </Button>
                <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={tableFilter} onValueChange={setTableFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Table2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Table" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les tables</SelectItem>
                    {tables.map(table => (
                      <SelectItem key={table} value={table}>{table}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={operationFilter} onValueChange={setOperationFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Opération" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="INSERT">INSERT</SelectItem>
                    <SelectItem value="UPDATE">UPDATE</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Logs List */}
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  Chargement des logs...
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ScrollText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Aucun log trouvé
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          {getOperationIcon(log.operation)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {getTableBadge(log.table_name)}
                            {getOperationBadge(log.operation)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <User className="h-3 w-3" />
                            <span>{log.user_name}</span>
                            <span>•</span>
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(log.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </span>
                            {log.record_id && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-xs">ID: {log.record_id.substring(0, 8)}...</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
