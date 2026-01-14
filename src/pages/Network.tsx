import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  NetworkMedia,
  NetworkEvents,
  NetworkInfluence,
  NetworkLifestyle,
  NetworkPortfolio,
  NetworkAmbitions
} from "@/components/network";
import { PageHeaderBackButton } from "@/components/BackButton";
import { useLanguage } from "@/contexts/LanguageContext";

const Network = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  
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

  const refreshData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await loadModulesData(id || user.id);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen  bg-background flex items-center justify-center pt-32 sm:pt-36">
          <div className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (!isOwnProfile && !hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-6 pt-32 pb-16 text-center">
          <h1 className="text-3xl font-serif text-primary mb-4">{t('restrictedAccess')}</h1>
          <p className="text-muted-foreground mb-8">
            {t('noAccessToSection')}
          </p>
          <Button onClick={() => navigate(-1)}>{t('back')}</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-area-all">
      <Header />
      
      {/* Sticky Sub-Header */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center">
            {/* <PageHeaderBackButton to={id ? `/profile/${id}` : "/profile"} /> */}
            <PageHeaderBackButton to={"/member-card"} />
            <div>
              <h2 className="text-base sm:text-lg font-serif text-primary">{t('networkPage')}</h2>
              <p className="text-muted-foreground/70 text-xs hidden sm:block">{t('networkSubtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-16 mt-12 overflow-x-hidden">
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
      </main>
    </div>
  );
};

export default Network;
