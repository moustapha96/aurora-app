import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Search,
  RefreshCw,
  Download,
  Filter,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { useLanguage } from "@/contexts/LanguageContext";

interface LogEntry {
  id: string;
  user_id: string;
  user_name?: string;
  activity_type: string;
  activity_description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: any;
  created_at: string;
}

const AdminLogs = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  useEffect(() => {
    loadLogs();
  }, [filterType, dateFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('user_activities')
        .select(`
          *,
          user:profiles!user_activities_user_id_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(500);

      if (filterType !== 'all') {
        query = query.eq('activity_type', filterType);
      }

      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (dateFilter) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const formatted = (data || []).map((log: any) => ({
        ...log,
        user_name: log.user ? `${log.user.first_name} ${log.user.last_name}` : 'Unknown',
      }));

      setLogs(formatted);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const getActivityTypeBadge = (type: string) => {
    const colors: { [key: string]: string } = {
      'login': 'bg-green-500/20 text-green-500 border-green-500/30',
      'logout': 'bg-gray-500/20 text-gray-500 border-gray-500/30',
      'profile_update': 'bg-blue-500/20 text-blue-500 border-blue-500/30',
      'password_change': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      'email_verification': 'bg-purple-500/20 text-purple-500 border-purple-500/30',
      'connection_request': 'bg-pink-500/20 text-pink-500 border-pink-500/30',
      'message_sent': 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30',
      'content_created': 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30',
      'content_updated': 'bg-orange-500/20 text-orange-500 border-orange-500/30',
      'content_deleted': 'bg-red-500/20 text-red-500 border-red-500/30',
    };

    return (
      <Badge className={colors[type] || 'bg-gray-500/20 text-gray-500 border-gray-500/30'}>
        {type}
      </Badge>
    );
  };

  const handleExport = () => {
    const csv = [
      ['Date', 'Utilisateur', 'Type', 'Description', 'IP', 'User Agent'].join(','),
      ...logs.map(log => [
        new Date(log.created_at).toISOString(),
        log.user_name || 'Unknown',
        log.activity_type,
        log.activity_description || '',
        log.ip_address || '',
        log.user_agent || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(log =>
    log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.activity_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.activity_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.ip_address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif text-gold mb-2">{t('adminLogs')}</h1>
            <p className="text-gold/60">{t('adminLogsDescription')}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExport}
              variant="outline"
              className="border-gold/30 text-gold hover:bg-gold/10"
            >
              <Download className="mr-2 h-4 w-4" />
              {t('exportCSV')}
            </Button>
            <Button
              onClick={loadLogs}
              disabled={loading}
              variant="outline"
              className="border-gold/30 text-gold hover:bg-gold/10"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </Button>
          </div>
        </div>

        <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-gold">Activités</CardTitle>
                    <CardDescription className="text-gold/60">
                      {filteredLogs.length} {t('entriesFound')}
                    </CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gold/60" />
                  <Input
                      placeholder={t('search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-black/50 border-gold/30 text-gold w-64"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="bg-black/50 border-gold/30 text-gold w-48">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder={t('activityType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allTypes')}</SelectItem>
                    <SelectItem value="login">Connexion</SelectItem>
                    <SelectItem value="logout">Déconnexion</SelectItem>
                    <SelectItem value="profile_update">Mise à jour profil</SelectItem>
                    <SelectItem value="password_change">Changement mot de passe</SelectItem>
                    <SelectItem value="email_verification">Vérification email</SelectItem>
                    <SelectItem value="connection_request">Demande de connexion</SelectItem>
                    <SelectItem value="message_sent">Message envoyé</SelectItem>
                    <SelectItem value="content_created">Contenu créé</SelectItem>
                    <SelectItem value="content_updated">Contenu modifié</SelectItem>
                    <SelectItem value="content_deleted">Contenu supprimé</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="bg-black/50 border-gold/30 text-gold w-48">
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue placeholder={t('allPeriods')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allPeriods')}</SelectItem>
                    <SelectItem value="today">{t('today')}</SelectItem>
                    <SelectItem value="week">{t('last7Days')}</SelectItem>
                    <SelectItem value="month">{t('last30Days')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gold/20">
                      <TableHead className="text-gold">{t('activityDate')}</TableHead>
                      <TableHead className="text-gold">{t('activityUser')}</TableHead>
                      <TableHead className="text-gold">{t('activityType')}</TableHead>
                      <TableHead className="text-gold">{t('activityDescription')}</TableHead>
                      <TableHead className="text-gold">{t('ipAddress')}</TableHead>
                      <TableHead className="text-gold">{t('userAgent')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="border-gold/10">
                      <TableCell className="text-gold/60">
                        {new Date(log.created_at).toLocaleString(language === 'ar' ? 'ar-SA' : language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : language === 'ru' ? 'ru-RU' : language)}
                      </TableCell>
                      <TableCell className="text-gold/90">{log.user_name}</TableCell>
                      <TableCell>{getActivityTypeBadge(log.activity_type)}</TableCell>
                      <TableCell className="text-gold/70 max-w-xs truncate">
                        {log.activity_description || 'N/A'}
                      </TableCell>
                      <TableCell className="text-gold/60 text-sm">
                        {log.ip_address || 'N/A'}
                      </TableCell>
                      <TableCell className="text-gold/60 text-sm max-w-xs truncate">
                        {log.user_agent || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminLogs;

