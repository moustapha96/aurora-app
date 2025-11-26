import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  History, 
  LogIn, 
  LogOut, 
  User, 
  Lock, 
  Mail, 
  MessageSquare,
  FileText,
  Settings,
  Download,
  Calendar,
  Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";

interface Activity {
  id: string;
  activity_type: string;
  activity_description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: any;
  created_at: string;
}

const ActivityHistory = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30");

  useEffect(() => {
    loadActivities();
  }, [filterType, dateRange]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error(t('error'));
        navigate("/login");
        return;
      }

      // Calculate date filter
      const dateFilter = new Date();
      if (dateRange === "7") {
        dateFilter.setDate(dateFilter.getDate() - 7);
      } else if (dateRange === "30") {
        dateFilter.setDate(dateFilter.getDate() - 30);
      } else if (dateRange === "90") {
        dateFilter.setDate(dateFilter.getDate() - 90);
      } else {
        dateFilter.setFullYear(2000); // All time
      }

      let query = supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (filterType !== "all") {
        query = query.eq('activity_type', filterType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading activities:', error);
        // If table doesn't exist, show empty state
        if (error.code === '42P01') {
          setActivities([]);
          return;
        }
        throw error;
      }

      setActivities(data || []);
    } catch (error: any) {
      console.error('Error loading activities:', error);
      toast.error(t('error'));
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <LogIn className="w-4 h-4" />;
      case 'logout':
        return <LogOut className="w-4 h-4" />;
      case 'profile_update':
        return <User className="w-4 h-4" />;
      case 'password_change':
        return <Lock className="w-4 h-4" />;
      case 'email_verification':
        return <Mail className="w-4 h-4" />;
      case 'message_sent':
        return <MessageSquare className="w-4 h-4" />;
      case 'content_created':
      case 'content_updated':
      case 'content_deleted':
        return <FileText className="w-4 h-4" />;
      case 'settings_updated':
        return <Settings className="w-4 h-4" />;
      default:
        return <History className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'login':
        return 'bg-green-900/20 text-green-400 border-green-500/30';
      case 'logout':
        return 'bg-gray-900/20 text-gray-400 border-gray-500/30';
      case 'profile_update':
        return 'bg-blue-900/20 text-blue-400 border-blue-500/30';
      case 'password_change':
        return 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30';
      case 'email_verification':
        return 'bg-purple-900/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gold/10 text-gold border-gold/30';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(language === 'ar' ? 'ar-SA' : language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : language === 'ru' ? 'ru-RU' : language, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExport = async () => {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        activities: activities.map(activity => ({
          type: activity.activity_type,
          description: activity.activity_description,
          date: activity.created_at,
          ip: activity.ip_address,
          metadata: activity.metadata
        }))
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aurora-activity-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(t('success'));
    } catch (error: any) {
      console.error('Error exporting activities:', error);
      toast.error(t('error'));
    }
  };

  const activityTypes = [
    { value: "all", label: t('allActivities') },
    { value: "login", label: t('login') },
    { value: "logout", label: t('logout') },
    { value: "profile_update", label: t('profileUpdate') },
    { value: "password_change", label: t('passwordChange') },
    { value: "email_verification", label: t('emailVerification') },
    { value: "message_sent", label: t('message') },
    { value: "content_created", label: t('message') },
    { value: "settings_updated", label: t('settings') },
  ];

  return (
    <div className="min-h-screen bg-black text-gold">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-gold hover:bg-gold/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <History className="w-8 h-8 text-gold" />
              <h1 className="text-3xl font-serif text-gold">{t('activityHistory')}</h1>
            </div>
          </div>
          <Button
            onClick={handleExport}
            variant="outline"
            className="text-gold border-gold/30 hover:bg-gold/10"
          >
            <Download className="w-4 h-4 mr-2" />
            {t('exportHistory')}
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-black/40 border-gold/20 mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-gold/80 text-sm flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  {t('filterByType')}
                </label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="bg-black border-gold/30 text-gold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-gold/30">
                    {activityTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-gold">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-gold/80 text-sm flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {t('filterByDate')}
                </label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="bg-black border-gold/30 text-gold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-gold/30">
                    <SelectItem value="7" className="text-gold">{t('last7Days')}</SelectItem>
                    <SelectItem value="30" className="text-gold">{t('last30Days')}</SelectItem>
                    <SelectItem value="90" className="text-gold">{t('last90Days')}</SelectItem>
                    <SelectItem value="all" className="text-gold">{t('allTime')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activities List */}
        <Card className="bg-black/40 border-gold/20">
          <CardHeader>
            <CardTitle className="text-gold">
              {activities.length} {t('activityHistory')}
            </CardTitle>
            <CardDescription className="text-gold/60">
              {t('activityHistory')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="text-gold/60">{t('loading')}</div>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-gold/40 mx-auto mb-4" />
                <p className="text-gold/60 mb-2">{t('noActivities')}</p>
                <p className="text-gold/40 text-sm">
                  {filterType !== "all" || dateRange !== "all"
                    ? t('error')
                    : t('noActivities')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-4 bg-black/20 border border-gold/10 rounded-lg hover:border-gold/20 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`p-2 rounded-lg border ${getActivityColor(activity.activity_type)}`}>
                          {getActivityIcon(activity.activity_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="outline" className={getActivityColor(activity.activity_type)}>
                              {activity.activity_type}
                            </Badge>
                            <span className="text-gold/60 text-sm">
                              {formatDate(activity.created_at)}
                            </span>
                          </div>
                          <p className="text-gold/80 text-sm">
                            {activity.activity_description || activity.activity_type}
                          </p>
                          {activity.ip_address && (
                            <p className="text-gold/40 text-xs mt-1">
                              IP: {activity.ip_address}
                            </p>
                          )}
                          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                            <details className="mt-2">
                              <summary className="text-gold/60 text-xs cursor-pointer hover:text-gold">
                                {t('details')}
                              </summary>
                              <pre className="text-gold/40 text-xs mt-2 p-2 bg-black/20 rounded overflow-auto">
                                {JSON.stringify(activity.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActivityHistory;

