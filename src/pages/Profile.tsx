import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, Heart, Globe, Settings, Crown, Gem, LogOut, Edit } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ConnectionRequests } from "@/components/ConnectionRequests";
import { WealthBadge } from "@/components/WealthBadge";

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
        toast.error("Erreur lors du chargement du profil");
      } else if (profileData) {
        console.log('[Profile] Profile loaded successfully');
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

      toast.success("Profil actualisé");
      setLoading(false);
    };

    loadProfile();
  }, [id, navigate, location.pathname]);


  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erreur lors de la déconnexion");
    } else {
      toast.success("Déconnexion réussie");
      navigate("/login");
    }
  };

  const profileSections = [
    {
      title: t('business'),
      icon: Briefcase,
      route: "/business",
      items: businessContent ? [
        businessContent.company_name || "Entreprise",
        businessContent.position_title || "Position",
        businessContent.achievements_text?.substring(0, 50) || "Réalisations"
      ] : ["Aucune information renseignée"]
    },
    {
      title: t('familySocial'),
      icon: Heart,
      route: "/family",
      items: familyContent ? [
        familyContent.family_text?.substring(0, 50) || "Famille",
        familyContent.philanthropy_text?.substring(0, 50) || "Philanthropie",
        familyContent.network_text?.substring(0, 50) || "Réseau"
      ] : ["Aucune information renseignée"]
    },
    {
      title: t('personal'),
      icon: Crown,
      route: "/personal",
      items: [
        artworks.length > 0 ? `${artworks.length} œuvre(s) d'art` : "Collection d'art",
        sportsHobbies.length > 0 ? sportsHobbies.map(h => h.title).join(', ').substring(0, 50) : "Passions",
        destinations.length > 0 ? `${destinations.length} destination(s)` : "Destinations"
      ],
      subsections: true
    },
    {
      title: t('influenceNetwork'),
      icon: Globe,
      route: "/network",
      items: ["Réseaux Sociaux", "Médias & Couverture Presse", "Philanthropie & Engagement"]
    },
    {
      title: t('integratedServices'),
      icon: Settings,
      route: "/services",
      items: ["Concierge", "Immersive Metaverse", "Marketplace"]
    },
    {
      title: t('members'),
      icon: Users,
      route: "/members",
      items: ["Répertoire des membres", "Profils détaillés", "Réseau exclusif"]
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-gold p-6 flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-gold p-6 flex items-center justify-center">
        <p>Profil non trouvé</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gold px-4 sm:px-6 py-6 safe-area-all">
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
          {profile.job_function && <p className="text-gold/80 text-sm sm:text-base mb-1">{profile.job_function}</p>}
          {profile.activity_domain && <p className="text-gold/80 text-sm sm:text-base mb-1">{profile.activity_domain}</p>}
          {profile.country && (
            <p className="text-gold/80 mb-4 flex items-center justify-center gap-2 text-sm sm:text-base">
              <Globe className="w-4 h-4" />
              {profile.country}
            </p>
          )}
          
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
              className={`bg-black/50 border border-gold/20 rounded-lg p-6 hover:border-gold/40 transition-all duration-300 ${section.title !== "INTEGRATED SERVICES" ? 'cursor-pointer' : ''}`}
              onClick={() => section.title !== "INTEGRATED SERVICES" && navigate(id ? `${section.route}/${id}` : section.route)}
            >
              <div className="flex items-center mb-4">
                <section.icon className="w-6 h-6 text-gold mr-3" />
                <h3 className="text-lg font-semibold text-gold">{section.title}</h3>
              </div>
              
              {section.title === "INTEGRATED SERVICES" ? (
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
              
              {section.title === "BUSINESS" && (
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gold/20">
                  <div className="text-xs text-gold/60">Forbes 30</div>
                  <div className="text-xs text-gold/60">EY</div>
                  <div className="text-xs text-gold/60">Harvard MBA</div>
                </div>
              )}
              
              {section.title === "MEMBRES" && (
                <div className="flex items-center mt-4 pt-4 border-t border-gold/20">
                  <Users className="w-4 h-4 text-gold mr-2" />
                  <span className="text-xs text-gold/60">EXCLUSIF</span>
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
              className="border-gold/40 text-gold hover:bg-gold hover:text-black"
            >
              <Edit className="mr-2 h-4 w-4" />
              Modifier le profil
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-gold/40 text-gold hover:bg-gold hover:text-black"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Quitter
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
              Quitter
            </Button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;