import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, Link2, Briefcase, Globe, TrendingUp, Calendar } from 'lucide-react';

interface AnalyticsData {
  membersByMonth: { month: string; count: number }[];
  membersByCountry: { country: string; count: number }[];
  membersByIndustry: { industry: string; count: number }[];
  connectionStats: { total: number; avgPerMember: number };
}

const AdminAnalytics = () => {
  const [data, setData] = useState<AnalyticsData>({
    membersByMonth: [],
    membersByCountry: [],
    membersByIndustry: [],
    connectionStats: { total: 0, avgPerMember: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Get all profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, country, activity_domain, created_at');

      // Get all connections
      const { data: connections } = await supabase
        .from('friendships')
        .select('id');

      if (profiles) {
        // Members by month
        const monthCounts: Record<string, number> = {};
        profiles.forEach(p => {
          if (p.created_at) {
            const month = new Date(p.created_at).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
            monthCounts[month] = (monthCounts[month] || 0) + 1;
          }
        });
        const membersByMonth = Object.entries(monthCounts)
          .map(([month, count]) => ({ month, count }))
          .slice(-6);

        // Members by country
        const countryCounts: Record<string, number> = {};
        profiles.forEach(p => {
          const country = p.country || 'Non spécifié';
          countryCounts[country] = (countryCounts[country] || 0) + 1;
        });
        const membersByCountry = Object.entries(countryCounts)
          .map(([country, count]) => ({ country, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Members by industry
        const industryCounts: Record<string, number> = {};
        profiles.forEach(p => {
          const industry = p.activity_domain || 'Non spécifié';
          industryCounts[industry] = (industryCounts[industry] || 0) + 1;
        });
        const membersByIndustry = Object.entries(industryCounts)
          .map(([industry, count]) => ({ industry, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Connection stats
        const totalConnections = Math.floor((connections?.length || 0) / 2);
        const avgPerMember = profiles.length > 0 ? (totalConnections / profiles.length).toFixed(1) : '0';

        setData({
          membersByMonth,
          membersByCountry,
          membersByIndustry,
          connectionStats: {
            total: totalConnections,
            avgPerMember: parseFloat(avgPerMember),
          },
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Statistiques et métriques de la plateforme</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Link2 className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.connectionStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total connexions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.connectionStats.avgPerMember}</p>
                  <p className="text-xs text-muted-foreground">Connexions / membre</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <Globe className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.membersByCountry.length}</p>
                  <p className="text-xs text-muted-foreground">Pays représentés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <Briefcase className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.membersByIndustry.length}</p>
                  <p className="text-xs text-muted-foreground">Secteurs d'activité</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Members by Month */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Inscriptions par mois
              </CardTitle>
              <CardDescription>Évolution des nouvelles inscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              {data.membersByMonth.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucune donnée</p>
              ) : (
                <div className="space-y-3">
                  {data.membersByMonth.map((item) => (
                    <div key={item.month} className="flex items-center gap-4">
                      <span className="w-20 text-sm text-muted-foreground">{item.month}</span>
                      <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-lg transition-all"
                          style={{
                            width: `${Math.max(10, (item.count / Math.max(...data.membersByMonth.map(m => m.count))) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="w-8 text-sm font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Members by Country */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Membres par pays
              </CardTitle>
              <CardDescription>Top 5 des pays</CardDescription>
            </CardHeader>
            <CardContent>
              {data.membersByCountry.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucune donnée</p>
              ) : (
                <div className="space-y-3">
                  {data.membersByCountry.map((item, index) => (
                    <div key={item.country} className="flex items-center gap-4">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                        {index + 1}
                      </span>
                      <span className="flex-1 text-sm text-foreground">{item.country}</span>
                      <span className="text-sm font-medium text-muted-foreground">{item.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Members by Industry */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Membres par secteur d'activité
              </CardTitle>
              <CardDescription>Top 5 des secteurs</CardDescription>
            </CardHeader>
            <CardContent>
              {data.membersByIndustry.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucune donnée</p>
              ) : (
                <div className="grid md:grid-cols-5 gap-4">
                  {data.membersByIndustry.map((item) => (
                    <div key={item.industry} className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold text-foreground">{item.count}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.industry}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
