import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Check, ExternalLink, Eye, Save, Loader2, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LANDING_TEMPLATES, LandingTemplate } from "@/components/landing-templates";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface LandingPreferences {  
  template: LandingTemplate;
  show_contact_button: boolean;
  show_wealth_badge: boolean;
  show_location: boolean;
  show_quote: boolean;
  custom_headline: string;
  custom_description: string;
}

const LandingPreview = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<LandingPreferences>({
    template: 'classic',
    show_contact_button: true,
    show_wealth_badge: true,
    show_location: true,
    show_quote: true,
    custom_headline: '',
    custom_description: '',
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      setUserId(user.id);

      // Load existing preferences
      const { data, error } = await supabase
        .from('landing_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          template: (data.template as LandingTemplate) || 'classic',
          show_contact_button: data.show_contact_button ?? true,
          show_wealth_badge: data.show_wealth_badge ?? true,
          show_location: data.show_location ?? true,
          show_quote: data.show_quote ?? true,
          custom_headline: data.custom_headline || '',
          custom_description: data.custom_description || '',
        });
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!userId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('landing_preferences')
        .upsert({
          user_id: userId,
          template: preferences.template,
          show_contact_button: preferences.show_contact_button,
          show_wealth_badge: preferences.show_wealth_badge,
          show_location: preferences.show_location,
          show_quote: preferences.show_quote,
          custom_headline: preferences.custom_headline || null,
          custom_description: preferences.custom_description || null,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast.success(t('preferencesSaved'));
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error(t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    if (!userId) {
      toast.error(t('mustBeConnected'));
      return;
    }
    window.open(`/landing/${userId}`, '_blank');
  };

  const handleCopyLink = () => {
    if (!userId) {
      toast.error(t('mustBeConnected'));
      return;
    }
    const url = `${window.location.origin}/landing/${userId}`;
    navigator.clipboard.writeText(url);
    toast.success(t('linkCopied'));
  };

  const updatePreference = <K extends keyof LandingPreferences>(
    key: K,
    value: LandingPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center pt-32 sm:pt-36">
          <div className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-serif text-foreground mb-2">
                {t('landingPage')}
              </h1>
              <p className="text-muted-foreground">
                {t('customizePublicProfile')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                {t('preview')}
              </Button>
              <Button variant="outline" onClick={handleCopyLink}>
                <ExternalLink className="h-4 w-4 mr-2" />
                {t('copyLink')}
              </Button>
              <Button onClick={savePreferences} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {t('save')}
              </Button>
            </div>
          </div>

          {/* Template Selection */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {t('chooseTemplate')}
            </h2>
            <div className="grid gap-4">
              {LANDING_TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    preferences.template === template.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => updatePreference('template', template.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      preferences.template === template.id 
                        ? 'border-primary bg-primary' 
                        : 'border-muted-foreground'
                    }`}>
                      {preferences.template === template.id && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">
                        {template.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Display Options */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              {t('displayOptions')}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-contact" className="flex flex-col">
                  <span>{t('contactButton')}</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    {t('allowVisitorsContact')}
                  </span>
                </Label>
                <Switch
                  id="show-contact"
                  checked={preferences.show_contact_button}
                  onCheckedChange={(checked) => updatePreference('show_contact_button', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <Label htmlFor="show-wealth" className="flex flex-col">
                  <span>{t('wealthBadge')}</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    {t('showWealthCircle')}
                  </span>
                </Label>
                <Switch
                  id="show-wealth"
                  checked={preferences.show_wealth_badge}
                  onCheckedChange={(checked) => updatePreference('show_wealth_badge', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <Label htmlFor="show-location" className="flex flex-col">
                  <span>{t('location')}</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    {t('showCountryOnPage')}
                  </span>
                </Label>
                <Switch
                  id="show-location"
                  checked={preferences.show_location}
                  onCheckedChange={(checked) => updatePreference('show_location', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <Label htmlFor="show-quote" className="flex flex-col">
                  <span>{t('personalQuote')}</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    {t('showQuoteOnPage')}
                  </span>
                </Label>
                <Switch
                  id="show-quote"
                  checked={preferences.show_quote}
                  onCheckedChange={(checked) => updatePreference('show_quote', checked)}
                />
              </div>
            </div>
          </Card>

          {/* Custom Content */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {t('customContentOptional')}
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-headline">{t('customTitle')}</Label>
                <Input
                  id="custom-headline"
                  placeholder={t('customTitlePlaceholder')}
                  value={preferences.custom_headline}
                  onChange={(e) => updatePreference('custom_headline', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="custom-description">{t('customDescription')}</Label>
                <Textarea
                  id="custom-description"
                  placeholder={t('customDescriptionPlaceholder')}
                  value={preferences.custom_description}
                  onChange={(e) => updatePreference('custom_description', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {/* Help Section */}
          <div className="p-6 bg-muted/30 rounded-lg border border-border">
            <h3 className="text-lg font-medium text-foreground mb-2">
              {t('howToUseLandingPage')}
            </h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• {t('landingHelp1')}</li>
              <li>• {t('landingHelp2')}</li>
              <li>• {t('landingHelp3')}</li>
              <li>• {t('landingHelp4')}</li>
              <li>• {t('landingHelp5')}</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPreview;
