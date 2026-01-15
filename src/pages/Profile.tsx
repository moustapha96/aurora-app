import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, Heart, Globe, Settings, Crown, Gem, LogOut, Edit } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ConnectionRequests } from "@/components/ConnectionRequests";
import { WealthBadge } from "@/components/WealthBadge";
import { Header } from "@/components/Header";
import { PageNavigation } from "@/components/BackButton";
import { IdentityVerifiedBadge } from "@/components/VerificationBadge";
import { Skeleton } from "@/components/ui/skeleton";

const Profile = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { id } = useParams();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [privateData, setPrivateData] = useState<any>(null);
  const [businessContent, setBusinessContent] = useState<any>(null);
  const [familyContent, setFamilyContent] = useState<any>(null);
  const [sportsHobbies, setSportsHobbies] = useState<any[]>([]);
  const [artworks, setArtworks] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Load profile data - reloads when returning to this page
  useEffect(() => {
    console.log('[Profile] Mounting/Updating - location:', location.pathname, 'id:', id);
    setLoading(true);
    
    const loadProfile = async () => {
      console.log('[Profile] Starting to load profile data...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('[Profile] No user found, redirecting to login');
        navigate("/login");
        return;
      }

      // Use id from URL if present, otherwise use current user's id
      const profileId = id || user.id;
      const isOwn = profileId === user.id;
      setIsOwnProfile(isOwn);
      console.log('[Profile] Loading profile for ID:', profileId, 'isOwn:', isOwn);
      
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();

      if (profileError) {
        console.error('[Profile] Error loading profile:', profileError);
        toast.error(t('errorLoadingProfile'));
      } else if (profileData) {
        console.log('[Profile] Profile loaded successfully');
        // Add cache-buster to avatar URL for fresh display
        if (profileData.avatar_url) {
          const cleanUrl = profileData.avatar_url.split('?')[0];
          profileData.avatar_url = `${cleanUrl}?t=${Date.now()}`;
        }
        setProfile(profileData);
      }

      // Load private data only for own profile
      if (isOwn) {
        const { data: privData } = await supabase
          .from('profiles_private')
          .select('*')
          .eq('user_id', profileId)
          .maybeSingle();
        setPrivateData(privData);
      }

      // Load business content
      const { data: businessData } = await supabase
        .from('business_content')
        .select('*')
        .eq('user_id', profileId)
        .maybeSingle();
      
      if (businessData) {
        console.log('[Profile] Business content loaded');
        setBusinessContent(businessData);
      }

      // Load family content
      const { data: familyData } = await supabase
        .from('family_content')
        .select('*')
        .eq('user_id', profileId)
        .maybeSingle();
      
      if (familyData) {
        console.log('[Profile] Family content loaded');
        setFamilyContent(familyData);
      }

      // Load sports & hobbies
      const { data: sportsData } = await supabase
        .from('sports_hobbies')
        .select('*')
        .eq('user_id', profileId)
        .order('display_order', { ascending: true });
      
      if (sportsData) {
        console.log('[Profile] Sports & hobbies loaded:', sportsData.length);
        setSportsHobbies(sportsData);
      }

      // Load artwork collection
      const { data: artData } = await supabase
        .from('artwork_collection')
        .select('*')
        .eq('user_id', profileId)
        .order('display_order', { ascending: true });
      
      if (artData) {
        console.log('[Profile] Artworks loaded:', artData.length);
        setArtworks(artData);
      }

      // Load destinations
      const { data: destData } = await supabase
        .from('destinations')
        .select('*')
        .eq('user_id', profileId)
        .order('display_order', { ascending: true });
      
      if (destData) {
        console.log('[Profile] Destinations loaded:', destData.length);
        setDestinations(destData);
      }

      toast.success(t('profileRefreshed'));
      setLoading(false);
    };

    loadProfile();
  }, [id, navigate, location.pathname]);

  // Listen for avatar updates from other components
  useEffect(() => {
    const handleAvatarUpdate = (event: CustomEvent<{ avatarUrl: string; userId: string }>) => {
      if (profile && (profile.id === event.detail.userId || (!id && isOwnProfile))) {
        // Add cache-buster to ensure fresh image
        const cleanUrl = event.detail.avatarUrl.split('?')[0];
        const avatarUrlWithCache = `${cleanUrl}?t=${Date.now()}`;
        setProfile((prev: any) => ({ ...prev, avatar_url: avatarUrlWithCache }));
      }
    };

    window.addEventListener('avatar-updated', handleAvatarUpdate as EventListener);
    return () => {
      window.removeEventListener('avatar-updated', handleAvatarUpdate as EventListener);
    };
  }, [profile, id, isOwnProfile]);


  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(t('logoutError'));
    } else {
      toast.success(t('logoutSuccess'));
      navigate("/login");
    }
  };

  const profileSections = [
    {
      title: t('business'),
      icon: Briefcase,
      route: "/business",
      items: businessContent ? [
        businessContent.company_name || t('business'),
        businessContent.position_title || t('position'),
        businessContent.achievements_text?.substring(0, 50) || t('noInfoProvided')
      ] : [t('noInfoProvided')]
    },
    {
      title: t('familySocial'),
      icon: Heart,
      route: "/family",
      items: familyContent ? [
        familyContent.family_text?.substring(0, 50) || t('family'),
        familyContent.philanthropy_text?.substring(0, 50) || t('philanthropyEngagement'),
        familyContent.network_text?.substring(0, 50) || t('exclusiveNetwork')
      ] : [t('noInfoProvided')]
    },
    {
      title: t('personal'),
      icon: Crown,
      route: "/personal",
      items: [
        artworks.length > 0 ? `${artworks.length} ${t('artworkCount')}` : t('artCollection'),
        sportsHobbies.length > 0 ? sportsHobbies.map(h => h.title).join(', ').substring(0, 50) : t('passions'),
        destinations.length > 0 ? `${destinations.length} ${t('destinationCount')}` : t('destinations')
      ],
      subsections: true
    },
    {
      title: t('influenceNetwork'),
      icon: Globe,
      route: "/network",
      items: [t('socialNetworks'), t('mediaPressCoverage'), t('philanthropyEngagement')]
    },
    {
      title: t('integratedServices'),
      icon: Settings,
      route: "/services",
      items: [t('concierge'), t('immersiveMetaverse'), t('marketplace')]
    },
    {
      title: t('members'),
      icon: Users,
      route: "/members",
      items: [t('memberDirectory'), t('detailedProfiles'), t('exclusiveNetwork')]
    }
  ];

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-black text-gold p-6 pt-32 sm:pt-36 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      </>
    );
  }

 

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

  return (
    <>
      <Header />
      <PageNavigation to="/member-card" />
      <div className="min-h-screen bg-black text-gold px-4 sm:px-6 pt-32 sm:pt-36 pb-6 safe-area-all">
        {/* Header with Profile */}
        <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 rounded-full border-2 border-gold overflow-hidden relative">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={`${profile.first_name} ${profile.last_name}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
                <span className="text-3xl sm:text-4xl font-serif">{profile.first_name?.[0] || 'U'}</span>
              </div>
            )}
            
            {/* Identity Verified Badge */}
            {/* <IdentityVerifiedBadge isVerified={profile.identity_verified} /> */}
            
            {isOwnProfile && privateData && (
              <WealthBadge 
                wealthBillions={privateData.wealth_billions}
                wealthAmount={privateData.wealth_amount}
                wealthUnit={privateData.wealth_unit}
                wealthCurrency={privateData.wealth_currency}
              />
            )}
          </div>
          
          {profile.honorific_title && (
            <p className="text-lg sm:text-xl font-serif text-gold/90 mb-2">{profile.honorific_title}</p>
          )}
          <h1 className="text-2xl sm:text-3xl font-serif text-gold mb-1">{profile.first_name?.toUpperCase() || ''}</h1>
          <h2 className="text-2xl sm:text-3xl font-serif text-gold mb-2">{profile.last_name?.toUpperCase() || ''}</h2>
          {/* {profile.account_number && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(profile.account_number);
                toast.success(t('accountNumberCopied'));
              }}
              className="text-gold/70 text-xs sm:text-sm mb-2 font-mono tracking-wider hover:text-gold transition-colors cursor-pointer flex items-center gap-1 mx-auto"
              title={t('clickToCopy')}
            >
              {t('accountNumber')}: {profile.account_number}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          )}
          {profile.job_function && <p className="text-gold/80 text-sm sm:text-base mb-1">{profile.job_function}</p>}
          {profile.activity_domain && <p className="text-gold/80 text-sm sm:text-base mb-1">{profile.activity_domain}</p>}
          {profile.country && (
            <p className="text-gold/80 mb-4 flex items-center justify-center gap-2 text-sm sm:text-base">
              <Globe className="w-4 h-4" />
              {profile.country}
            </p>
          )} */}
          
          {profile.personal_quote && (
            <p className="text-gold/70 italic text-xs sm:text-sm max-w-md mx-auto">
              "{profile.personal_quote}"
            </p>
          )}
        </div>

        {/* Connection Requests Section - Only for own profile */}
        {!id && (
          <div className="mb-6 sm:mb-8">
            <ConnectionRequests />
          </div>
        )}

        {/* Profile Sections Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {profileSections.map((section, index) => (
            <div
              key={index}
              className={`bg-black/50 border border-gold/20 rounded-lg p-6 hover:border-gold/40 transition-all duration-300 $              {section.title !== t('integratedServices') ? 'cursor-pointer' : ''}`}
              onClick={() => section.title !== t('integratedServices') && navigate(id ? `${section.route}/${id}` : section.route)}
            >
              <div className="flex items-center mb-4">
                <section.icon className="w-6 h-6 text-gold mr-3" />
                <h3 className="text-lg font-semibold text-gold">{section.title}</h3>
              </div>
              
              {section.title === t('integratedServices') ? (
                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    className="border-gold/40 text-gold hover:bg-gold hover:text-black w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/concierge');
                    }}
                  >
                    {t('concierge')}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gold/40 text-gold hover:bg-gold hover:text-black w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/metaverse');
                    }}
                  >
                    {t('metaverse')}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gold/40 text-gold hover:bg-gold hover:text-black w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/marketplace');
                    }}
                  >
                    {t('marketplace')}
                  </Button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-gold/70 text-sm flex items-start">
                      <span className="text-gold mr-2">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              
              {section.title === t('business') && (
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gold/20">
                  <div className="text-xs text-gold/60">{t('forbes30')}</div>
                  <div className="text-xs text-gold/60">{t('ey')}</div>
                  <div className="text-xs text-gold/60">{t('harvardMBA')}</div>
                </div>
              )}
              
              {section.title === t('members') && (
                <div className="flex items-center mt-4 pt-4 border-t border-gold/20">
                  <Users className="w-4 h-4 text-gold mr-2" />
                  <span className="text-xs text-gold/60">{t('exclusive')}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Edit Profile and Logout Buttons - Only for own profile */}
        {!id && (
          <div className="mt-8 flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/edit-profile")}
              className="border-gold/40 text-gold hover:bg-gold hover:text-black h-9 sm:h-10 px-2 sm:px-4"
            >
              <Edit className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('editProfileBtn')}</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-gold/40 text-gold hover:bg-gold hover:text-black h-9 sm:h-10 px-2 sm:px-4"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('quitBtn')}</span>
            </Button>
          </div>
        )}
        
        {/* Logout Button Only - For viewing other profiles */}
        {id && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-gold/40 text-gold hover:bg-gold hover:text-black"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t('quitBtn')}
            </Button>
          </div>
        )}

      </div>
    </div>
    </>
  );
};

export default Profile;