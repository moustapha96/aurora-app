import { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Image, 
  Users, 
  Briefcase, 
  Heart,
  Search,
  Eye,
  Trash2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ContentStats {
  totalProfiles: number;
  profilesWithAvatar: number;
  businessContent: number;
  familyContent: number;
  personalContent: number;
  artworks: number;
  sportsHobbies: number;
}

interface ContentItem {
  id: string;
  user_id: string;
  user_name: string;
  type: string;
  title: string;
  created_at: string;
  has_image: boolean;
}

export default function AdminContent() {
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchStats();
    fetchContent();
  }, []);

  const fetchStats = async () => {
    try {
      const [
        { count: totalProfiles },
        { count: profilesWithAvatar },
        { count: businessContent },
        { count: familyContent },
        { count: personalContent },
        { count: artworks },
        { count: sportsHobbies }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).not('avatar_url', 'is', null),
        supabase.from('business_content').select('*', { count: 'exact', head: true }),
        supabase.from('family_content').select('*', { count: 'exact', head: true }),
        supabase.from('personal_content').select('*', { count: 'exact', head: true }),
        supabase.from('artwork_collection').select('*', { count: 'exact', head: true }),
        supabase.from('sports_hobbies').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        totalProfiles: totalProfiles || 0,
        profilesWithAvatar: profilesWithAvatar || 0,
        businessContent: businessContent || 0,
        familyContent: familyContent || 0,
        personalContent: personalContent || 0,
        artworks: artworks || 0,
        sportsHobbies: sportsHobbies || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchContent = async () => {
    setLoading(true);
    try {
      const items: ContentItem[] = [];

      // Fetch artwork collection with user info
      const { data: artworks } = await supabase
        .from('artwork_collection')
        .select('id, user_id, title, created_at, image_url')
        .order('created_at', { ascending: false })
        .limit(50);

      if (artworks) {
        for (const art of artworks) {
          items.push({
            id: art.id,
            user_id: art.user_id,
            user_name: art.user_id.substring(0, 8),
            type: 'artwork',
            title: art.title,
            created_at: art.created_at,
            has_image: !!art.image_url
          });
        }
      }

      // Fetch sports/hobbies
      const { data: sports } = await supabase
        .from('sports_hobbies')
        .select('id, user_id, title, created_at, image_url')
        .order('created_at', { ascending: false })
        .limit(50);

      if (sports) {
        for (const sport of sports) {
          items.push({
            id: sport.id,
            user_id: sport.user_id,
            user_name: sport.user_id.substring(0, 8),
            type: 'sport',
            title: sport.title,
            created_at: sport.created_at,
            has_image: !!sport.image_url
          });
        }
      }

      // Fetch business timeline
      const { data: timeline } = await supabase
        .from('business_timeline')
        .select('id, user_id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (timeline) {
        for (const item of timeline) {
          items.push({
            id: item.id,
            user_id: item.user_id,
            user_name: item.user_id.substring(0, 8),
            type: 'business',
            title: item.title,
            created_at: item.created_at,
            has_image: false
          });
        }
      }

      // Sort by date
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setContentItems(items);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Erreur lors du chargement du contenu');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'artwork': return <Image className="h-4 w-4" />;
      case 'sport': return <Heart className="h-4 w-4" />;
      case 'business': return <Briefcase className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'artwork': return <Badge variant="secondary">Art</Badge>;
      case 'sport': return <Badge className="bg-green-500/20 text-green-400">Sport</Badge>;
      case 'business': return <Badge className="bg-blue-500/20 text-blue-400">Business</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const filteredItems = contentItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.user_id.includes(searchTerm);
    const matchesTab = activeTab === 'all' || item.type === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Gestion du Contenu</h1>
          <p className="text-muted-foreground">Surveillez et modérez le contenu des membres</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats?.totalProfiles || 0}</p>
              <p className="text-xs text-muted-foreground">Profils</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Image className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{stats?.profilesWithAvatar || 0}</p>
              <p className="text-xs text-muted-foreground">Avec avatar</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Briefcase className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{stats?.businessContent || 0}</p>
              <p className="text-xs text-muted-foreground">Business</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{stats?.familyContent || 0}</p>
              <p className="text-xs text-muted-foreground">Family</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Heart className="h-6 w-6 mx-auto mb-2 text-pink-500" />
              <p className="text-2xl font-bold">{stats?.personalContent || 0}</p>
              <p className="text-xs text-muted-foreground">Personal</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Image className="h-6 w-6 mx-auto mb-2 text-amber-500" />
              <p className="text-2xl font-bold">{stats?.artworks || 0}</p>
              <p className="text-xs text-muted-foreground">Œuvres d'art</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Heart className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold">{stats?.sportsHobbies || 0}</p>
              <p className="text-xs text-muted-foreground">Sports/Hobbies</p>
            </CardContent>
          </Card>
        </div>

        {/* Content Browser */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Contenus récents</CardTitle>
                <CardDescription>Parcourez et modérez les contenus des membres</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchContent} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par titre ou ID utilisateur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">Tout ({contentItems.length})</TabsTrigger>
                  <TabsTrigger value="artwork">Art ({contentItems.filter(i => i.type === 'artwork').length})</TabsTrigger>
                  <TabsTrigger value="sport">Sports ({contentItems.filter(i => i.type === 'sport').length})</TabsTrigger>
                  <TabsTrigger value="business">Business ({contentItems.filter(i => i.type === 'business').length})</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                      Chargement...
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      Aucun contenu trouvé
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredItems.map((item) => (
                        <div
                          key={`${item.type}-${item.id}`}
                          className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              {getTypeIcon(item.type)}
                            </div>
                            <div>
                              <p className="font-medium">{item.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>User: {item.user_name}...</span>
                                <span>•</span>
                                <span>{new Date(item.created_at).toLocaleDateString('fr-FR')}</span>
                                {item.has_image && (
                                  <>
                                    <span>•</span>
                                    <Badge variant="outline" className="text-xs">
                                      <Image className="h-3 w-3 mr-1" />
                                      Image
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getTypeBadge(item.type)}
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Moderation Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Alertes de modération
            </CardTitle>
            <CardDescription>Contenus signalés ou nécessitant une révision</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Aucune alerte en attente
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
