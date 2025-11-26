import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, Trophy, Users, Globe, ChevronRight, Calendar, MapPin, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BusinessContentEditor } from "@/components/BusinessContentEditor";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCurrencySymbol } from "@/lib/currencySymbols";

const Business = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [businessContent, setBusinessContent] = useState<any>({});
  const [initialBusinessContent, setInitialBusinessContent] = useState<any>({});
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  const isFieldModified = (fieldName: string): boolean => {
    const currentValue = businessContent[fieldName];
    const initialValue = initialBusinessContent[fieldName];
    
    if ((!currentValue || currentValue === '') && (!initialValue || initialValue === '')) {
      return false;
    }
    
    return currentValue !== initialValue;
  };

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

      // Load business content
      const { data: contentData } = await supabase
        .from('business_content')
        .select('*')
        .eq('user_id', profileId)
        .maybeSingle();

      const defaultContent = {
        company_name: '',
        company_description: '',
        position_title: '',
        achievements_text: '',
        portfolio_text: '',
        vision_text: '',
        company_logo_url: null,
        company_photos: []
      };

      setBusinessContent(contentData || defaultContent);
      
      // Sauvegarder les valeurs initiales seulement si c'est la première fois
      if (!initialBusinessContent.company_name && !contentData?.company_name) {
        setInitialBusinessContent(defaultContent);
      } else if (contentData && Object.keys(initialBusinessContent).length === 0) {
        setInitialBusinessContent(contentData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({ 
        title: "Erreur de chargement", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || isCheckingAccess) {
    return (
      <>
        <div className="min-h-screen bg-black text-gold p-6 flex items-center justify-center">
          <p className="text-gold">{t('loading')}</p>
        </div>
      </>
    );
  }

  if (!isOwnProfile && !hasAccess) {
    return (
      <>
        <div className="min-h-screen bg-black text-gold p-6 flex items-center justify-center">
          <div className="text-center max-w-md">
            <p className="text-gold mb-4">Vous n'avez pas accès à cette section du profil.</p>
            <Button 
              variant="outline" 
              onClick={() => navigate(id ? `/profile/${id}` : "/profile")}
              className="border-gold text-gold hover:bg-gold hover:text-black"
            >
              {t('backToProfile')}
            </Button>
          </div>
        </div>
      </>
    );
  }

  // Formater le patrimoine
  const formatWealth = () => {
    if (!profile.wealth_amount || !profile.wealth_unit || !profile.wealth_currency) {
      return "N/A";
    }
    const amount = Math.round(parseFloat(profile.wealth_amount));
    const unit = profile.wealth_unit;
    const symbol = getCurrencySymbol(profile.wealth_currency);
    return `${amount} ${unit} ${symbol}`;
  };

  const businessProfile = {
    name: `${profile.first_name} ${profile.last_name}`,
    title: profile.honorific_title || profile.job_function || "CEO",
    company: profile.activity_domain || "Entreprise",
    location: "Paris, France",
    netWorth: formatWealth(),
    position: profile.job_function || "Non spécifié",
  };

  return (
    <>
      <div className="min-h-screen bg-black text-gold p-6">
        <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <h1 className="text-4xl font-serif text-gold tracking-wide">PROFIL BUSINESS</h1>
            {isOwnProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditorOpen(true)}
                className="border-gold text-gold hover:bg-gold hover:text-black"
              >
                <Edit className="w-4 h-4 mr-2" />
                {t('edit')}
              </Button>
            )}
          </div>
        </div>

        {/* Main Profile Card */}
        <div className="bg-black/50 border border-gold/20 rounded-lg p-8 mb-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Profile Image and Basic Info */}
            <div className="lg:w-1/3">
              <div className="w-40 h-40 mx-auto mb-6 rounded-full border-2 border-gold overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
                  <span className="text-6xl font-serif">BA</span>
                </div>
              </div>
              
              <div className="text-center lg:text-left">
                <h2 className="text-2xl font-serif text-gold mb-2">{businessProfile.name}</h2>
                <p className="text-gold/80 mb-2">{businessProfile.title}</p>
                <p className="text-gold/80 mb-2">{businessProfile.company}</p>
                <div className="flex items-center justify-center lg:justify-start text-gold/60 mb-4">
                  <MapPin className="w-4 h-4 mr-2" />
                  {businessProfile.location}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="bg-gold/10 rounded-lg p-3">
                    <div className="text-gold/60">Fortune</div>
                    <div className="text-gold font-semibold">{businessProfile.netWorth}</div>
                  </div>
                  <div className="bg-gold/10 rounded-lg p-3">
                    <div className="text-gold/60">Fonction</div>
                    <div className="text-gold font-semibold">{businessProfile.position}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div className="lg:w-2/3">
              {businessContent.company_logo_url && (
                <div className="mb-4">
                  <img src={businessContent.company_logo_url} alt="Logo entreprise" className="h-20 object-contain" />
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-serif text-gold mb-3 flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  {businessContent.company_name || "Activité Professionnelle"}
                </h3>
                
                {businessContent.company_description && (
                  <p className={`text-gold/70 mb-4 ${isFieldModified('company_description') ? 'field-modified' : ''}`}>
                    {businessContent.company_description}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-gold/5 rounded-lg p-4 text-center">
                    <div className={`text-2xl font-bold text-gold ${isFieldModified('position_title') ? 'field-modified' : ''}`}>
                      {businessContent.position_title || businessProfile.title}
                    </div>
                    <div className="text-gold/60 text-sm">Fonction</div>
                  </div>
                  <div className="bg-gold/5 rounded-lg p-4 text-center">
                    <div className={`text-2xl font-bold text-gold ${isFieldModified('company_name') ? 'field-modified' : ''}`}>
                      {businessContent.company_name || businessProfile.company}
                    </div>
                    <div className="text-gold/60 text-sm">Entreprise</div>
                  </div>
                </div>

                {businessContent.achievements_text && (
                  <div className="mb-4">
                    <h4 className="text-lg font-serif text-gold mb-2 flex items-center">
                      <Trophy className="w-4 h-4 mr-2" />
                      Réalisations
                    </h4>
                    <p className={`text-gold/70 text-sm leading-relaxed ${isFieldModified('achievements_text') ? 'field-modified' : ''}`}>
                      {businessContent.achievements_text}
                    </p>
                  </div>
                )}

                {businessContent.portfolio_text && (
                  <div className="mb-4">
                    <h4 className="text-lg font-serif text-gold mb-2">Portfolio</h4>
                    <p className={`text-gold/70 text-sm leading-relaxed ${isFieldModified('portfolio_text') ? 'field-modified' : ''}`}>
                      {businessContent.portfolio_text}
                    </p>
                  </div>
                )}

                {businessContent.vision_text && (
                  <div className="mb-4">
                    <h4 className="text-lg font-serif text-gold mb-2">Vision</h4>
                    <p className={`text-gold/70 text-sm leading-relaxed ${isFieldModified('vision_text') ? 'field-modified' : ''}`}>
                      {businessContent.vision_text}
                    </p>
                  </div>
                )}

                {(!businessContent.company_description && !businessContent.achievements_text) && (
                  <p className="text-gold/70 text-sm leading-relaxed">
                    Membre actif du réseau Aurora. {profile.is_founder ? "Membre fondateur." : ""} {profile.is_patron ? "Patron philanthrope." : ""}
                  </p>
                )}
              </div>

              {businessContent.company_photos && businessContent.company_photos.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-serif text-gold mb-3">Photos de l'entreprise</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {businessContent.company_photos.map((photo: string, index: number) => (
                      <img key={index} src={photo} alt={`Photo ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => navigate(id ? `/profile/${id}` : "/profile")}
            className="border-gold text-gold hover:bg-gold hover:text-black"
          >
            Retour au profil
          </Button>
        </div>
      </div>

      <BusinessContentEditor
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        content={businessContent}
        onSave={loadProfile}
      />
      </div>
    </>
  );
};

export default Business;