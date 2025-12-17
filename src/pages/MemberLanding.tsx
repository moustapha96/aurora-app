import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LandingClassic, LandingLuxury, LandingMinimal, LandingTemplate } from "@/components/landing-templates";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
    toast.info("Pour contacter ce membre, veuillez vous connecter à Aurora Society");
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
          <h1 className="text-2xl font-bold text-foreground mb-2">Membre introuvable</h1>
          <p className="text-muted-foreground">Ce profil n'existe pas ou n'est plus disponible.</p>
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
  };

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

export default MemberLanding;
