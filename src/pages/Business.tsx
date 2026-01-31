import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, Trophy, Users, Globe, Briefcase, Eye, Newspaper, FolderKanban, GripVertical, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { BusinessOnboarding } from "@/components/business/BusinessOnboarding";
import { BusinessModule } from "@/components/business/BusinessModule";
import { BusinessTimeline } from "@/components/business/BusinessTimeline";
import { BusinessOpportunities } from "@/components/business/BusinessOpportunities";
import { BusinessImageGallery } from "@/components/business/BusinessImageGallery";
import { BusinessProjectsGallery } from "@/components/business/BusinessProjectsGallery";
import { getCurrencySymbol } from "@/lib/currencySymbols";
import { PageHeaderBackButton } from "@/components/BackButton";

const Business = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [privateData, setPrivateData] = useState<any>(null);
  const [businessContent, setBusinessContent] = useState<any>({});
  const [timelineEntries, setTimelineEntries] = useState<any[]>([]);
  const [pressEntries, setPressEntries] = useState<any[]>([]);
  const [projectsEntries, setProjectsEntries] = useState<any[]>([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const profileId = id || user.id;
      const isOwn = profileId === user.id;
      setIsOwnProfile(isOwn);

      // Check access if viewing another user's profile
      if (!isOwn) {
        const { data: friendships } = await supabase
          .from('friendships')
          .select('business_access')
          .or(`and(user_id.eq.${user.id},friend_id.eq.${profileId}),and(user_id.eq.${profileId},friend_id.eq.${user.id})`);

        if (!friendships || friendships.length === 0 || !friendships[0].business_access) {
          setHasAccess(false);
          setIsCheckingAccess(false);
          setLoading(false);
          return;
        }
        setHasAccess(true);
      } else {
        setHasAccess(true);
      }
      setIsCheckingAccess(false);

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) throw error;
      setProfile(profileData);

      // Load private data for wealth display (only for own profile)
      if (isOwn) {
        const { data: privData } = await supabase
          .from('profiles_private')
          .select('*')
          .eq('user_id', profileId)
          .maybeSingle();
        
        // Decrypt sensitive data
        if (privData) {
          try {
            const { decryptValue } = await import('@/lib/encryption');
            const decrypted = {
              ...privData,
              mobile_phone: privData.mobile_phone ? await decryptValue(privData.mobile_phone) : privData.mobile_phone,
              wealth_amount: privData.wealth_amount ? await decryptValue(privData.wealth_amount) : privData.wealth_amount,
            };
            setPrivateData(decrypted);
          } catch {
            setPrivateData(privData);
          }
        }
      }

      // Load business content
      const { data: contentData } = await supabase
        .from('business_content')
        .select('*')
        .eq('user_id', profileId)
        .maybeSingle();

      if (contentData) {
        if (contentData.company_photos && typeof contentData.company_photos === 'string') {
          try {
            contentData.company_photos = JSON.parse(contentData.company_photos);
          } catch {
            contentData.company_photos = [];
          }
        }
        setBusinessContent(contentData);
        // Check if onboarding completed
        if (!contentData.onboarding_completed && isOwn) {
          setShowOnboarding(true);
        }
      } else if (isOwn) {
        // No content yet, show onboarding
        setShowOnboarding(true);
      }

      // Load timeline entries
      const { data: timeline } = await supabase
        .from('business_timeline')
        .select('*')
        .eq('user_id', profileId)
        .order('display_order');
      setTimelineEntries(timeline || []);

      // Load press entries
      const { data: press } = await supabase
        .from('business_press')
        .select('*')
        .eq('user_id', profileId)
        .order('display_order');
      setPressEntries(press || []);

      // Load projects
      const { data: projects } = await supabase
        .from('business_projects')
        .select('*')
        .eq('user_id', profileId)
        .order('display_order');
      setProjectsEntries(projects || []);

    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: t('errorLoading'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async (mode: string, data?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updateData: any = {
        user_id: user.id,
        onboarding_completed: mode !== "concierge",
        onboarding_mode: mode,
      };

      if (data?.bio_executive) updateData.bio_executive = data.bio_executive;
      if (data?.achievements_text) updateData.achievements_text = data.achievements_text;
      if (data?.vision_text) updateData.vision_text = data.vision_text;

      const { error } = await supabase
        .from('business_content')
        .upsert(updateData, { onConflict: 'user_id' });

      if (error) throw error;

      setShowOnboarding(false);
      loadProfile();

      toast({
        title: mode === "concierge" ? t('businessRequestSent') : t('businessProfileCreated'),
        description: mode === "concierge"
          ? t('businessConciergePreparing')
          : t('businessSectionReady'),
      });
    } catch (error) {
      console.error("Error saving onboarding:", error);
      toast({
        title: t('errorTitle'),
        description: t('businessCannotSave'),
        variant: "destructive",
      });
    }
  };

  const handleModuleUpdate = async (field: string, value: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('business_content')
        .upsert({
          user_id: user.id,
          [field]: value,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setBusinessContent((prev: any) => ({ ...prev, [field]: value }));
      toast({ title: t('businessModuleUpdated') });
    } catch (error) {
      console.error("Error updating module:", error);
      toast({ title: t("error"), variant: "destructive" });
    }
  };

  const handleTimelineAdd = async (entry: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('business_timeline')
        .insert({ ...entry, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      setTimelineEntries((prev) => [...prev, data]);
      toast({ title: t('businessStepAdded') });
    } catch (error) {
      console.error("Error adding timeline:", error);
      toast({ title: t("error"), variant: "destructive" });
    }
  };

  const handleTimelineEdit = async (entry: any) => {
    try {
      const { error } = await supabase
        .from('business_timeline')
        .update({ ...entry, updated_at: new Date().toISOString() })
        .eq('id', entry.id);

      if (error) throw error;
      setTimelineEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e)));
      toast({ title: t('businessStepModified') });
    } catch (error) {
      console.error("Error updating timeline:", error);
      toast({ title: t("error"), variant: "destructive" });
    }
  };

  const handleTimelineDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('business_timeline').delete().eq('id', id);
      if (error) throw error;
      setTimelineEntries((prev) => prev.filter((e) => e.id !== id));
      toast({ title: t('businessStepDeleted') });
    } catch (error) {
      console.error("Error deleting timeline:", error);
      toast({ title: t("error"), variant: "destructive" });
    }
  };

  const handleProjectAdd = async (project: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('business_projects')
      .insert({ ...project, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    setProjectsEntries((prev) => [...prev, data]);
  };

  const handleProjectEdit = async (project: any) => {
    const { error } = await supabase
      .from('business_projects')
      .update({ ...project, updated_at: new Date().toISOString() })
      .eq('id', project.id);

    if (error) throw error;
    setProjectsEntries((prev) => prev.map((p) => (p.id === project.id ? project : p)));
  };

  const handleProjectDelete = async (id: string) => {
    const { error } = await supabase.from('business_projects').delete().eq('id', id);
    if (error) throw error;
    setProjectsEntries((prev) => prev.filter((p) => p.id !== id));
  };

  const handleImagesChange = async (images: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: t("error"), description: t("notAuthenticated"), variant: "destructive" });
        return;
      }

      const { error } = await supabase
        .from("business_content")
        .upsert({
          user_id: user.id,
          company_photos: images,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (error) throw error;

      setBusinessContent((prev: any) => ({ ...prev, company_photos: images }));
    } catch (error: any) {
      console.error("Error updating images:", error);
      toast({
        title: t("error"),
        description: error?.message || t("uploadError"),
        variant: "destructive",
      });
      throw error;
    }
  };

  // Formater le patrimoine (only visible for own profile)
  const formatWealth = () => {
    if (!isOwnProfile || !privateData?.wealth_amount || !privateData?.wealth_unit || !privateData?.wealth_currency) {
      return t("notAvailable");
    }
    const amount = Math.round(parseFloat(privateData.wealth_amount));
    const unit = privateData.wealth_unit;
    const symbol = getCurrencySymbol(privateData.wealth_currency);
    return `${amount} ${unit} ${symbol}`;
  };

  if (loading || isCheckingAccess) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background text-foreground pt-20 sm:pt-24 flex items-center justify-center safe-area-all">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">{t('loading')}</p>
          </div>
        </div>
      </>
    );
  }

  if (!isOwnProfile && !hasAccess) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background text-foreground pt-20 sm:pt-24 flex items-center justify-center safe-area-all">
          <div className="text-center max-w-md px-4">
            <div className="mb-6">
              <Briefcase className="w-16 h-16 text-gold/30 mx-auto mb-4" />
              <h2 className="text-xl font-serif text-gold mb-2">{t('accessRestricted')}</h2>
              <p className="text-muted-foreground text-sm mb-4">{t('businessNoAccess')}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/member-card"))}
              className="border-gold/30 text-gold hover:bg-gold/10"
            >
              {t('businessBackToProfile')}
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background text-foreground pt-20 sm:pt-24 flex items-center justify-center safe-area-all">
          <p className="text-muted-foreground">{t('businessProfileNotFound')}</p>
        </div>
      </>
    );
  }

  // Show onboarding for first-time users
  if (showOnboarding && isOwnProfile) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-black text-gold p-6 pt-20 sm:pt-24">
          <div className="max-w-4xl mx-auto">
            <BusinessOnboarding
              onComplete={handleOnboardingComplete}
              profileData={profile}
            />
          </div>
        </div>
      </>
    );
  }

  const aiContext = {
    name: `${profile.first_name} ${profile.last_name}`,
    role: profile.job_function,
    domain: profile.activity_domain,
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background text-foreground pt-20 sm:pt-24 safe-area-all">
        {/* Header - aligné Famille / Passions */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-16 sm:top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center min-w-0">
                <PageHeaderBackButton to="/member-card" />
                <div className="min-w-0 ml-2">
                  <h1 className="text-2xl sm:text-3xl font-serif text-gold tracking-wide truncate">{t('businessTitle')}</h1>
                  <p className="text-gold/60 text-xs sm:text-sm mt-0.5">{t('businessSubtitle')}</p>
                </div>
              </div>
              {isOwnProfile && !showOnboarding && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOnboarding(true)}
                  className="text-gold/60 hover:text-gold hover:bg-gold/10 shrink-0"
                >
                  <Sparkles className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{t('businessReconfigure')}</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 overflow-x-hidden">
          {/* Profile Summary Card - style cohérent Famille */}
          <div className="module-card rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-gold/5 pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-gold/30 overflow-hidden bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl sm:text-2xl font-serif text-gold/80">{profile.first_name?.[0]}{profile.last_name?.[0]}</span>
                )}
              </div>
              <div className="text-center sm:text-left flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-serif text-gold">{profile.first_name} {profile.last_name}</h2>
                <p className="text-gold/70 text-sm sm:text-base mt-0.5">{profile.job_function || t('businessJobNotSpecified')}</p>
                <p className="text-gold/50 text-xs sm:text-sm mt-0.5">{[profile.activity_domain, formatWealth()].filter(Boolean).join(' • ')}</p>
              </div>
            </div>
          </div>

          {/* Items principaux (entreprise, poste, projets) - comme Passions / Famille */}
          {(() => {
            const mainItems: string[] = [];
            if (businessContent?.company_name?.trim()) mainItems.push(businessContent.company_name.trim());
            if (businessContent?.position_title?.trim()) mainItems.push(businessContent.position_title.trim());
            if (projectsEntries?.length) {
              projectsEntries.forEach((p: any) => {
                if (p?.title?.trim()) mainItems.push(p.title.trim());
              });
            }
            if (mainItems.length === 0) return null;
            return (
              <div className="module-card rounded-xl p-4 sm:p-6 mb-6 overflow-x-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-4 h-4 text-gold/80 shrink-0" />
                  <h3 className="text-sm font-medium text-gold/80">{t('business')}</h3>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {mainItems.map((label, idx) => (
                    <li key={idx}>
                      <span className="inline-flex items-center rounded-md border border-gold/30 bg-gold/5 px-3 py-1.5 text-sm text-foreground">
                        {label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}

          {/* Galerie photos */}
          <div className="mb-6 sm:mb-8">
            <BusinessImageGallery
              images={businessContent.company_photos || []}
              editable={isOwnProfile}
              onImagesChange={handleImagesChange}
            />
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bio Executive */}
            <BusinessModule
              icon={Briefcase}
              title={t('businessBioExecutive')}
              subtitle={t('businessBioSubtitle')}
              content={businessContent.bio_executive}
              isEmpty={!businessContent.bio_executive}
              editable={isOwnProfile}
              moduleType="bio"
              onEdit={(value) => handleModuleUpdate("bio_executive", value)}
              aiContext={aiContext}
            />

            {/* Timeline */}
            <BusinessTimeline
              entries={timelineEntries}
              editable={isOwnProfile}
              onAdd={handleTimelineAdd}
              onEdit={handleTimelineEdit}
              onDelete={handleTimelineDelete}
            />

            {/* Achievements */}
            <BusinessModule
              icon={Trophy}
              title={t('businessAchievements')}
              subtitle={t('businessAchievementsSubtitle')}
              content={businessContent.achievements_text}
              isEmpty={!businessContent.achievements_text}
              editable={isOwnProfile}
              moduleType="achievements"
              onEdit={(value) => handleModuleUpdate("achievements_text", value)}
              aiContext={aiContext}
            />

            {/* Press & Distinctions */}
            <BusinessModule
              icon={Newspaper}
              title={t('businessPressDistinctions')}
              subtitle={t('businessPressSubtitle')}
              content={pressEntries.map(p => `• ${p.title} - ${p.source}`).join('\n') || undefined}
              isEmpty={pressEntries.length === 0}
              editable={isOwnProfile}
              moduleType="press"
              onEdit={() => { }}
            />

            {/* Projects with Gallery */}
            <BusinessProjectsGallery
              projects={projectsEntries}
              editable={isOwnProfile}
              onAdd={handleProjectAdd}
              onEdit={handleProjectEdit}
              onDelete={handleProjectDelete}
            />

            {/* Vision */}
            <BusinessModule
              icon={Eye}
              title={t('businessVision')}
              subtitle={t('businessVisionSubtitle')}
              content={businessContent.vision_text}
              isEmpty={!businessContent.vision_text}
              editable={isOwnProfile}
              moduleType="vision"
              onEdit={(value) => handleModuleUpdate("vision_text", value)}
              aiContext={aiContext}
            />

            {/* Opportunités d'affaires */}
            <BusinessOpportunities />
          </div>
        </div>
      </div>
    </>
  );
};

export default Business;
