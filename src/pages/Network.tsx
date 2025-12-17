import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { RefreshCw, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  NetworkOnboarding,
  NetworkMedia,
  NetworkEvents,
  NetworkInfluence,
  NetworkLifestyle,
  NetworkPortfolio,
  NetworkAmbitions
} from "@/components/network";
import { PageNavigation } from "@/components/BackButton";

const Network = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  
  const [mediaData, setMediaData] = useState<any[]>([]);
  const [eventsData, setEventsData] = useState<any[]>([]);
  const [influenceData, setInfluenceData] = useState<any[]>([]);
  const [philanthropyData, setPhilanthropyData] = useState<any[]>([]);
  const [portfolioData, setPortfolioData] = useState<any[]>([]);
  const [ambitionsData, setAmbitionsData] = useState<any[]>([]);

  useEffect(() => {
    checkAuthAndLoadData();
  }, [id]);

  const checkAuthAndLoadData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const targetUserId = id || user.id;
      const isOwn = targetUserId === user.id;
      setIsOwnProfile(isOwn);

      if (!isOwn) {
        const { data: friendship } = await supabase
          .from('friendships')
          .select('influence_access')
          .or(`and(user_id.eq.${user.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${user.id})`)
          .single();

        if (friendship?.influence_access) {
          setHasAccess(true);
        } else {
          setHasAccess(false);
          setIsLoading(false);
          return;
        }
      } else {
        setHasAccess(true);
      }

      // Check onboarding status
      const { data: networkContent } = await supabase
        .from('network_content')
        .select('onboarding_completed')
        .eq('user_id', targetUserId)
        .single();

      setOnboardingCompleted(networkContent?.onboarding_completed || false);

      await loadModulesData(targetUserId);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadModulesData = async (userId: string) => {
    const [media, events, influence, philanthropy, portfolio, ambitions] = await Promise.all([
      supabase.from('network_media').select('*').eq('user_id', userId).order('display_order'),
      supabase.from('network_events').select('*').eq('user_id', userId).order('display_order'),
      supabase.from('network_influence').select('*').eq('user_id', userId).order('display_order'),
      supabase.from('network_philanthropy').select('*').eq('user_id', userId).order('display_order'),
      supabase.from('network_clubs').select('*').eq('user_id', userId).eq('club_type', 'portfolio').order('display_order'),
      supabase.from('network_ambitions').select('*').eq('user_id', userId).order('display_order')
    ]);

    setMediaData(media.data || []);
    setEventsData(events.data || []);
    setInfluenceData(influence.data || []);
    setPhilanthropyData(philanthropy.data || []);
    setPortfolioData(portfolio.data || []);
    setAmbitionsData(ambitions.data || []);
  };

  const handleOnboardingSelect = async (mode: string, importedData?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // If we have imported data from CV, save it to the database
      if (mode === 'import' && importedData) {
        const savePromises = [];

        // Save media entries
        if (importedData.media?.length > 0) {
          const mediaEntries = importedData.media.map((item: any, index: number) => ({
            user_id: user.id,
            title: item.title || 'Sans titre',
            platform: item.platform || '',
            description: item.description || '',
            url: item.url || '',
            display_order: index
          }));
          savePromises.push(supabase.from('network_media').insert(mediaEntries));
        }

        // Save events entries
        if (importedData.events?.length > 0) {
          const eventsEntries = importedData.events.map((item: any, index: number) => ({
            user_id: user.id,
            title: item.title || 'Sans titre',
            event_type: item.event_type || '',
            location: item.location || '',
            date: item.date || '',
            description: item.description || '',
            display_order: index
          }));
          savePromises.push(supabase.from('network_events').insert(eventsEntries));
        }

        // Save influence entries
        if (importedData.influence?.length > 0) {
          const influenceEntries = importedData.influence.map((item: any, index: number) => ({
            user_id: user.id,
            title: item.title || 'Sans titre',
            category: item.category || '',
            metric: item.metric || '',
            value: item.value || '',
            description: item.description || '',
            display_order: index
          }));
          savePromises.push(supabase.from('network_influence').insert(influenceEntries));
        }

        // Save philanthropy entries
        if (importedData.philanthropy?.length > 0) {
          const philanthropyEntries = importedData.philanthropy.map((item: any, index: number) => ({
            user_id: user.id,
            title: item.title || 'Sans titre',
            organization: item.organization || '',
            role: item.role || '',
            cause: item.cause || '',
            description: item.description || '',
            display_order: index
          }));
          savePromises.push(supabase.from('network_philanthropy').insert(philanthropyEntries));
        }

        // Save clubs entries
        if (importedData.clubs?.length > 0) {
          const clubsEntries = importedData.clubs.map((item: any, index: number) => ({
            user_id: user.id,
            title: item.title || 'Sans titre',
            club_type: item.club_type || '',
            role: item.role || '',
            since_year: item.since_year || '',
            description: item.description || '',
            display_order: index
          }));
          savePromises.push(supabase.from('network_clubs').insert(clubsEntries));
        }

        // Save ambitions entries
        if (importedData.ambitions?.length > 0) {
          const ambitionsEntries = importedData.ambitions.map((item: any, index: number) => ({
            user_id: user.id,
            title: item.title || 'Sans titre',
            category: item.category || '',
            timeline: item.timeline || '',
            description: item.description || '',
            display_order: index
          }));
          savePromises.push(supabase.from('network_ambitions').insert(ambitionsEntries));
        }

        // Execute all saves
        await Promise.all(savePromises);
      }

      const { error } = await supabase
        .from('network_content')
        .upsert({
          user_id: user.id,
          onboarding_mode: mode,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setOnboardingCompleted(true);
      
      // Reload the data
      await loadModulesData(user.id);
      
      if (mode === 'import' && importedData) {
        toast.success("Données importées avec succès");
      } else if (mode === 'ai') {
        toast.info("Vous pouvez maintenant utiliser les suggestions Aurora dans chaque module");
      } else if (mode === 'concierge') {
        toast.info("Un conseiller vous contactera prochainement");
      } else {
        toast.success("Configuration sauvegardée");
      }
    } catch (error) {
      console.error('Error saving onboarding:', error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleResetOnboarding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('network_content')
        .update({ onboarding_completed: false })
        .eq('user_id', user.id);

      if (error) throw error;
      setOnboardingCompleted(false);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  };

  const refreshData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await loadModulesData(id || user.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isOwnProfile && !hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-6 pt-32 pb-16 text-center">
          <h1 className="text-3xl font-serif text-primary mb-4">Accès restreint</h1>
          <p className="text-muted-foreground mb-8">
            Vous n'avez pas accès à cette section du profil.
          </p>
          <Button onClick={() => navigate(-1)}>Retour</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-area-all">
      <Header />
      <PageNavigation to="/profile" />
      
      {/* Sticky Sub-Header */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="hidden sm:block w-20" />
          <div className="text-center flex-1">
            <h2 className="text-base sm:text-lg font-serif text-primary">Réseaux, Influence & Lifestyle</h2>
            <p className="text-muted-foreground/70 text-xs hidden sm:block">Un réseau privé, humain et efficace — Sans recherche libre, sans exposition</p>
          </div>
          {isOwnProfile && onboardingCompleted && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetOnboarding}
              className="gap-2 self-center sm:self-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Reconfigurer
            </Button>
          )}
          {!isOwnProfile && <div className="hidden sm:block w-24" />}
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-16">
        {isOwnProfile && !onboardingCompleted ? (
          <NetworkOnboarding onSelect={handleOnboardingSelect} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <NetworkMedia
              data={mediaData}
              isEditable={isOwnProfile}
              onUpdate={refreshData}
            />
            <NetworkEvents
              data={eventsData}
              isEditable={isOwnProfile}
              onUpdate={refreshData}
            />
            <NetworkInfluence
              data={influenceData}
              isEditable={isOwnProfile}
              onUpdate={refreshData}
            />
            <NetworkLifestyle
              data={philanthropyData}
              isEditable={isOwnProfile}
              onUpdate={refreshData}
            />
            <NetworkPortfolio
              data={portfolioData}
              isEditable={isOwnProfile}
              onUpdate={refreshData}
            />
            <NetworkAmbitions
              data={ambitionsData}
              isEditable={isOwnProfile}
              onUpdate={refreshData}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Network;
