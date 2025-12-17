import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserPlus, Link2, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalMembers: number;
  newMembersThisMonth: number;
  totalConnections: number;
  activeToday: number;
  pendingRequests: number;
  adminCount: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    newMembersThisMonth: 0,
    totalConnections: 0,
    activeToday: 0,
    pendingRequests: 0,
    adminCount: 0,
  });
  const [recentMembers, setRecentMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get total members
      const { count: totalMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get new members this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count: newMembersThisMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      // Get total connections
      const { count: totalConnections } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true });

      // Get pending connection requests
      const { count: pendingRequests } = await supabase
        .from('connection_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get admin count
      const { count: adminCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      // Get recent members
      const { data: recent } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalMembers: totalMembers || 0,
        newMembersThisMonth: newMembersThisMonth || 0,
        totalConnections: Math.floor((totalConnections || 0) / 2), // Divide by 2 for bidirectional
        activeToday: 0, // Would need activity tracking
        pendingRequests: pendingRequests || 0,
        adminCount: adminCount || 0,
      });

      setRecentMembers(recent || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Membres',
      value: stats.totalMembers,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Nouveaux ce mois',
      value: stats.newMembersThisMonth,
      icon: UserPlus,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Connexions',
      value: stats.totalConnections,
      icon: Link2,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Demandes en attente',
      value: stats.pendingRequests,
      icon: AlertCircle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Administrateurs',
      value: stats.adminCount,
      icon: Activity,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
  ];

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard Administrateur</h1>
          <p className="text-muted-foreground">Vue d'ensemble de Aurora Society</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {isLoading ? '...' : stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Nouveaux Membres
              </CardTitle>
              <CardDescription>Les 5 derniers inscrits</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Chargement...</p>
              ) : recentMembers.length === 0 ? (
                <p className="text-muted-foreground">Aucun membre</p>
              ) : (
                <div className="space-y-4">
                  {recentMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => navigate(`/profile/${member.id}`)}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-medium text-primary">
                            {member.first_name?.[0]}{member.last_name?.[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(member.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Actions Rapides
              </CardTitle>
              <CardDescription>Accès direct aux fonctionnalités</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/admin/members')}
                  className="p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left"
                >
                  <Users className="h-5 w-5 text-primary mb-2" />
                  <p className="font-medium text-foreground">Gérer les membres</p>
                  <p className="text-xs text-muted-foreground">Voir tous les membres</p>
                </button>
                
                <button
                  onClick={() => navigate('/admin/roles')}
                  className="p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left"
                >
                  <Activity className="h-5 w-5 text-primary mb-2" />
                  <p className="font-medium text-foreground">Gérer les rôles</p>
                  <p className="text-xs text-muted-foreground">Attribuer des rôles</p>
                </button>
                
                <button
                  onClick={() => navigate('/admin/moderation')}
                  className="p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left"
                >
                  <AlertCircle className="h-5 w-5 text-orange-500 mb-2" />
                  <p className="font-medium text-foreground">Modération</p>
                  <p className="text-xs text-muted-foreground">Contenus à vérifier</p>
                </button>
                
                <button
                  onClick={() => navigate('/admin/analytics')}
                  className="p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left"
                >
                  <TrendingUp className="h-5 w-5 text-green-500 mb-2" />
                  <p className="font-medium text-foreground">Analytics</p>
                  <p className="text-xs text-muted-foreground">Statistiques détaillées</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
