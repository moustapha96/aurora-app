import { useState, useEffect, useMemo } from 'react';
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
import { AdminPagination } from '@/components/ui/admin-pagination';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
      toast.error(t('adminErrorLoadingContent'));
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
      case 'artwork': return <Badge variant="secondary">{t('art')}</Badge>;
      case 'sport': return <Badge className="bg-green-500/20 text-green-400">{t('sports')}</Badge>;
      case 'business': return <Badge className="bg-blue-500/20 text-blue-400">{t('business')}</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const filteredItems = useMemo(() => contentItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.user_id.includes(searchTerm);
    const matchesTab = activeTab === 'all' || item.type === activeTab;
    return matchesSearch && matchesTab;
  }), [contentItems, searchTerm, activeTab]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const startIndex = filteredItems.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endIndex = Math.min(currentPage * pageSize, filteredItems.length);
  const paginatedItems = useMemo(() => 
    filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredItems, currentPage, pageSize]
  );

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, activeTab]);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('adminContentManagement')}</h1>
          <p className="text-muted-foreground">{t('adminMonitorModerateContent')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats?.totalProfiles || 0}</p>
              <p className="text-xs text-muted-foreground">{t('profiles')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Image className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{stats?.profilesWithAvatar || 0}</p>
              <p className="text-xs text-muted-foreground">{t('adminWithAvatar')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Briefcase className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{stats?.businessContent || 0}</p>
              <p className="text-xs text-muted-foreground">{t('business')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{stats?.familyContent || 0}</p>
              <p className="text-xs text-muted-foreground">{t('family')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Heart className="h-6 w-6 mx-auto mb-2 text-pink-500" />
              <p className="text-2xl font-bold">{stats?.personalContent || 0}</p>
              <p className="text-xs text-muted-foreground">{t('personal')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Image className="h-6 w-6 mx-auto mb-2 text-amber-500" />
              <p className="text-2xl font-bold">{stats?.artworks || 0}</p>
              <p className="text-xs text-muted-foreground">{t('artworks')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Heart className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold">{stats?.sportsHobbies || 0}</p>
              <p className="text-xs text-muted-foreground">{t('sportsHobbies')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Content Browser */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('adminRecentContent')}</CardTitle>
                <CardDescription>{t('adminBrowseModerateContent')}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchContent} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {t('refresh')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('adminSearchByTitleOrUserId')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">{t('all')} ({contentItems.length})</TabsTrigger>
                  <TabsTrigger value="artwork">{t('art')} ({contentItems.filter(i => i.type === 'artwork').length})</TabsTrigger>
                  <TabsTrigger value="sport">{t('sports')} ({contentItems.filter(i => i.type === 'sport').length})</TabsTrigger>
                  <TabsTrigger value="business">{t('business')} ({contentItems.filter(i => i.type === 'business').length})</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                      {t('loading')}
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      {t('adminNoContentFound')}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {paginatedItems.map((item) => (
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
                                  <span>{t('user')}: {item.user_name}...</span>
                                  <span>•</span>
                                  <span>{new Date(item.created_at).toLocaleDateString('fr-FR')}</span>
                                  {item.has_image && (
                                    <>
                                      <span>•</span>
                                      <Badge variant="outline" className="text-xs">
                                        <Image className="h-3 w-3 mr-1" />
                                        {t('image')}
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
                      {filteredItems.length > 0 && (
                        <AdminPagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          totalItems={filteredItems.length}
                          pageSize={pageSize}
                          onPageChange={setCurrentPage}
                          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                          startIndex={startIndex}
                          endIndex={endIndex}
                        />
                      )}
                    </>
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
              {t('adminModerationAlerts')}
            </CardTitle>
            <CardDescription>{t('adminReportedContentNeedsReview')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              {t('adminNoPendingAlerts')}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
