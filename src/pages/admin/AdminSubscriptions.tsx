import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Settings, Users, BarChart3 } from "lucide-react";
import { SubscriptionTiersTab } from "@/components/admin/subscriptions/SubscriptionTiersTab";
import { SubscriptionMembersTab } from "@/components/admin/subscriptions/SubscriptionMembersTab";
import { SubscriptionStatsTab } from "@/components/admin/subscriptions/SubscriptionStatsTab";

export interface SubscriptionTier {
  id: string;
  tier_key: string;
  name_fr: string;
  name_en: string;
  name_es: string;
  name_de: string;
  name_it: string;
  name_pt: string;
  name_ar: string;
  name_zh: string;
  name_ja: string;
  name_ru: string;
  price: number;
  currency: string;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  icon_type: string;
  color_class: string;
  bg_color_class: string;
  border_color_class: string;
  display_order: number;
  is_active: boolean;
}

export interface MemberSubscription {
  id: string;
  status: string;
  customer_id: string;
  customer_email: string;
  customer_name: string | null;
  profile_id: string | null;
  profile_first_name: string | null;
  profile_last_name: string | null;
  profile_avatar_url: string | null;
  product_id: string;
  product_name: string;
  price_id: string;
  amount: number;
  currency: string;
  interval: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created: string | null;
}

export interface SubscriptionStats {
  total: number;
  active: number;
  trialing: number;
  pastDue: number;
  canceled: number;
  totalRevenue: number;
}

const AdminSubscriptions = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [memberSubscriptions, setMemberSubscriptions] = useState<MemberSubscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [activeTab, setActiveTab] = useState("tiers");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load tiers
      const { data: tiersData, error: tiersError } = await supabase
        .from('subscription_tiers')
        .select('*')
        .order('display_order');

      if (tiersError) throw tiersError;
      setTiers(tiersData || []);

      // Load member subscriptions from Stripe via edge function
      const { data: subsData, error: subsError } = await supabase.functions.invoke('admin-list-subscriptions');
      
      if (subsError) {
        console.error("Error loading subscriptions:", subsError);
        toast.error(t('adminSubscriptionLoadError'));
      } else {
        setMemberSubscriptions(subsData?.subscriptions || []);
        setStats(subsData?.stats || null);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error(t('errorLoadingData'));
    } finally {
      setLoading(false);
    }
  };

  const refreshTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setTiers(data || []);
    } catch (error) {
      console.error("Error refreshing tiers:", error);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-serif text-gold">{t('adminSubscriptions')}</h1>
              <p className="text-muted-foreground mt-1">{t('adminSubscriptionsDescription')}</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                  <TabsTrigger value="tiers" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('adminSubscriptionsTabTiers')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="members" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('adminSubscriptionsTabMembers')}</span>
                    {stats && stats.active > 0 && (
                      <span className="ml-1 bg-gold/20 text-gold px-1.5 py-0.5 rounded text-xs">
                        {stats.active}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('adminSubscriptionsTabStats')}</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="tiers">
                  <SubscriptionTiersTab tiers={tiers} onRefresh={refreshTiers} />
                </TabsContent>

                <TabsContent value="members">
                  <SubscriptionMembersTab subscriptions={memberSubscriptions} onRefresh={loadData} />
                </TabsContent>

                <TabsContent value="stats">
                  <SubscriptionStatsTab stats={stats} subscriptions={memberSubscriptions} />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminSubscriptions;
