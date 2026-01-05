import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WealthBadge } from "@/components/WealthBadge";
import { useLanguage } from "@/contexts/LanguageContext";

const LinkedAccount = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [familyContent, setFamilyContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user && !id) {
        // Mode prévisualisation pour permettre de voir la fiche sans connexion
        setIsPreview(true);
        setProfile({
          first_name: t('previewFirstName'),
          last_name: t('previewLastName'),
          honorific_title: t('previewTitle'),
          job_function: t('previewJobFunction'),
          is_founder: true,
          is_patron: true,
          personal_quote: t('previewQuote'),
          wealth_billions: "2",
          wealth_amount: "2",
          wealth_unit: "Mds",
          wealth_currency: "EUR",
          avatar_url: null,
        });
        setFamilyContent({
          family_text: t('previewFamilyText'),
          philanthropy_text: t('previewPhilanthropyText'),
          network_text: t('previewNetworkText'),
        });
        setLoading(false);
        return;
      }

      if (!user && id) {
        navigate("/login");
        return;
      }

      const profileId = id || user.id;
      
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        toast.error(t('errorLoadingProfile'));
      } else if (profileData) {
        setProfile(profileData);
      }

      // Load family content
      const { data: familyData } = await supabase
        .from('family_content')
        .select('*')
        .eq('user_id', profileId)
        .maybeSingle();
      
      if (familyData) {
        setFamilyContent(familyData);
      }

      setLoading(false);
    };

    loadProfile();
  }, [id, navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(t('logoutError'));
    } else {
      toast.success(t('logoutSuccess'));
      navigate("/login");
    }
  };

  const accountSections = [
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
      title: t('integratedServices'),
      icon: Settings,
      route: "/services",
      items: [t('conciergePage'), t('metaversePage'), t('marketplacePage')],
      subsections: [
        { name: t('conciergePage'), route: "/concierge" },
        { name: t('metaversePage'), route: "/metaverse" },
        { name: t('marketplacePage'), route: "/marketplace" }
      ]
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-gold p-6 flex items-center justify-center">
        <p>{t('loading')}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-gold p-6 flex items-center justify-center">
        <p>{t('accountNotFound')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gold p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-full bg-gold/20 flex items-center justify-center overflow-hidden border-2 border-gold/30">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={`${profile.first_name} ${profile.last_name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl text-gold/60">
                  {profile.first_name?.[0]}{profile.last_name?.[0]}
                </span>
              )}
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl font-serif text-gold">
              {profile.honorific_title && `${profile.honorific_title} `}
              {profile.first_name} {profile.last_name}
            </h1>
            {profile.job_function && (
              <p className="text-gold/70 mt-2">{profile.job_function}</p>
            )}
          </div>

          <div className="flex justify-center gap-3 flex-wrap">
            {profile.is_founder && (
              <span className="px-3 py-1 rounded-full bg-gold/20 text-gold text-sm border border-gold/30">
                {t('founderLabel')}
              </span>
            )}
            {profile.is_patron && (
              <span className="px-3 py-1 rounded-full bg-gold/20 text-gold text-sm border border-gold/30">
                {t('patronLabel')}
              </span>
            )}
            {profile.wealth_billions && (
              <WealthBadge 
                wealthBillions={profile.wealth_billions}
                wealthAmount={profile.wealth_amount}
                wealthUnit={profile.wealth_unit}
                wealthCurrency={profile.wealth_currency}
              />
            )}
          </div>

          {profile.personal_quote && (
            <p className="text-gold/60 italic max-w-2xl mx-auto mt-4">
              "{profile.personal_quote}"
            </p>
          )}
        </div>

        {/* Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {accountSections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.title}
                className="bg-black/60 backdrop-blur-md rounded-lg p-6 border border-gold/20 hover:border-gold/40 transition-all cursor-pointer group"
                onClick={() => {
                  if (section.subsections) return;
                  navigate(section.route);
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Icon className="w-6 h-6 text-gold" />
                  <h2 className="text-xl font-serif text-gold">{section.title}</h2>
                </div>
                
                {section.subsections ? (
                  <div className="space-y-2">
                    {section.subsections.map((subsection) => (
                      <button
                        key={subsection.name}
                        onClick={() => navigate(subsection.route)}
                        className="w-full text-left px-4 py-2 rounded bg-gold/10 hover:bg-gold/20 transition-colors text-gold/80 hover:text-gold"
                      >
                        {subsection.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-2 text-gold/70">
                    {section.items.map((item, idx) => (
                      <li key={idx} className="text-sm">
                        • {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {!isPreview && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-gold/30 text-gold hover:bg-gold/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t('logout')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkedAccount;
