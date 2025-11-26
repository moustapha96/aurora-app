import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Users, 
  Activity, 
  TrendingUp,
  AlertCircle,
  Clock,
  Mail,
  MessageSquare,
  FileText,
  BarChart3,
  Download,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdmin } from "@/hooks/useAdmin";
import { useLanguage } from "@/contexts/LanguageContext";
import AdminLayout from "@/components/AdminLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Stats {
  totalUsers: number;
  totalAdmins: number;
  totalMembers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalActivities: number;
  activitiesToday: number;
  totalMessages: number;
  totalConversations: number;
  verifiedEmails: number;
  unverifiedEmails: number;
}

interface RecentActivity {
  id: string;
  user_id: string;
  activity_type: string;
  activity_description: string | null;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email?: string;
  } | null;
}

interface RecentUser {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at: string | null;
  profiles: {
    first_name: string;
    last_name: string;
    username: string | null;
  } | null;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadRecentActivities(),
        loadRecentUsers()
      ]);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get total users count
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get admins count
      const { count: totalAdmins } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      // Get members count
      const { count: totalMembers } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'member');

      // Get new users (today, this week, this month)
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      const monthAgo = new Date(now.setDate(now.getDate() - 30));

      const { count: newUsersToday } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      const { count: newUsersThisWeek } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      const { count: newUsersThisMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthAgo.toISOString());

      // Get activities count
      let totalActivities = 0;
      let activitiesToday = 0;
      try {
        const { count: totalAct } = await supabase
          .from('user_activities')
          .select('*', { count: 'exact', head: true });
        totalActivities = totalAct || 0;

        const { count: actToday } = await supabase
          .from('user_activities')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString());
        activitiesToday = actToday || 0;
      } catch (e) {
        // Table might not exist
      }

      // Get messages and conversations count
      let totalMessages = 0;
      let totalConversations = 0;
      try {
        const { count: messages } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true });
        totalMessages = messages || 0;

        const { count: convs } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true });
        totalConversations = convs || 0;
      } catch (e) {
        // Tables might not exist
      }

      // Get verified/unverified emails
      // Try to get auth info via RPC, fallback to profiles count
      let verifiedEmails = 0;
      let unverifiedEmails = 0;
      try {
        const { data: authUsers } = await supabase.rpc('get_all_users_auth_info' as any);
        if (authUsers && Array.isArray(authUsers)) {
          verifiedEmails = authUsers.filter((u: any) => u.email_confirmed_at !== null).length;
          unverifiedEmails = authUsers.length - verifiedEmails;
        } else {
          // Fallback: use profiles count (less accurate)
          verifiedEmails = totalUsers || 0;
          unverifiedEmails = 0;
        }
      } catch (e) {
        // Fallback: use profiles count
        verifiedEmails = totalUsers || 0;
        unverifiedEmails = 0;
      }

      setStats({
        totalUsers: totalUsers || 0,
        totalAdmins: totalAdmins || 0,
        totalMembers: totalMembers || 0,
        newUsersToday: newUsersToday || 0,
        newUsersThisWeek: newUsersThisWeek || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        totalActivities: totalActivities,
        activitiesToday: activitiesToday,
        totalMessages: totalMessages,
        totalConversations: totalConversations,
        verifiedEmails: verifiedEmails,
        unverifiedEmails: unverifiedEmails,
      });
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist
          setRecentActivities([]);
          return;
        }
        throw error;
      }

      setRecentActivities(data || []);
    } catch (error: any) {
      console.error('Error loading recent activities:', error);
      setRecentActivities([]);
    }
  };

  const loadRecentUsers = async () => {
    try {
      // Get users via RPC function or use profiles
      let users: any[] = [];
      try {
        const { data: authUsers } = await supabase.rpc('get_all_users_auth_info' as any);
        if (authUsers && Array.isArray(authUsers)) {
          users = authUsers;
        }
      } catch (e) {
        console.warn('Could not fetch auth users, using profiles only');
      }
      
      if (error) throw error;

      // Get profiles for these users
      const userIds = users?.map(u => u.id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, username')
        .in('id', userIds);

      const usersWithProfiles = users?.slice(0, 20).map(user => ({
        id: user.id,
        email: user.email || '',
        created_at: user.created_at,
        email_confirmed_at: user.email_confirmed_at,
        profiles: profiles?.find(p => p.id === user.id) || null
      })) || [];

      setRecentUsers(usersWithProfiles);
    } catch (error: any) {
      console.error('Error loading recent users:', error);
      setRecentUsers([]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(language === 'ar' ? 'ar-SA' : language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : language === 'ru' ? 'ru-RU' : language, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gold">{t('loading')}</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif text-gold mb-2">{t('dashboardAdministrator')}</h1>
            <p className="text-gold/60">{t('adminDashboardDescription') || 'Vue d\'ensemble de l\'administration'}</p>
          </div>
          <Button
            onClick={loadDashboardData}
            variant="outline"
            className="border-gold/30 text-gold hover:bg-gold/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('refresh')}
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-black/40 border-gold/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gold/60">{t('totalUsers')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gold">{stats.totalUsers}</div>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline" className="bg-gold/10 text-gold border-gold/30">
                    {stats.totalAdmins} Admin{stats.totalAdmins > 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-500/30">
                    {stats.totalMembers} Membre{stats.totalMembers > 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-gold/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gold/60">{t('newUsers')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gold">{stats.newUsersThisMonth}</div>
                <div className="text-xs text-gold/60 mt-2">
                  {stats.newUsersThisWeek} {t('thisWeek')} • {stats.newUsersToday} {t('today')}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-gold/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gold/60">{t('activities')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gold">{stats.totalActivities}</div>
                <div className="text-xs text-gold/60 mt-2">
                  {stats.activitiesToday} {t('today')}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-gold/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gold/60">{t('verifiedEmails')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gold">{stats.verifiedEmails}</div>
                <div className="text-xs text-gold/60 mt-2">
                  {stats.unverifiedEmails} {t('unverified')}{stats.unverifiedEmails > 1 ? 's' : ''}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-black/40 border border-gold/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gold/20">
              <BarChart3 className="w-4 h-4 mr-2" />
              {t('overview')}
            </TabsTrigger>
            <TabsTrigger value="activities" className="data-[state=active]:bg-gold/20">
              <Activity className="w-4 h-4 mr-2" />
              {t('activitiesTab')}
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-gold/20">
              <Users className="w-4 h-4 mr-2" />
              {t('usersTab')}
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-gold/20">
              <FileText className="w-4 h-4 mr-2" />
              {t('logsTab')}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-black/40 border-gold/20">
                <CardHeader>
                  <CardTitle className="text-gold">{t('generalStats')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gold/60">{t('messages')}</span>
                        <span className="text-gold font-bold">{stats.totalMessages}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gold/60">{t('conversations')}</span>
                        <span className="text-gold font-bold">{stats.totalConversations}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gold/60">{t('totalActivities')}</span>
                        <span className="text-gold font-bold">{stats.totalActivities}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-gold/20">
                <CardHeader>
                  <CardTitle className="text-gold">{t('quickActions')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={() => navigate("/admin/members")}
                    variant="outline"
                    className="w-full text-gold border-gold/30 hover:bg-gold/10 justify-start"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {t('manageMembers')}
                  </Button>
                  <Button
                    onClick={() => navigate("/admin/roles")}
                    variant="outline"
                    className="w-full text-gold border-gold/30 hover:bg-gold/10 justify-start"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    {t('manageRoles')}
                  </Button>
                  <Button
                    onClick={() => navigate("/activity-history")}
                    variant="outline"
                    className="w-full text-gold border-gold/30 hover:bg-gold/10 justify-start"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    {t('viewAllLogs')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="mt-6">
            <Card className="bg-black/40 border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">{t('recentActivities')}</CardTitle>
                <CardDescription className="text-gold/60">
                  {t('lastUserActivities')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8 text-gold/60">
                    {t('noActivitiesRecorded')}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gold/20">
                        <TableHead className="text-gold">{t('user')}</TableHead>
                        <TableHead className="text-gold">{t('type')}</TableHead>
                        <TableHead className="text-gold">{t('description')}</TableHead>
                        <TableHead className="text-gold">{t('date')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentActivities.map((activity) => (
                        <TableRow key={activity.id} className="border-gold/10">
                          <TableCell className="text-gold/80">
                            {activity.profiles 
                              ? `${activity.profiles.first_name} ${activity.profiles.last_name}`
                              : t('unknownUser')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-gold/10 text-gold border-gold/30">
                              {activity.activity_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gold/60">
                            {activity.activity_description || '-'}
                          </TableCell>
                          <TableCell className="text-gold/60 text-sm">
                            {formatDate(activity.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <Card className="bg-black/40 border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">{t('recentUsers')}</CardTitle>
                <CardDescription className="text-gold/60">
                  {t('lastRegisteredUsers')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentUsers.length === 0 ? (
                  <div className="text-center py-8 text-gold/60">
                    {t('noUsers')}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gold/20">
                        <TableHead className="text-gold">{t('name')}</TableHead>
                        <TableHead className="text-gold">{t('email')}</TableHead>
                        <TableHead className="text-gold">{t('status')}</TableHead>
                        <TableHead className="text-gold">{t('registrationDate')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentUsers.map((user) => (
                        <TableRow key={user.id} className="border-gold/10">
                          <TableCell className="text-gold/80">
                            {user.profiles
                              ? `${user.profiles.first_name} ${user.profiles.last_name}`
                              : t('notDefined')}
                          </TableCell>
                          <TableCell className="text-gold/60">{user.email}</TableCell>
                          <TableCell>
                            {user.email_confirmed_at ? (
                              <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-500/30">
                                {t('verified')}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-900/20 text-yellow-400 border-yellow-500/30">
                                {t('unverified')}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-gold/60 text-sm">
                            {formatDate(user.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="mt-6">
            <Card className="bg-black/40 border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">{t('systemLogs')}</CardTitle>
                <CardDescription className="text-gold/60">
                  {t('systemLogsInfo')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-black/20 border border-gold/10 rounded-lg">
                    <h4 className="text-gold font-medium mb-2">{t('information')}</h4>
                    <p className="text-gold/60 text-sm">
                      {t('detailedLogsAvailable')}
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate("/activity-history")}
                    variant="outline"
                    className="text-gold border-gold/30 hover:bg-gold/10"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {t('viewAllLogs')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

