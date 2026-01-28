import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { PageHeaderBackButton } from "@/components/BackButton";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Crown, Star, Sparkles, Calendar, RefreshCw, ExternalLink, CheckCircle, XCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";

interface SubscriptionData {
  id: string;
  status: string;
  product_id: string;
  product_name: string;
  price_id: string;
  amount: number;
  currency: string;
  interval: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created: string;
}

interface SubscriptionTier {
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

const getIconComponent = (iconType: string) => {
  switch (iconType) {
    case 'crown': return Crown;
    case 'sparkles': return Sparkles;
    case 'credit-card': return CreditCard;
    default: return Star;
  }
};

const getTierName = (tier: SubscriptionTier, language: Language): string => {
  const nameKey = `name_${language}` as keyof SubscriptionTier;
  return (tier[nameKey] as string) || tier.name_en;
};

const Subscription = () => {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [processingTier, setProcessingTier] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success(t('subscriptionSuccess'));
    } else if (searchParams.get("canceled") === "true") {
      toast.info(t('subscriptionCanceled'));
    }
    loadData();
  }, [searchParams]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load tiers from database
      const { data: tiersData, error: tiersError } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (tiersError) throw tiersError;
      setTiers(tiersData || []);

      // Load subscription data
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      
      setSubscriptions(data.subscriptions || []);
      setIsSubscribed(data.subscribed);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error(t('errorLoadingSubscription'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (!tier.stripe_price_id) {
      toast.error(t('tierNotConfigured'));
      return;
    }

    setProcessingTier(tier.id);
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { priceId: tier.stripe_price_id },
      });
      
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      toast.error(t('errorCreatingSubscription'));
    } finally {
      setProcessingTier(null);
    }
  };

  const handleManageSubscription = async () => {
    setOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error("Error opening portal:", error);
      toast.error(t('errorOpeningPortal'));
    } finally {
      setOpeningPortal(false);
    }
  };

  const formatDate = (dateString: string) => {
    const localeMap: Record<string, string> = {
      'fr': 'fr-FR', 'en': 'en-US', 'es': 'es-ES', 'de': 'de-DE', 
      'it': 'it-IT', 'pt': 'pt-BR', 'ar': 'ar-SA', 'zh': 'zh-CN', 
      'ja': 'ja-JP', 'ru': 'ru-RU'
    };
    return new Date(dateString).toLocaleDateString(localeMap[language] || 'fr-FR', {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">{t('cancelingAtEnd')}</Badge>;
    }
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />{t('active')}</Badge>;
      case 'canceled':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="w-3 h-3 mr-1" />{t('canceled')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getActiveTier = () => {
    const activeSubscription = subscriptions.find(s => s.status === 'active');
    if (!activeSubscription) return null;
    return tiers.find(t => t.stripe_product_id === activeSubscription.product_id) || null;
  };

  const activeTier = getActiveTier();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="border-b border-border p-4 sm:p-6 bg-card mt-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center mb-2">
            <PageHeaderBackButton to="/member-card" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif text-gold tracking-wide">{t('subscription')}</h1>
              <p className="text-gold/60 text-sm mt-1">{t('manageYourSubscription')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-gold" />
                  {isSubscribed ? t('yourCurrentPlan') : t('availablePlans')}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadData}
                  className="text-muted-foreground"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t('refresh')}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tiers.map((tier) => {
                  const IconComponent = getIconComponent(tier.icon_type);
                  const isCurrentPlan = activeTier?.id === tier.id;
                  
                  return (
                    <Card 
                      key={tier.id} 
                      className={`relative ${isCurrentPlan ? `${tier.border_color_class} border-2` : ''} ${tier.bg_color_class}`}
                    >
                      {isCurrentPlan && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-gold text-primary-foreground">{t('currentPlan')}</Badge>
                        </div>
                      )}
                      <CardHeader className="text-center">
                        <div className={`mx-auto p-4 rounded-full ${tier.bg_color_class} mb-2`}>
                          <IconComponent className={`h-8 w-8 ${tier.color_class}`} />
                        </div>
                        <CardTitle className="text-foreground">{getTierName(tier, language)}</CardTitle>
                        <CardDescription>
                          <span className="text-3xl font-bold text-foreground">{tier.price}€</span>
                          <span className="text-muted-foreground">/{t('month')}</span>
                        </CardDescription>
                      </CardHeader>
                      <CardFooter>
                        {isCurrentPlan ? (
                          <Button
                            onClick={handleManageSubscription}
                            disabled={openingPortal}
                            variant="outline"
                            className="w-full"
                          >
                            {openingPortal ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <ExternalLink className="w-4 h-4 mr-2" />
                            )}
                            {t('manageSubscription')}
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleSubscribe(tier)}
                            disabled={processingTier === tier.id || isSubscribed}
                            className="w-full bg-gold hover:bg-gold/90 text-primary-foreground"
                          >
                            {processingTier === tier.id ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : null}
                            {isSubscribed ? t('changePlan') : t('subscribe')}
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </div>

            {subscriptions.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gold" />
                  {t('subscriptionHistory')}
                </h2>

                <div className="space-y-3">
                  {subscriptions.map((sub) => (
                    <Card key={sub.id} className="bg-card">
                      <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground">{sub.product_name}</h3>
                              {getStatusBadge(sub.status, sub.cancel_at_period_end)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatAmount(sub.amount, sub.currency)}/{sub.interval === 'month' ? t('month') : sub.interval}
                            </p>
                          </div>
                          
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>
                              <span className="font-medium">{t('startDate')}:</span> {formatDate(sub.current_period_start)}
                            </p>
                            <p>
                              <span className="font-medium">{t('endDate')}:</span> {formatDate(sub.current_period_end)}
                            </p>
                            {sub.canceled_at && (
                              <p className="text-red-500">
                                <span className="font-medium">{t('canceledOn')}:</span> {formatDate(sub.canceled_at)}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {subscriptions.length === 0 && !loading && (
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">{t('noActiveSubscription')}</h3>
                    <p className="text-muted-foreground">{t('chooseSubscriptionPlan')}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {isSubscribed && (
              <div className="flex justify-center">
                <Button
                  onClick={handleManageSubscription}
                  disabled={openingPortal}
                  variant="outline"
                  className="border-gold/30 text-gold hover:bg-gold/10"
                >
                  {openingPortal ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  {t('managePaymentMethods')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;
