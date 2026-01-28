import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LandingClassic, LandingLuxury, LandingMinimal, LandingTemplate } from "@/components/landing-templates";
import { AuroraLogo } from "@/components/AuroraLogo";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Crown } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface MemberData {
  first_name: string;
  last_name: string;
  avatar_url?: string;
  country?: string;
  activity_domain?: string;
  job_function?: string;
  personal_quote?: string;
  wealth_billions?: string;
}

interface LandingPreferences {
  template: LandingTemplate;
  show_contact_button: boolean;
  show_wealth_badge: boolean;
  show_location: boolean;
  show_quote: boolean;
  custom_headline: string | null;
  custom_description: string | null;
}

const MemberLanding = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [member, setMember] = useState<MemberData | null>(null);
  const [preferences, setPreferences] = useState<LandingPreferences>({
    template: 'classic',
    show_contact_button: true,
    show_wealth_badge: true,
    show_location: true,
    show_quote: true,
    custom_headline: null,
    custom_description: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!memberId) {
        console.log('No memberId provided');
        setLoading(false);
        return;
      }

      console.log('Fetching landing page for memberId:', memberId);

      try {
        // Fetch member profile (public data only)
        const { data: memberData, error: memberError } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url, country, activity_domain, job_function, personal_quote')
          .eq('id', memberId)
          .maybeSingle();

        console.log('Profile query result:', { memberData, memberError });

        if (memberError) {
          console.error('Error fetching member:', memberError);
          setLoading(false);
          return;
        }

        if (!memberData) {
          console.log('No member data found for id:', memberId);
          setLoading(false);
          return;
        }

        // For landing pages, wealth display is optional and user-controlled
        // We set it to undefined - the user can't show wealth on public pages for security
        setMember({ ...memberData, wealth_billions: undefined });

        // Fetch landing preferences
        const { data: prefsData, error: prefsError } = await supabase
          .from('landing_preferences')
          .select('*')
          .eq('user_id', memberId)
          .maybeSingle();

        console.log('Preferences query result:', { prefsData, prefsError });

        if (prefsError) {
          console.error('Error fetching preferences:', prefsError);
        } else if (prefsData) {
          setPreferences({
            template: (prefsData.template as LandingTemplate) || 'classic',
            show_contact_button: prefsData.show_contact_button ?? true,
            show_wealth_badge: prefsData.show_wealth_badge ?? true,
            show_location: prefsData.show_location ?? true,
            show_quote: prefsData.show_quote ?? true,
            custom_headline: prefsData.custom_headline,
            custom_description: prefsData.custom_description,
          });
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [memberId]);

  const handleContact = () => {
    toast.info(t('contactMemberLoginRequired'));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('memberNotFound')}</h1>
          <p className="text-muted-foreground">{t('profileNotAvailable')}</p>
        </div>
      </div>
    );
  }

  // Apply custom content if set
  const displayMember: MemberData = {
    ...member,
    first_name: preferences.custom_headline ? '' : member.first_name,
    last_name: preferences.custom_headline || member.last_name,
    job_function: preferences.custom_description || member.job_function,
    country: preferences.show_location ? member.country : undefined,
    personal_quote: preferences.show_quote ? member.personal_quote : undefined,
    wealth_billions: preferences.show_wealth_badge ? member.wealth_billions : undefined,
  };

  const commonProps = {
    member: displayMember,
    onContact: preferences.show_contact_button ? handleContact : undefined,
    showContactButton: preferences.show_contact_button,
    hideHeader: true,
  };

  const LandingContent = () => {
    switch (preferences.template) {
      case 'luxury':
        return <LandingLuxury {...commonProps} />;
      case 'minimal':
        return <LandingMinimal {...commonProps} />;
      case 'classic':
      default:
        return <LandingClassic {...commonProps} />;
    }
  };

  const backLabel = t('back') || 'Retour';
  const headerBadge =
    preferences.template === 'luxury' ? (
      <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
        <Crown className="h-3 w-3" />
        Elite Member
      </Badge>
    ) : (
      <Badge variant="outline" className="text-xs">
        Membre Aurora Society
      </Badge>
    );

  return (
    <div className="min-h-screen">
      {/* Header : retour à gauche, logo au centre, badge à droite */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between h-14 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate('/landing-preview')}
            className="flex items-center gap-2 text-foreground hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg transition-opacity min-w-[2.5rem]"
            aria-label={backLabel}
          >
            <ArrowLeft className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium hidden sm:inline">{backLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/landing-preview')}
            className="flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg transition-opacity hover:opacity-80 absolute left-1/2 -translate-x-1/2"
            aria-label={backLabel}
          >
            <AuroraLogo size="sm" />
          </button>
          <div className="min-w-[2.5rem] flex justify-end">
            {headerBadge}
          </div>
        </div>
      </header>
      <LandingContent />
    </div>
  );
};

export default MemberLanding;
