import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  PersonalOnboarding,
  PersonalSports,
  PersonalArtCulture,
  PersonalVoyages,
  PersonalCollections,
  PersonalPhilosophie,
  PersonalProjets
} from "@/components/personal";
import { PageNavigation } from "@/components/BackButton";

const Personal = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
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

      // Check onboarding status
      const { data: personalContent } = await supabase
        .from("personal_content")
        .select("onboarding_completed")
        .eq("user_id", profileId)
        .maybeSingle();

      setOnboardingCompleted(personalContent?.onboarding_completed || false);

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

  const handleSelectOnboardingMode = async (mode: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("personal_content").upsert({
        user_id: user.id,
        onboarding_mode: mode,
        onboarding_completed: true
      }, { onConflict: "user_id" });

      if (error) throw error;

      setOnboardingCompleted(true);
      toast({ title: "Configuration terminée" });
    } catch (error) {
      console.error("Onboarding error:", error);
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleResetOnboarding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("personal_content")
        .update({ onboarding_completed: false })
        .eq("user_id", user.id);

      setOnboardingCompleted(false);
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
          <p>Chargement...</p>
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
            <p className="mb-4">Vous n'avez pas accès à cette section.</p>
            <Button variant="outline" onClick={() => navigate(id ? `/profile/${id}` : "/profile")}>
              Retour au profil
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <PageNavigation to={id ? `/profile/${id}` : "/profile"} />
      <div className="min-h-screen bg-background pt-20 sm:pt-24 safe-area-all">
        <div className="border-b border-border p-4 sm:p-6 bg-card">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-serif text-primary mb-2">PASSIONS</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Partager ce qui compte vraiment</p>
              <p className="text-muted-foreground/70 text-xs sm:text-sm mt-1 hidden sm:block">Art, gastronomie, automobile, aviation, nautisme, culture, philanthropie — Ce sont souvent les passions qui créent les relations les plus durables.</p>
            </div>
            {isOwnProfile && onboardingCompleted && (
              <Button variant="outline" size="sm" onClick={handleResetOnboarding} className="gap-2 self-start sm:self-auto">
                <RotateCcw className="w-4 h-4" />
                Reconfigurer
              </Button>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          {isOwnProfile && !onboardingCompleted ? (
            <PersonalOnboarding onSelectMode={handleSelectOnboardingMode} />
          ) : (
          <div className="space-y-8 animate-fade-in">
              <PersonalSports sports={sports} isEditable={isOwnProfile} onDataChange={loadModulesData} />
              <PersonalVoyages entries={voyages} isEditable={isOwnProfile} onDataChange={loadModulesData} />
              <PersonalPhilosophie entries={philosophie} isEditable={isOwnProfile} onDataChange={loadModulesData} />
              <PersonalArtCulture entries={artCulture} isEditable={isOwnProfile} onDataChange={loadModulesData} />
              <PersonalCollections entries={collections} isEditable={isOwnProfile} onDataChange={loadModulesData} />
              <PersonalProjets entries={projets} isEditable={isOwnProfile} onDataChange={loadModulesData} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Personal;
