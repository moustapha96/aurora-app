import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  FileBarChart,
  Download,
  Calendar,
  TrendingUp,
  Users,
  MessageSquare,
  Network,
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { useLanguage } from "@/contexts/LanguageContext";

interface ReportData {
  period: string;
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  totalConnections: number;
  newConnections: number;
  totalMessages: number;
  totalContent: number;
  loginCount: number;
}

const AdminReports = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<string>("month");
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    loadReport();
  }, [period]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Load all data in parallel
      const [
        { count: totalUsers },
        { count: newUsers },
        { count: totalConnections },
        { count: newConnections },
        { count: totalMessages },
        { count: totalContent },
        { count: loginCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString()),
        supabase.from('friendships').select('*', { count: 'exact', head: true }),
        supabase.from('friendships').select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString()),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('network_content').select('*', { count: 'exact', head: true }),
        supabase.from('user_activities').select('*', { count: 'exact', head: true }).eq('activity_type', 'login').gte('created_at', startDate.toISOString())
      ]);

      // Get active users (users who logged in during the period)
      const { count: activeUsers } = await supabase
        .from('user_activities')
        .select('user_id', { count: 'exact', head: true })
        .eq('activity_type', 'login')
        .gte('created_at', startDate.toISOString());

      setReportData({
        period,
        totalUsers: totalUsers || 0,
        newUsers: newUsers || 0,
        activeUsers: activeUsers || 0,
        totalConnections: totalConnections || 0,
        newConnections: newConnections || 0,
        totalMessages: totalMessages || 0,
        totalContent: totalContent || 0,
        loginCount: loginCount || 0,
      });
    } catch (error) {
      console.error('Error loading report:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!reportData) return;

    const csv = [
      ['Période', 'Valeur'].join(','),
      ['Total Utilisateurs', reportData.totalUsers].join(','),
      ['Nouveaux Utilisateurs', reportData.newUsers].join(','),
      ['Utilisateurs Actifs', reportData.activeUsers].join(','),
      ['Total Connexions', reportData.totalConnections].join(','),
      ['Nouvelles Connexions', reportData.newConnections].join(','),
      ['Total Messages', reportData.totalMessages].join(','),
      ['Total Contenu', reportData.totalContent].join(','),
      ['Connexions (Logins)', reportData.loginCount].join(','),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif text-gold mb-2">{t('adminReports')}</h1>
            <p className="text-gold/60">{t('adminReportsDescription')}</p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="bg-black/50 border-gold/30 text-gold w-48">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">{t('last7Days')}</SelectItem>
                <SelectItem value="month">{t('last30Days')}</SelectItem>
                <SelectItem value="quarter">{t('last3Months')}</SelectItem>
                <SelectItem value="year">{t('last12Months')}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleExport}
              disabled={!reportData}
              variant="outline"
              className="border-gold/30 text-gold hover:bg-gold/10"
            >
              <Download className="mr-2 h-4 w-4" />
              {t('exportReportCSV')}
            </Button>
            <Button
              onClick={loadReport}
              disabled={loading}
              variant="outline"
              className="border-gold/30 text-gold hover:bg-gold/10"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              {t('refresh')}
            </Button>
          </div>
        </div>

        {reportData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gold">{t('totalUsers')}</CardTitle>
                <Users className="h-4 w-4 text-gold/60" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gold">{reportData.totalUsers}</div>
                <p className="text-xs text-gold/60 mt-1">
                  {reportData.newUsers} {t('newUsersThisPeriod')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gold">{t('activeUsers')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-gold/60" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gold">{reportData.activeUsers}</div>
                <p className="text-xs text-gold/60 mt-1">
                  {((reportData.activeUsers / reportData.totalUsers) * 100).toFixed(1)} {t('percentageOfTotal')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gold">{t('connections')}</CardTitle>
                <Network className="h-4 w-4 text-gold/60" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gold">{reportData.totalConnections}</div>
                <p className="text-xs text-gold/60 mt-1">
                  {reportData.newConnections} {t('newConnectionsThisPeriod')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gold">{t('messages')}</CardTitle>
                <MessageSquare className="h-4 w-4 text-gold/60" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gold">{reportData.totalMessages}</div>
                <p className="text-xs text-gold/60 mt-1">
                  {t('totalMessages')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gold">{t('content')}</CardTitle>
                <FileText className="h-4 w-4 text-gold/60" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gold">{reportData.totalContent}</div>
                <p className="text-xs text-gold/60 mt-1">
                  {t('totalContent')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gold">{t('logins')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-gold/60" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gold">{reportData.loginCount}</div>
                <p className="text-xs text-gold/60 mt-1">
                  {t('loginsThisPeriod')}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {loading && (
          <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-gold/60">{t('loadingReport')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReports;

