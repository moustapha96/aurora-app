import React, { useEffect, useState, useRef } from "react";
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
import { PageNavigation } from "@/components/BackButton";
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
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [businessContent, setBusinessContent] = useState<any>(null);
  const [familyContent, setFamilyContent] = useState<any>(null);
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
        loadFamilyContent()
      ]);
      done(); // Signal progress bar completion after ALL data is loaded
    };
    loadAllData();
  }, []);


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
    if (!user) {
      console.log('[MemberCard] No user found for business content');
      return;
    }

    console.log('[MemberCard] Loading business content for user:', user.id);

    const { data, error } = await supabase
      .from('business_content')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[MemberCard] Error loading business content:', error);
      return;
    }

    console.log('[MemberCard] Business content loaded:', data);
    setBusinessContent(data);
  };

  const loadFamilyContent = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('family_content')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[MemberCard] Error loading family content:', error);
      return;
    }

    setFamilyContent(data);
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

    setPrivateData(privData);

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

        // Proceed with upload
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error(t('notAuthenticated'));

          const fileExt = file.name.split('.').pop();
          const filePath = `${user.id}/avatar.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

          // Add cache-buster to force refresh everywhere
          const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

          const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: cacheBustedUrl })
            .eq('id', user.id);

          if (updateError) throw updateError;

          setProfile({ ...profile, avatar_url: cacheBustedUrl });

          // Dispatch custom event to notify other components of avatar change
          window.dispatchEvent(new CustomEvent('avatar-updated', {
            detail: { avatarUrl: cacheBustedUrl, userId: user.id }
          }));

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
      items: businessContent ? [
        businessContent.company_name || t('notProvided'),
        businessContent.position_title || t('notProvided'),
        businessContent.achievements || t('notProvided')
      ] : [t('clickToAddBusiness')]
    },
    {
      title: t('familySocial'),
      icon: Heart,
      route: "/family",
      items: familyContent ? [
        familyContent.family_text?.substring(0, 50) || t('family'),
        familyContent.philanthropy_text?.substring(0, 50) || t('philanthropy'),
        familyContent.network_text?.substring(0, 50) || t('network')
      ].filter(item => item !== t('family') && item !== t('philanthropy') && item !== t('network') || familyContent.family_text || familyContent.philanthropy_text || familyContent.network_text)
        : [t('clickToAddFamily')]
    },
    {
      title: t('personal'),
      icon: Users,
      route: "/personal",
      items: [t('artCollections'), t('sportsActivities'), t('travelDestinationsLabel'), t('socialInfluenceLabel')]
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
      items: [t('memberDirectory'), t('detailedProfiles'), t('exclusiveNetwork')]
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
                <div key={index} className="bg-black/50 border border-gold/20 rounded-lg p-4 sm:p-6">
                  <div className="flex items-center mb-4">
                    <Skeleton className="w-6 h-6 rounded bg-gold/10 mr-3" />
                    <Skeleton className="h-5 w-32 bg-gold/10" />
                  </div>
                  <div className="space-y-2">
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
      <PageNavigation to="/profile" />
      {/* WebAuthn Biometric Prompt - shows when biometrics available but not enabled */}
      {currentUserId && currentUserEmail && (
        <WebAuthnPrompt
          userId={currentUserId}
          userEmail={currentUserEmail}
        />
      )}
      <div className="min-h-screen bg-black text-gold px-4 sm:px-6 pt-32 sm:pt-36 pb-8 safe-area-all">
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
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={t('avatarPreview')}
                    className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
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
              <IdentityVerifiedBadge isVerified={profile.identity_verified} />

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

            {profile.account_number && (
              <div className="text-xs sm:text-sm text-gold/60 font-mono tracking-wider">
                {profile.account_number}
              </div>
            )}


          </div>

          {/* Profile Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {profileSections.map((section, index) => (
              <div key={index} className="relative">
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
                  className="bg-black/50 border border-gold/20 rounded-lg p-4 sm:p-6 hover:border-gold/40 transition-all duration-300 cursor-pointer"
                  onClick={() => section.title !== t('integratedServices') && navigate(section.route)}
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center">
                      <section.icon className="w-5 h-5 sm:w-6 sm:h-6 text-gold mr-2 sm:mr-3 flex-shrink-0" />
                      <h3 className="text-base sm:text-lg font-semibold text-gold">{section.title}</h3>
                    </div>
                   
                  </div>

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
                    <ul className="space-y-1.5 sm:space-y-2">
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-gold/70 text-xs sm:text-sm flex items-start">
                          <span className="text-gold mr-2">•</span>
                          <span className="line-clamp-2">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.title === t('business') && (
                    <div className="flex items-center gap-2 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gold/20 flex-wrap">
                      <div className="text-xs text-gold/60">{t('forbes30')}</div>
                      <div className="text-xs text-gold/60">{t('ey')}</div>
                      <div className="text-xs text-gold/60">{t('harvardMBA')}</div>
                    </div>
                  )}

                  {section.title === t('members') && (
                    <div className="flex items-center mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gold/20">
                      <Users className="w-4 h-4 text-gold mr-2" />
                      <span className="text-xs text-gold/60">{t('exclusiveLabel')}</span>
                    </div>
                  )}
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
