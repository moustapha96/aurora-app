import { useState, useEffect, useMemo } from 'react';
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
import { AdminPagination } from '@/components/ui/admin-pagination';
import { useLanguage } from '@/contexts/LanguageContext';
import { format, type Locale } from 'date-fns';
import { fr, enUS, es, de, it, ptBR, ar, zhCN, ja, ru } from 'date-fns/locale';

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
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableFilter, setTableFilter] = useState('all');
  const [operationFilter, setOperationFilter] = useState('all');
  const [tables, setTables] = useState<string[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchLogs();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, tableFilter, operationFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

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
        user_name: log.user_id ? profileMap.get(log.user_id) || t('adminUnknownUser') : t('adminSystem')
      })) || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error(t('adminLogsLoadError'));
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

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.record_id?.includes(searchTerm);
      const matchesTable = tableFilter === 'all' || log.table_name === tableFilter;
      const matchesOperation = operationFilter === 'all' || log.operation === operationFilter;
      return matchesSearch && matchesTable && matchesOperation;
    });
  }, [logs, searchTerm, tableFilter, operationFilter]);

  // Paginate filtered logs
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredLogs.slice(startIndex, startIndex + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const startIndex = filteredLogs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endIndex = Math.min(currentPage * pageSize, filteredLogs.length);

  const exportLogs = () => {
    const csvContent = [
      ['Date', t('adminUser'), 'Table', t('adminOperation'), 'Record ID'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.created_at).toISOString(),
        log.user_name || t('adminSystem'),
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
    toast.success(t('adminLogsExported').replace('{count}', filteredLogs.length.toString()));
  };

  const stats = {
    total: logs.length,
    inserts: logs.filter(l => l.operation === 'INSERT').length,
    updates: logs.filter(l => l.operation === 'UPDATE').length,
    deletes: logs.filter(l => l.operation === 'DELETE').length,
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('adminActivityLogs')}</h1>
          <p className="text-muted-foreground">{t('adminActivityLogsDescription')}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Database className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">{t('adminTotalLogs')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Plus className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{stats.inserts}</p>
              <p className="text-xs text-muted-foreground">{t('adminInsertions')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Edit className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{stats.updates}</p>
              <p className="text-xs text-muted-foreground">{t('adminModifications')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Trash2 className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold">{stats.deletes}</p>
              <p className="text-xs text-muted-foreground">{t('adminDeletions')}</p>
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
                  {t('adminOperationsLog')}
                </CardTitle>
                <CardDescription>
                  {t('adminAllDatabaseOperations')}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportLogs} className="h-9 sm:h-10 px-2 sm:px-4">
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t('adminExportCSV')}</span>
                </Button>
                <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {t('adminRefresh')}
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
                    placeholder={t('search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={tableFilter} onValueChange={setTableFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Table2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={t('adminTable')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('adminAllTables')}</SelectItem>
                    {tables.map(table => (
                      <SelectItem key={table} value={table}>{table}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={operationFilter} onValueChange={setOperationFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder={t('adminOperation')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('adminAll')}</SelectItem>
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
                  {t('adminLoadingLogs')}
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ScrollText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  {t('adminNoLogsFound')}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {paginatedLogs.map((log) => (
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
                                {format(new Date(log.created_at), 'dd MMM yyyy HH:mm:ss', { 
                                  locale: localeMap[language] || fr 
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

                  {/* Pagination */}
                  {filteredLogs.length > 0 && (
                    <AdminPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredLogs.length}
                      pageSize={pageSize}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                      startIndex={startIndex}
                      endIndex={endIndex}
                    />
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
