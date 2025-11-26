import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  FileText,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  Edit,
  Image as ImageIcon,
  Network,
  Briefcase,
  Heart
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { useLanguage } from "@/contexts/LanguageContext";

interface ContentItem {
  id: string;
  user_id: string;
  user_name?: string;
  type: 'network' | 'business' | 'family';
  title?: string;
  content?: string;
  created_at: string;
  updated_at: string;
}

const AdminContent = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [networkContent, setNetworkContent] = useState<ContentItem[]>([]);
  const [businessContent, setBusinessContent] = useState<ContentItem[]>([]);
  const [familyContent, setFamilyContent] = useState<ContentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadNetworkContent(),
        loadBusinessContent(),
        loadFamilyContent()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const loadNetworkContent = async () => {
    try {
      const { data, error } = await supabase
        .from('network_content')
        .select(`
          *,
          user:profiles!network_content_user_id_fkey(first_name, last_name)
        `)
        .order('updated_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formatted = (data || []).map((item: any) => ({
        ...item,
        type: 'network' as const,
        user_name: item.user ? `${item.user.first_name} ${item.user.last_name}` : 'Unknown',
      }));

      setNetworkContent(formatted);
    } catch (error) {
      console.error('Error loading network content:', error);
    }
  };

  const loadBusinessContent = async () => {
    try {
      const { data, error } = await supabase
        .from('business_content')
        .select(`
          *,
          user:profiles!business_content_user_id_fkey(first_name, last_name)
        `)
        .order('updated_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formatted = (data || []).map((item: any) => ({
        ...item,
        type: 'business' as const,
        title: item.company_name || 'Business Content',
        user_name: item.user ? `${item.user.first_name} ${item.user.last_name}` : 'Unknown',
      }));

      setBusinessContent(formatted);
    } catch (error) {
      console.error('Error loading business content:', error);
    }
  };

  const loadFamilyContent = async () => {
    try {
      const { data, error } = await supabase
        .from('family_content')
        .select(`
          *,
          user:profiles!family_content_user_id_fkey(first_name, last_name)
        `)
        .order('updated_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formatted = (data || []).map((item: any) => ({
        ...item,
        type: 'family' as const,
        title: 'Family Content',
        user_name: item.user ? `${item.user.first_name} ${item.user.last_name}` : 'Unknown',
      }));

      setFamilyContent(formatted);
    } catch (error) {
      console.error('Error loading family content:', error);
    }
  };

  const handleDeleteContent = async (type: string, id: string) => {
    if (!confirm(t('deleteContentConfirm'))) return;

    try {
      let tableName = '';
      switch (type) {
        case 'network':
          tableName = 'network_content';
          break;
        case 'business':
          tableName = 'business_content';
          break;
        case 'family':
          tableName = 'family_content';
          break;
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success(t('contentDeleted'));
      loadData();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error(t('error'));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'network':
        return <Network className="h-4 w-4" />;
      case 'business':
        return <Briefcase className="h-4 w-4" />;
      case 'family':
        return <Heart className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'network':
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Network</Badge>;
      case 'business':
        return <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">Business</Badge>;
      case 'family':
        return <Badge className="bg-pink-500/20 text-pink-500 border-pink-500/30">Family</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const renderContentTable = (content: ContentItem[], type: string) => {
    const filtered = content.filter(item =>
      item.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-gold/20">
              <TableHead className="text-gold">{t('type')}</TableHead>
              <TableHead className="text-gold">{t('contentUser')}</TableHead>
              <TableHead className="text-gold">{t('contentTitle')}</TableHead>
              <TableHead className="text-gold">{t('content')}</TableHead>
              <TableHead className="text-gold">{t('updated')}</TableHead>
              <TableHead className="text-gold">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id} className="border-gold/10">
                <TableCell>{getTypeBadge(item.type)}</TableCell>
                <TableCell className="text-gold/90">{item.user_name}</TableCell>
                <TableCell className="text-gold/90">{item.title || t('notAvailable')}</TableCell>
                <TableCell className="text-gold/60 max-w-xs truncate">
                  {item.content?.substring(0, 50) || t('notAvailable')}...
                </TableCell>
                <TableCell className="text-gold/60">
                  {new Date(item.updated_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : language === 'ru' ? 'ru-RU' : language)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/${item.type}/${item.user_id}`)}
                      className="text-gold hover:bg-gold/10"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteContent(item.type, item.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif text-gold mb-2">{t('adminContent')}</h1>
            <p className="text-gold/60">{t('adminContentDescription')}</p>
          </div>
          <Button
            onClick={loadData}
            disabled={loading}
            variant="outline"
            className="border-gold/30 text-gold hover:bg-gold/10"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="bg-[hsl(var(--navy-blue-light))] border border-gold/20">
            <TabsTrigger value="all" className="text-gold data-[state=active]:bg-gold/20">
              <FileText className="mr-2 h-4 w-4" />
              {t('allContent')} ({networkContent.length + businessContent.length + familyContent.length})
            </TabsTrigger>
            <TabsTrigger value="network" className="text-gold data-[state=active]:bg-gold/20">
              <Network className="mr-2 h-4 w-4" />
              {t('networkContent')} ({networkContent.length})
            </TabsTrigger>
            <TabsTrigger value="business" className="text-gold data-[state=active]:bg-gold/20">
              <Briefcase className="mr-2 h-4 w-4" />
              {t('businessContent')} ({businessContent.length})
            </TabsTrigger>
            <TabsTrigger value="family" className="text-gold data-[state=active]:bg-gold/20">
              <Heart className="mr-2 h-4 w-4" />
              {t('familyContent')} ({familyContent.length})
            </TabsTrigger>
          </TabsList>

          <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-gold">{t('adminContent')}</CardTitle>
                    <CardDescription className="text-gold/60">
                      {t('adminContentDescription')}
                    </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gold/60" />
                  <Input
                    placeholder={t('search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-black/50 border-gold/30 text-gold w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TabsContent value="all">
                {renderContentTable([...networkContent, ...businessContent, ...familyContent], 'all')}
              </TabsContent>
              <TabsContent value="network">
                {renderContentTable(networkContent, 'network')}
              </TabsContent>
              <TabsContent value="business">
                {renderContentTable(businessContent, 'business')}
              </TabsContent>
              <TabsContent value="family">
                {renderContentTable(familyContent, 'family')}
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminContent;

