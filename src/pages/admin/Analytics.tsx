import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  MessageSquare,
  Mail,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  UserPlus,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdmin } from "@/hooks/useAdmin";
import { useLanguage } from "@/contexts/LanguageContext";
import AdminLayout from "@/components/AdminLayout";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface AnalyticsData {
  usersOverTime: { date: string; count: number }[];
  activitiesOverTime: { date: string; count: number }[];
  activitiesByType: { type: string; count: number }[];
  messagesOverTime: { date: string; count: number }[];
  userEngagement: {
    activeUsers: number;
    newUsers: number;
    returningUsers: number;
    engagementRate: number;
  };
  topActivities: { type: string; count: number; percentage: number }[];
  timeDistribution: { hour: number; count: number }[];
}

const Analytics = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>("30");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      if (dateRange === "7") {
        startDate.setDate(now.getDate() - 7);
      } else if (dateRange === "30") {
        startDate.setDate(now.getDate() - 30);
      } else if (dateRange === "90") {
        startDate.setDate(now.getDate() - 90);
      } else {
        startDate.setFullYear(2000); // All time
      }

      // Load users over time
      const { data: profiles } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      // Group users by date
      const usersByDate = new Map<string, number>();
      profiles?.forEach(profile => {
        const date = new Date(profile.created_at).toISOString().split('T')[0];
        usersByDate.set(date, (usersByDate.get(date) || 0) + 1);
      });

      const usersOverTime = Array.from(usersByDate.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Load activities over time
      let activitiesOverTime: { date: string; count: number }[] = [];
      let activitiesByType: { type: string; count: number }[] = [];
      try {
        const { data: activities } = await supabase
          .from('user_activities')
          .select('created_at, activity_type')
          .gte('created_at', startDate.toISOString());

        // Group activities by date
        const activitiesByDate = new Map<string, number>();
        activities?.forEach(activity => {
          const date = new Date(activity.created_at).toISOString().split('T')[0];
          activitiesByDate.set(date, (activitiesByDate.get(date) || 0) + 1);
        });

        activitiesOverTime = Array.from(activitiesByDate.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));

        // Group activities by type
        const activitiesByTypeMap = new Map<string, number>();
        activities?.forEach(activity => {
          activitiesByTypeMap.set(
            activity.activity_type,
            (activitiesByTypeMap.get(activity.activity_type) || 0) + 1
          );
        });

        activitiesByType = Array.from(activitiesByTypeMap.entries())
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count);
      } catch (e) {
        // Table might not exist
      }

      // Load messages over time
      let messagesOverTime: { date: string; count: number }[] = [];
      try {
        const { data: messages } = await supabase
          .from('messages')
          .select('created_at')
          .gte('created_at', startDate.toISOString());

        const messagesByDate = new Map<string, number>();
        messages?.forEach(message => {
          const date = new Date(message.created_at).toISOString().split('T')[0];
          messagesByDate.set(date, (messagesByDate.get(date) || 0) + 1);
        });

        messagesOverTime = Array.from(messagesByDate.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));
      } catch (e) {
        // Table might not exist
      }

      // Calculate engagement metrics
      const totalUsers = profiles?.length || 0;
      let activeUsers = 0;
      let newUsers = 0;
      const last7Days = new Date();
      last7Days.setDate(now.getDate() - 7);

      try {
        const { data: recentActivities } = await supabase
          .from('user_activities')
          .select('user_id, created_at')
          .gte('created_at', last7Days.toISOString());

        const activeUserIds = new Set(recentActivities?.map(a => a.user_id) || []);
        activeUsers = activeUserIds.size;

        const newUserIds = profiles?.filter(p => 
          new Date(p.created_at) >= last7Days
        ).length || 0;
        newUsers = newUserIds;
      } catch (e) {
        // Table might not exist
      }

      const returningUsers = activeUsers - newUsers;
      const engagementRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

      // Top activities
      const topActivities = activitiesByType.slice(0, 5).map(activity => ({
        type: activity.type,
        count: activity.count,
        percentage: activitiesByType.reduce((sum, a) => sum + a.count, 0) > 0
          ? (activity.count / activitiesByType.reduce((sum, a) => sum + a.count, 0)) * 100
          : 0
      }));

      // Time distribution (activities by hour)
      let timeDistribution: { hour: number; count: number }[] = [];
      try {
        const { data: activities } = await supabase
          .from('user_activities')
          .select('created_at')
          .gte('created_at', startDate.toISOString());

        const activitiesByHour = new Map<number, number>();
        activities?.forEach(activity => {
          const hour = new Date(activity.created_at).getHours();
          activitiesByHour.set(hour, (activitiesByHour.get(hour) || 0) + 1);
        });

        timeDistribution = Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          count: activitiesByHour.get(i) || 0
        }));
      } catch (e) {
        // Table might not exist
      }

      setAnalyticsData({
        usersOverTime,
        activitiesOverTime,
        activitiesByType,
        messagesOverTime,
        userEngagement: {
          activeUsers,
          newUsers,
          returningUsers,
          engagementRate: Math.round(engagementRate * 100) / 100
        },
        topActivities,
        timeDistribution
      });
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      toast.error("Erreur lors du chargement des analytics");
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    users: {
      label: "Utilisateurs",
      color: "hsl(var(--chart-1))",
    },
    activities: {
      label: "Activités",
      color: "hsl(var(--chart-2))",
    },
    messages: {
      label: "Messages",
      color: "hsl(var(--chart-3))",
    },
  };

  const COLORS = ['#D4AF37', '#1a1a1a', '#4a4a4a', '#6a6a6a', '#8a8a8a'];

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
            <h1 className="text-3xl font-serif text-gold mb-2">{t('adminAnalytics')}</h1>
            <p className="text-gold/60">{t('adminAnalyticsDescription') || 'Statistiques et analyses de la plateforme'}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px] bg-black border-gold/30 text-gold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-gold/30">
                <SelectItem value="7" className="text-gold">7 derniers jours</SelectItem>
                <SelectItem value="30" className="text-gold">30 derniers jours</SelectItem>
                <SelectItem value="90" className="text-gold">90 derniers jours</SelectItem>
                <SelectItem value="all" className="text-gold">Tout l'historique</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={loadAnalytics}
              variant="outline"
              className="text-gold border-gold/30 hover:bg-gold/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('refresh')}
            </Button>
          </div>
        </div>

        {/* Engagement Metrics */}
        {analyticsData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gold/60">Utilisateurs Actifs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gold">{analyticsData.userEngagement.activeUsers}</div>
                <p className="text-gold/60 text-xs mt-2">7 derniers jours</p>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gold/60">Nouveaux Utilisateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gold">{analyticsData.userEngagement.newUsers}</div>
                <p className="text-gold/60 text-xs mt-2">7 derniers jours</p>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gold/60">Utilisateurs Récurrents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gold">{analyticsData.userEngagement.returningUsers}</div>
                <p className="text-gold/60 text-xs mt-2">7 derniers jours</p>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gold/60">Taux d'Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gold">{analyticsData.userEngagement.engagementRate}%</div>
                <p className="text-gold/60 text-xs mt-2">Utilisateurs actifs / Total</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-black/40 border border-gold/20">
            <TabsTrigger value="users" className="data-[state=active]:bg-gold/20">
              <Users className="w-4 h-4 mr-2" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="activities" className="data-[state=active]:bg-gold/20">
              <Activity className="w-4 h-4 mr-2" />
              Activités
            </TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-gold/20">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="engagement" className="data-[state=active]:bg-gold/20">
              <TrendingUp className="w-4 h-4 mr-2" />
              Engagement
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">Évolution des Utilisateurs</CardTitle>
                <CardDescription className="text-gold/60">
                  Nombre d'utilisateurs inscrits au fil du temps
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData && analyticsData.usersOverTime.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[400px]">
                    <AreaChart data={analyticsData.usersOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#D4AF37" opacity={0.1} />
                      <XAxis
                        dataKey="date"
                        stroke="#D4AF37"
                        tick={{ fill: '#D4AF37' }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                      />
                      <YAxis stroke="#D4AF37" tick={{ fill: '#D4AF37' }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#D4AF37"
                        fill="#D4AF37"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-gold/60">
                    Aucune donnée disponible
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="mt-6 space-y-6">
            <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">Évolution des Activités</CardTitle>
                <CardDescription className="text-gold/60">
                  Nombre d'activités au fil du temps
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData && analyticsData.activitiesOverTime.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[400px]">
                    <LineChart data={analyticsData.activitiesOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#D4AF37" opacity={0.1} />
                      <XAxis
                        dataKey="date"
                        stroke="#D4AF37"
                        tick={{ fill: '#D4AF37' }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                      />
                      <YAxis stroke="#D4AF37" tick={{ fill: '#D4AF37' }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#D4AF37"
                        strokeWidth={2}
                        dot={{ fill: '#D4AF37' }}
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-gold/60">
                    Aucune donnée disponible
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
                <CardHeader>
                  <CardTitle className="text-gold">Activités par Type</CardTitle>
                  <CardDescription className="text-gold/60">
                    Répartition des activités
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData && analyticsData.activitiesByType.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <PieChart>
                        <Pie
                          data={analyticsData.activitiesByType}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#D4AF37"
                          dataKey="count"
                        >
                          {analyticsData.activitiesByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gold/60">
                      Aucune donnée disponible
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
                <CardHeader>
                  <CardTitle className="text-gold">Top Activités</CardTitle>
                  <CardDescription className="text-gold/60">
                    Activités les plus fréquentes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData && analyticsData.topActivities.length > 0 ? (
                    <div className="space-y-4">
                      {analyticsData.topActivities.map((activity, index) => (
                        <div key={activity.type} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gold/80 text-sm">{activity.type}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-gold font-medium">{activity.count}</span>
                              <Badge variant="outline" className="bg-gold/10 text-gold border-gold/30">
                                {activity.percentage.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                          <div className="w-full bg-black/20 rounded-full h-2">
                            <div
                              className="bg-gold h-2 rounded-full transition-all"
                              style={{ width: `${activity.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gold/60">
                      Aucune donnée disponible
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">Distribution Temporelle</CardTitle>
                <CardDescription className="text-gold/60">
                  Activités par heure de la journée
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData && analyticsData.timeDistribution.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <BarChart data={analyticsData.timeDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#D4AF37" opacity={0.1} />
                      <XAxis
                        dataKey="hour"
                        stroke="#D4AF37"
                        tick={{ fill: '#D4AF37' }}
                        label={{ value: 'Heure', position: 'insideBottom', offset: -5, fill: '#D4AF37' }}
                      />
                      <YAxis stroke="#D4AF37" tick={{ fill: '#D4AF37' }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gold/60">
                    Aucune donnée disponible
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="mt-6">
            <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">Évolution des Messages</CardTitle>
                <CardDescription className="text-gold/60">
                  Nombre de messages envoyés au fil du temps
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData && analyticsData.messagesOverTime.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[400px]">
                    <AreaChart data={analyticsData.messagesOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#D4AF37" opacity={0.1} />
                      <XAxis
                        dataKey="date"
                        stroke="#D4AF37"
                        tick={{ fill: '#D4AF37' }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                      />
                      <YAxis stroke="#D4AF37" tick={{ fill: '#D4AF37' }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#D4AF37"
                        fill="#D4AF37"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-gold/60">
                    Aucune donnée disponible
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
                <CardHeader>
                  <CardTitle className="text-gold">Métriques d'Engagement</CardTitle>
                  <CardDescription className="text-gold/60">
                    Statistiques d'engagement des utilisateurs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gold/80">Utilisateurs Actifs</span>
                          <span className="text-gold font-bold">{analyticsData.userEngagement.activeUsers}</span>
                        </div>
                        <div className="w-full bg-black/20 rounded-full h-2">
                          <div
                            className="bg-gold h-2 rounded-full"
                            style={{ width: `${Math.min(analyticsData.userEngagement.engagementRate, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gold/80">Nouveaux Utilisateurs</span>
                        <span className="text-gold font-bold">{analyticsData.userEngagement.newUsers}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gold/80">Utilisateurs Récurrents</span>
                        <span className="text-gold font-bold">{analyticsData.userEngagement.returningUsers}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gold/80">Taux d'Engagement</span>
                        <span className="text-gold font-bold">{analyticsData.userEngagement.engagementRate}%</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
                <CardHeader>
                  <CardTitle className="text-gold">Résumé</CardTitle>
                  <CardDescription className="text-gold/60">
                    Vue d'ensemble des performances
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData && (
                    <div className="space-y-4">
                      <div className="p-4 bg-black/20 border border-gold/10 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <UserPlus className="w-4 h-4 text-gold" />
                          <span className="text-gold font-medium">Croissance</span>
                        </div>
                        <p className="text-gold/60 text-sm">
                          {analyticsData.usersOverTime.length > 0
                            ? `${analyticsData.usersOverTime.reduce((sum, d) => sum + d.count, 0)} nouveaux utilisateurs sur la période`
                            : 'Aucune donnée'}
                        </p>
                      </div>
                      <div className="p-4 bg-black/20 border border-gold/10 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Activity className="w-4 h-4 text-gold" />
                          <span className="text-gold font-medium">Activité</span>
                        </div>
                        <p className="text-gold/60 text-sm">
                          {analyticsData.activitiesOverTime.length > 0
                            ? `${analyticsData.activitiesOverTime.reduce((sum, d) => sum + d.count, 0)} activités enregistrées`
                            : 'Aucune donnée'}
                        </p>
                      </div>
                      <div className="p-4 bg-black/20 border border-gold/10 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-gold" />
                          <span className="text-gold font-medium">Messages</span>
                        </div>
                        <p className="text-gold/60 text-sm">
                          {analyticsData.messagesOverTime.length > 0
                            ? `${analyticsData.messagesOverTime.reduce((sum, d) => sum + d.count, 0)} messages envoyés`
                            : 'Aucune donnée'}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Analytics;

