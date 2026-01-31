import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, Heart, Globe, Settings, Fingerprint, Camera, Crown, Diamond, BadgeDollarSign, Loader2 } from "lucide-react";
import { useLanguage, languages } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuroraLogo } from "@/components/AuroraLogo";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { WealthBadge } from "@/components/WealthBadge";
import { WebAuthnPrompt } from "@/components/WebAuthnPrompt";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderBackButton } from "@/components/BackButton";
import { useProfileImageVerification } from "@/hooks/useProfileImageVerification";
import { IdentityVerifiedBadge } from "@/components/VerificationBadge";
import { useProgress } from "@/components/ui/progress-bar";

const MemberCard = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const { done } = useProgress();
  const [profile, setProfile] = useState<any>(null);
  const [privateData, setPrivateData] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [businessContent, setBusinessContent] = useState<any>(null);
  const [businessProjects, setBusinessProjects] = useState<any[]>([]);
  const [businessTimeline, setBusinessTimeline] = useState<any[]>([]);
  const [businessPress, setBusinessPress] = useState<any[]>([]);
  const [familyContent, setFamilyContent] = useState<any>(null);
  const [familyBoard, setFamilyBoard] = useState<any[]>([]);
  const [familyClose, setFamilyClose] = useState<any[]>([]);
  const [familyLineage, setFamilyLineage] = useState<any[]>([]);
  const [familyInfluential, setFamilyInfluential] = useState<any[]>([]);
  const [personalContent, setPersonalContent] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { verifyImage, isVerifying, canProceed, resetVerification } = useProfileImageVerification();

  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        loadProfile(),
        loadConnectionsCount(),
        loadBusinessContent(),
        loadFamilyContent(),
        loadPersonalContent()
      ]);
      done(); // Signal progress bar completion after ALL data is loaded
    };
    loadAllData();
  }, []);

  // Listen for avatar updates from other components (like EditProfile)
  useEffect(() => {
    const handleAvatarUpdate = async (event: CustomEvent<{ avatarUrl: string; userId: string }>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === event.detail.userId && profile) {
        // Add cache-buster to ensure fresh image
        const { getAvatarDisplayUrl } = await import('@/lib/avatarUtils');
        const avatarUrlWithCache = getAvatarDisplayUrl(event.detail.avatarUrl) || event.detail.avatarUrl;
        setProfile((prev: any) => ({ ...prev, avatar_url: avatarUrlWithCache }));
      }
    };

    window.addEventListener('avatar-updated', handleAvatarUpdate as EventListener);
    return () => {
      window.removeEventListener('avatar-updated', handleAvatarUpdate as EventListener);
    };
  }, [profile]);


  const loadConnectionsCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    console.log('[MemberCard] Loading connections for user:', user.id);

    // Count unique friends for the current user (both directions)
    const { data: friendships } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    console.log('[MemberCard] Friendships found:', friendships);

    if (!friendships) {
      setConnectionsCount(0);
      return;
    }

    const uniqueFriendIds = new Set<string>();
    friendships.forEach(friendship => {
      if (friendship.user_id === user.id) {
        uniqueFriendIds.add(friendship.friend_id);
      } else if (friendship.friend_id === user.id) {
        uniqueFriendIds.add(friendship.user_id);
      }
    });

    console.log('[MemberCard] Unique friend IDs:', Array.from(uniqueFriendIds));
    console.log('[MemberCard] Total connections count:', uniqueFriendIds.size);
    setConnectionsCount(uniqueFriendIds.size);
  };

  const loadBusinessContent = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [contentRes, projectsRes, timelineRes, pressRes] = await Promise.all([
      supabase.from('business_content').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('business_projects').select('id, title').eq('user_id', user.id).order('display_order'),
      supabase.from('business_timeline').select('title').eq('user_id', user.id).order('display_order'),
      supabase.from('business_press').select('title').eq('user_id', user.id).order('display_order')
    ]);

    if (contentRes.error) {
      console.error('[MemberCard] Error loading business content:', contentRes.error);
      return;
    }
    setBusinessContent(contentRes.data);
    setBusinessProjects(projectsRes.data || []);
    setBusinessTimeline(timelineRes.data || []);
    setBusinessPress(pressRes.data || []);
  };

  const loadFamilyContent = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [contentRes, boardRes, closeRes, lineageRes, influentialRes] = await Promise.all([
      supabase.from('family_content').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('family_board').select('member_name').eq('user_id', user.id).order('display_order'),
      supabase.from('family_close').select('member_name').eq('user_id', user.id).order('display_order'),
      supabase.from('family_lineage').select('member_name').eq('user_id', user.id).order('display_order'),
      supabase.from('family_influential').select('person_name').eq('user_id', user.id).order('display_order')
    ]);

    if (contentRes.error) {
      console.error('[MemberCard] Error loading family content:', contentRes.error);
      return;
    }
    setFamilyContent(contentRes.data);
    setFamilyBoard(boardRes.data || []);
    setFamilyClose(closeRes.data || []);
    setFamilyLineage(lineageRes.data || []);
    setFamilyInfluential(influentialRes.data || []);
  };

  const loadPersonalContent = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const [sportsRes, voyagesRes, philosophieRes, artRes, collectionsRes, projetsRes] = await Promise.all([
        supabase.from("sports_hobbies").select("*").eq("user_id", user.id).order("display_order"),
        supabase.from("personal_voyages").select("*").eq("user_id", user.id).order("display_order").limit(3),
        supabase.from("personal_art_culture").select("*").eq("user_id", user.id).in("category", ["mentors", "philosophie", "citations", "lectures"]).order("display_order").limit(3),
        supabase.from("personal_art_culture").select("*").eq("user_id", user.id).not("category", "in", "(mentors,philosophie,citations,lectures)").order("display_order").limit(3),
        supabase.from("personal_collections").select("*").eq("user_id", user.id).not("category", "in", "(en_cours,a_venir,realises)").order("display_order").limit(3),
        supabase.from("personal_collections").select("*").eq("user_id", user.id).in("category", ["en_cours", "a_venir", "realises"]).order("display_order").limit(3)
      ]);

      console.log('[MemberCard] Sports loaded:', sportsRes.data);
      console.log('[MemberCard] Sports count:', sportsRes.data?.length || 0);
      console.log('[MemberCard] Sports error:', sportsRes.error);
      if (sportsRes.data && sportsRes.data.length > 0) {
        console.log('[MemberCard] First sport:', sportsRes.data[0]);
        console.log('[MemberCard] Sports titles:', sportsRes.data.map((s: any) => s.title));
      }

      setPersonalContent({
        sports: sportsRes.data || [],
        voyages: voyagesRes.data || [],
        philosophie: philosophieRes.data || [],
        artCulture: artRes.data || [],
        collections: collectionsRes.data || [],
        projets: projetsRes.data || []
      });
    } catch (error) {
      console.error('[MemberCard] Error loading personal content:', error);
    }
  };

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[MemberCard] No authenticated user, redirecting to login');
      navigate("/login");
      return;
    }

    // Store user info for WebAuthn prompt
    setCurrentUserId(user.id);
    setCurrentUserEmail(user.email || null);

    console.log('[MemberCard] Loading profile for user:', user.id);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[MemberCard] Error loading profile:', error);
      toast.error(t('errorLoadingProfile'));
      return;
    }

    // Load private data for wealth badge
    const { data: privData } = await supabase
      .from('profiles_private')
      .select('*')
      .eq('user_id', user.id)
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

    // Si le profil n'existe pas, le créer
    if (!data) {
      console.log('[MemberCard] Profile does not exist, creating new profile');
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          username: user.email?.split('@')[0] || ''
        })
        .select()
        .single();

      if (insertError) {
        console.error('[MemberCard] Error creating profile:', insertError);
        toast.error(t('errorCreatingProfile'));
        return;
      }

      console.log('[MemberCard] Profile created:', newProfile);
      setProfile(newProfile);
    } else {
      console.log('[MemberCard] Profile loaded:', data);
      // Add cache-buster to avatar URL for fresh display
      if (data.avatar_url) {
        const { getAvatarDisplayUrl } = await import('@/lib/avatarUtils');
        data.avatar_url = getAvatarDisplayUrl(data.avatar_url) || data.avatar_url;
      }
      setProfile(data);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      resetVerification();
      const file = event.target.files?.[0];
      if (!file) return;

      // Convert to base64 and verify
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;

        // Verify the image first
        const result = await verifyImage(base64);

        // Only upload if verification passes or is a warning
        if (result && !result.isValid && !result.hasFace) {
          setUploading(false);
          return; // Don't upload invalid images
        }

        // Proceed with upload using shared utility
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error(t('notAuthenticated'));

          const { uploadAvatar, dispatchAvatarUpdate, getAvatarDisplayUrl } = await import('@/lib/avatarUtils');
          
          const cleanUrl = await uploadAvatar(user.id, base64);
          
          if (!cleanUrl) {
            throw new Error(t('uploadError'));
          }

          const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: cleanUrl })
            .eq('id', user.id);

          if (updateError) throw updateError;

          // Add cache-buster for local display only
          const displayUrl = getAvatarDisplayUrl(cleanUrl) || cleanUrl;
          setProfile({ ...profile, avatar_url: displayUrl });

          // Dispatch custom event for real-time sync
          dispatchAvatarUpdate(cleanUrl, user.id);

          toast.success(t('photoUpdated'));
        } catch (error: any) {
          toast.error(error.message || t('uploadError'));
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast.error(error.message);
      setUploading(false);
    }
  };

  const profileSections = [
    {
      title: t('business'),
      icon: Briefcase,
      route: "/business",
      items: (() => {
        const items: string[] = [];
        if (businessContent?.company_name?.trim()) items.push(businessContent.company_name.trim());
        if (businessContent?.position_title?.trim()) items.push(businessContent.position_title.trim());
        if (businessProjects?.length) {
          businessProjects.forEach((p: any) => {
            if (p?.title?.trim()) items.push(p.title.trim());
          });
        }
        if (businessTimeline?.length) {
          businessTimeline.forEach((e: any) => {
            if (e?.title?.trim()) items.push(e.title.trim());
          });
        }
        if (businessPress?.length) {
          businessPress.forEach((p: any) => {
            if (p?.title?.trim()) items.push(p.title.trim());
          });
        }
        return items.length > 0 ? items : [t('clickToAddBusiness')];
      })()
    },
    {
      title: t('familySocial'),
      icon: Heart,
      route: "/family",
      items: (() => {
        const items: string[] = [];
        if (familyBoard?.length) {
          familyBoard.forEach((m: any) => {
            if (m?.member_name?.trim()) items.push(m.member_name.trim());
          });
        }
        if (familyClose?.length) {
          familyClose.forEach((m: any) => {
            if (m?.member_name?.trim()) items.push(m.member_name.trim());
          });
        }
        if (familyLineage?.length) {
          familyLineage.forEach((m: any) => {
            if (m?.member_name?.trim()) items.push(m.member_name.trim());
          });
        }
        if (familyInfluential?.length) {
          familyInfluential.forEach((p: any) => {
            if (p?.person_name?.trim()) items.push(p.person_name.trim());
          });
        }
        return items.length > 0 ? items : [t('clickToAddFamily')];
      })()
    },
    {
      title: t('personal'),
      icon: Users,
      route: "/personal",
      items: personalContent ? (() => {
        const items: string[] = [];
        // Ajouter tous les titres des sports personnalisés
        if (personalContent.sports && Array.isArray(personalContent.sports) && personalContent.sports.length > 0) {
          personalContent.sports.forEach((sport: any) => {
            if (sport && sport.title && sport.title.trim()) {
              items.push(sport.title.trim());
            }
          });
        }
        if (personalContent.voyages?.length > 0) {
          const destination = personalContent.voyages[0].destination;
          if (destination && destination.trim()) {
            items.push(destination.trim());
          }
        }
        if (personalContent.artCulture?.length > 0) {
          const title = personalContent.artCulture[0].title;
          if (title && title.trim()) {
            items.push(title.trim());
          }
        }
        if (personalContent.collections?.length > 0) {
          const title = personalContent.collections[0].title;
          if (title && title.trim()) {
            items.push(title.trim());
          }
        }
        if (personalContent.projets?.length > 0) {
          const title = personalContent.projets[0].title;
          if (title && title.trim()) {
            items.push(title.trim());
          }
        }
        if (personalContent.philosophie?.length > 0) {
          const title = personalContent.philosophie[0].title;
          if (title && title.trim()) {
            items.push(title.trim());
          }
        }
        console.log('[MemberCard] Personal items to display:', items);
        return items.length > 0 ? items : [t('clickToAddPersonal')];
      })() : [t('clickToAddPersonal')]
    },
    {
      title: t('influenceNetwork'),
      icon: Globe,
      route: "/network",
      items: [t('exclusiveClubs'), t('globalForums'), t('socialMediaLabel')]
    },
    {
      title: t('integratedServices'),
      icon: Settings,
      route: "/services",
      items: [t('concierge'), t('metaverse'), t('marketplace')]
    },
    {
      title: t('members'),
      icon: Users,
      route: "/members",
      items: [t('memberDirectory'), t('detailedProfiles'),
        ]
    }
  ];

  if (!profile) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-black text-gold px-4 sm:px-6 pt-32 sm:pt-36 pb-8 safe-area-all">
          <div className="max-w-4xl mx-auto">
            {/* Language Selector Skeleton */}
            <div className="flex justify-end mb-6">
              <Skeleton className="h-10 w-[140px] bg-gold/10" />
            </div>

            {/* Profile Header Skeleton */}
            <div className="text-center mb-8 sm:mb-12">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4">
                <Skeleton className="w-full h-full rounded-full bg-gold/10" />
              </div>
              <Skeleton className="h-4 w-20 mx-auto mb-2 bg-gold/10" />
              <Skeleton className="h-8 w-48 mx-auto mb-1 bg-gold/10" />
              <Skeleton className="h-8 w-40 mx-auto mb-2 bg-gold/10" />
              <Skeleton className="h-4 w-32 mx-auto mb-1 bg-gold/10" />
              <Skeleton className="h-4 w-24 mx-auto bg-gold/10" />
            </div>

            {/* Sections Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-black/50 border border-gold/20 rounded-lg p-4 sm:p-6 flex flex-col h-full min-h-[200px]">
                  <div className="flex items-center mb-3 sm:mb-4 flex-shrink-0">
                    <Skeleton className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-gold/10 mr-2 sm:mr-3" />
                    <Skeleton className="h-4 sm:h-5 w-24 sm:w-32 bg-gold/10" />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 flex-1">
                    <Skeleton className="h-3 w-full bg-gold/10" />
                    <Skeleton className="h-3 w-4/5 bg-gold/10" />
                    <Skeleton className="h-3 w-3/4 bg-gold/10" />
                    <Skeleton className="h-3 w-2/3 bg-gold/10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Mobile-responsive header title
  const displayName = `${profile.first_name?.toUpperCase() || 'ALEXANDRE'} ${profile.last_name?.toUpperCase() || 'DU ROCHE'}`;

  return (
    <>
      <Header />
      {/* WebAuthn Biometric Prompt - shows when biometrics available but not enabled */}
      {currentUserId && currentUserEmail && (
        <WebAuthnPrompt
          userId={currentUserId}
          userEmail={currentUserEmail}
        />
      )}
      <div className="min-h-screen bg-black text-gold px-4 sm:px-6 pt-20 sm:pt-24 pb-8 safe-area-all">
        <div className="max-w-4xl mx-auto">
          {/* Language Selector */}
          <div className="flex justify-end mb-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gold hover:bg-gold/10">
                  <Globe className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-black border-gold/20">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={language === lang.code ? "bg-gold/20 text-gold" : "text-gold hover:bg-gold/10"}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Profile Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4">
              <div
                className="w-full h-full rounded-full border-2 border-gold overflow-hidden cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                {profile.avatar_url && !imageError ? (
                  <img
                    src={profile.avatar_url}
                    alt={t('avatarPreview')}
                    className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                    onError={() => setImageError(true)}
                    onLoad={() => setImageError(false)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center group-hover:from-gold/30 group-hover:to-gold/10 transition-all">
                    <span className="text-4xl font-serif">
                      {profile.first_name?.[0]?.toUpperCase() || 'A'}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full">
                  <Camera className="w-8 h-8 text-gold" />
                </div>
              </div>

              {/* Camera Button - Always visible */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || isVerifying}
                className="absolute -bottom-1 right-1/2 translate-x-1/2 bg-gold text-black rounded-full p-2 shadow-lg hover:bg-gold/90 transition-colors disabled:opacity-50"
              >
                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>

              {/* Identity Verified Badge - Bottom right */}
              {/* <IdentityVerifiedBadge isVerified={profile.identity_verified} /> */}

              {/* Fondateur Badge - Top left (10 o'clock) */}
              {profile.is_founder && (
                <Badge className="absolute top-2 -left-2 bg-gold text-black px-2 py-1 flex items-center gap-1 shadow-lg whitespace-nowrap">
                  <Crown className="w-3 h-3" />
                  <span className="text-xs font-semibold">{t('founderLabel')}</span>
                </Badge>
              )}

              {/* Wealth Badge - Top right (2 o'clock/14h) */}
              <WealthBadge
                wealthBillions={privateData?.wealth_billions}
                wealthAmount={privateData?.wealth_amount}
                wealthUnit={privateData?.wealth_unit}
                wealthCurrency={privateData?.wealth_currency}
                className="absolute top-0 -right-1"
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {profile.honorific_title && <p className="text-gold/60 text-xs sm:text-sm mb-2">{profile.honorific_title}</p>}
            <h1 className="text-xl sm:text-3xl font-serif text-gold mb-1">{profile.first_name?.toUpperCase() || 'ALEXANDRE'}</h1>
            <h2 className="text-xl sm:text-3xl font-serif text-gold mb-2">{profile.last_name?.toUpperCase() || 'DU ROCHE'}</h2>
            {profile.country && (
              <p className="text-gold/80 mb-2 flex items-center justify-center gap-2">
                <Globe className="w-4 h-4" />
                {profile.country}
              </p>
            )}
            {currentUserEmail && (
              <p className="text-gold/50 text-xs mb-4">{currentUserEmail}</p>
            )}
{/* 
            {profile.account_number && (
              <div className="text-xs sm:text-sm text-gold/60 font-mono tracking-wider">
                {profile.account_number}
              </div>
            )} */}


          </div>

          {/* Profile Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {profileSections.map((section, index) => (
              <div key={index} className="relative flex flex-col h-full">
                {/* Mécène Badge - Above Business section */}
                {section.title === t('business') && profile.is_patron && (
                  <div className="mb-2 flex justify-center">
                    <Badge className="bg-gold text-black px-2 py-1 flex items-center gap-1 shadow-lg whitespace-nowrap">
                      <Heart className="w-3 h-3 fill-black" />
                      <span className="text-xs font-semibold">{t('patronLabel')}</span>
                    </Badge>
                  </div>
                )}

                {/* Connections Badge - Above Family&Social section */}
                {section.title === t('familySocial') && (
                  <div className="mb-2 flex justify-center">
                    <Badge
                      className="bg-gold text-black px-2 py-1 flex items-center gap-1 shadow-lg whitespace-nowrap cursor-pointer hover:bg-gold/80 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/members?showConnections=true');
                      }}
                    >
                      <Users className="w-3 h-3" />
                      <span className="text-xs font-semibold">{connectionsCount} {t('relationsLabel')}</span>
                    </Badge>
                  </div>
                )}

                <div
                  className="bg-black/50 border border-gold/20 rounded-lg p-4 sm:p-6 hover:border-gold/40 transition-all duration-300 cursor-pointer flex flex-col h-full min-h-[200px]"
                  onClick={() => section.title !== t('integratedServices') && navigate(section.route)}
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4 flex-shrink-0">
                    <div className="flex items-center">
                      <section.icon className="w-5 h-5 sm:w-6 sm:h-6 text-gold mr-2 sm:mr-3 flex-shrink-0" />
                      <h3 className="text-base sm:text-lg font-semibold text-gold">{section.title}</h3>
                    </div>
                   
                  </div>

                  <div className="flex-1 flex flex-col min-h-0">
                    {section.title === t('integratedServices') ? (
                      <div className="flex flex-col gap-2 sm:gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gold/40 text-gold hover:bg-gold hover:text-black w-full text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/concierge');
                          }}
                        >
                          {t('concierge')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gold/40 text-gold hover:bg-gold hover:text-black w-full text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/metaverse');
                          }}
                        >
                          {t('metaverse')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gold/40 text-gold hover:bg-gold hover:text-black w-full text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/marketplace');
                          }}
                        >
                          {t('marketplace')}
                        </Button>
                      </div>
                    ) : (
                      <ul className="space-y-1.5 sm:space-y-2 flex-1">
                        {section.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="text-gold/70 text-xs sm:text-sm flex items-start">
                            <span className="text-gold mr-2 flex-shrink-0">•</span>
                            <span className="line-clamp-2 break-words">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {section.title === t('business') && (
                    <div className="flex items-center gap-2 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gold/20 flex-wrap flex-shrink-0">
                      <div className="text-xs text-gold/60">{t('forbes30')}</div>
                      <div className="text-xs text-gold/60">{t('ey')}</div>
                      <div className="text-xs text-gold/60">{t('harvardMBA')}</div>
                    </div>
                  )}

                  {/* {section.title === t('members') && (
                    <div className="flex items-center mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gold/20 flex-shrink-0">
                      <Users className="w-4 h-4 text-gold mr-2" />
                      <span className="text-xs text-gold/60">{t('exclusiveLabel')}</span>
                    </div>
                  )} */}
                </div>
              </div>
            ))}
          </div>



          {/* Bottom Actions */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/edit-profile")}
              className="border-gold text-gold hover:bg-gold hover:text-black text-sm"
            >
              <Fingerprint className="w-4 h-4 mr-2" />
              {t('editProfile')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/login")}
              className="border-gold text-gold hover:bg-gold hover:text-black text-sm"
            >
              {t('backToLogin')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MemberCard;
