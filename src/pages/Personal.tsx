import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  PersonalSports,
  PersonalArtCulture,
  PersonalVoyages,
  PersonalCollections,
  PersonalPhilosophie,
  PersonalProjets
} from "@/components/personal";
import { PageHeaderBackButton } from "@/components/BackButton";
import { useLanguage } from "@/contexts/LanguageContext";

const Personal = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [sports, setSports] = useState<any[]>([]);
  const [voyages, setVoyages] = useState<any[]>([]);
  const [philosophie, setPhilosophie] = useState<any[]>([]);
  const [artCulture, setArtCulture] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [projets, setProjets] = useState<any[]>([]);

  useEffect(() => {
    checkAuthAndLoadData();
  }, [id]);

  const checkAuthAndLoadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }
    loadData();
  };

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const profileId = id || user.id;
      const isOwn = profileId === user.id;
      setIsOwnProfile(isOwn);

      if (!isOwn) {
        const { data: friendships } = await supabase
          .from("friendships")
          .select("personal_access")
          .or(`and(user_id.eq.${user.id},friend_id.eq.${profileId}),and(user_id.eq.${profileId},friend_id.eq.${user.id})`);

        if (!friendships?.length || !friendships[0].personal_access) {
          setHasAccess(false);
          setLoading(false);
          return;
        }
      }
      setHasAccess(true);

      // Load all module data
      await loadModulesData(profileId);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadModulesData = async (profileId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const targetId = profileId || id || user.id;

      const [sportsRes, voyagesRes, philosophieRes, artRes, collectionsRes, projetsRes] = await Promise.all([
        supabase.from("sports_hobbies").select("*").eq("user_id", targetId).order("display_order"),
        supabase.from("personal_voyages").select("*").eq("user_id", targetId).order("display_order"),
        supabase.from("personal_art_culture").select("*").eq("user_id", targetId).in("category", ["mentors", "philosophie", "citations", "lectures"]).order("display_order"),
        supabase.from("personal_art_culture").select("*").eq("user_id", targetId).not("category", "in", "(mentors,philosophie,citations,lectures)").order("display_order"),
        supabase.from("personal_collections").select("*").eq("user_id", targetId).not("category", "in", "(en_cours,a_venir,realises)").order("display_order"),
        supabase.from("personal_collections").select("*").eq("user_id", targetId).in("category", ["en_cours", "a_venir", "realises"]).order("display_order")
      ]);

      setSports(sportsRes.data || []);
      setVoyages(voyagesRes.data || []);
      setPhilosophie(philosophieRes.data || []);
      setArtCulture(artRes.data || []);
      setCollections(collectionsRes.data || []);
      setProjets(projetsRes.data || []);
    } catch (error) {
      console.error("Error loading modules data:", error);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (!isOwnProfile && !hasAccess) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
          <div className="text-center max-w-md">
            <p className="mb-4">{t('noAccessToSection')}</p>
            <Button variant="outline" onClick={() => navigate(id ? `/profile/${id}` : "/profile")}>
              {t('backToProfile')}
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-20 sm:pt-24 safe-area-all">
        <div className="border-b border-border p-4 sm:p-6 bg-card">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center mb-2">
              {/* <PageHeaderBackButton to={id ? `/profile/${id}` : "/profile"} /> */}
              <PageHeaderBackButton to={"/member-card"} />
              <h1 className="text-2xl sm:text-4xl font-serif text-primary">{t('passions')}</h1>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base">{t('shareWhatMatters')}</p>
            <p className="text-muted-foreground/70 text-xs sm:text-sm mt-1 hidden sm:block">{t('passionsDescription')}</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 sm:p-6 mt-12 overflow-x-hidden">
          <div className="space-y-8 animate-fade-in">
            <PersonalSports sports={sports} isEditable={isOwnProfile} onDataChange={loadModulesData} />
            <PersonalVoyages entries={voyages} isEditable={isOwnProfile} onDataChange={loadModulesData} />
            <PersonalPhilosophie entries={philosophie} isEditable={isOwnProfile} onDataChange={loadModulesData} />
            <PersonalArtCulture entries={artCulture} isEditable={isOwnProfile} onDataChange={loadModulesData} />
            <PersonalCollections entries={collections} isEditable={isOwnProfile} onDataChange={loadModulesData} />
            <PersonalProjets entries={projets} isEditable={isOwnProfile} onDataChange={loadModulesData} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Personal;
