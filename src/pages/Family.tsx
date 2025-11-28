import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Heart, Users, Trophy, Home, Calendar, Edit } from "lucide-react";
import { FamilyContentEditor } from "@/components/FamilyContentEditor";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getHonorificTitleTranslation } from "@/lib/honorificTitles";
import alexandrePortrait from "@/assets/alexandre-portrait.jpg";
import maisonIleRe from "@/assets/maison-ile-re.jpg";
import atelierLittoral from "@/assets/atelier-littoral.jpg";
import dinerPrive from "@/assets/diner-prive.jpg";

const FamilySocial = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [content, setContent] = useState<any>({});
  const [initialContent, setInitialContent] = useState<any>({});
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const isFieldModified = (fieldName: string): boolean => {
    const currentValue = content[fieldName];
    const initialValue = initialContent[fieldName];
    
    if ((!currentValue || currentValue === '') && (!initialValue || initialValue === '')) {
      return false;
    }
    
    return currentValue !== initialValue;
  };

  useEffect(() => {
    loadContent();
  }, [id]);

  const loadContent = async () => {
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
          .select('family_access')
          .or(`and(user_id.eq.${user.id},friend_id.eq.${profileId}),and(user_id.eq.${profileId},friend_id.eq.${user.id})`);

        if (!friendships || friendships.length === 0 || !friendships[0].family_access) {
          setHasAccess(false);
          setIsCheckingAccess(false);
          return;
        }
        setHasAccess(true);
      } else {
        setHasAccess(true);
      }
      setIsCheckingAccess(false);

      // Charger le profil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Charger le contenu familial
      const { data, error } = await supabase
        .from('family_content')
        .select('*')
        .eq('user_id', profileId)
        .maybeSingle();

      if (error) throw error;

      const defaultContent = {
        bio: "",
        family_text: "",
        residences_text: "",
        philanthropy_text: "",
        network_text: "",
        anecdotes_text: "",
        personal_quote: "",
        portrait_url: alexandrePortrait,
        gallery_photos: [alexandrePortrait, maisonIleRe, atelierLittoral, dinerPrive]
      };

      setContent(data || defaultContent);
      
      // Sauvegarder les valeurs initiales seulement si c'est la première fois
      if (!initialContent.personal_quote && !data?.personal_quote) {
        setInitialContent(defaultContent);
      } else if (data && Object.keys(initialContent).length === 0) {
        setInitialContent(data);
      }
    } catch (error) {
      console.error('Error loading content:', error);
    }
  };

  if (isCheckingAccess) {
    return (
      <>
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <p>{t('loading')}</p>
        </div>
      </>
    );
  }

  if (!isOwnProfile && !hasAccess) {
    return (
      <>
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <div className="text-center max-w-md">
            <p className="mb-4">Vous n'avez pas accès à cette section du profil.</p>
            <Button 
              variant="outline" 
              onClick={() => navigate(id ? `/profile/${id}` : "/profile")}
            >
              {t('backToProfile')}
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(id ? `/profile/${id}` : "/profile")}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('back')}
              </Button>
              <h1 className="text-3xl font-serif text-primary tracking-wide">{t('family')}</h1>
            </div>
            {isOwnProfile && (
              <Button variant="outline" size="sm" onClick={() => setEditorOpen(true)}>
                <Edit className="w-4 h-4 mr-2" />
                {t('edit')}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Carte résumé */}
        <Card className="mb-8 border-primary/20 shadow-premium">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">{profile ? `${profile.first_name} ${profile.last_name}` : "Membre"}</CardTitle>
                <CardDescription className="text-lg text-foreground/80">
                  {profile?.honorific_title 
                    ? getHonorificTitleTranslation(profile.honorific_title, language, t)
                    : profile?.job_function || "Membre"}
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2">
                {profile?.is_founder && (
                  <Badge className="bg-primary text-primary-foreground">
                    <Trophy className="w-3 h-3 mr-1" />
                    Fondateur
                  </Badge>
                )}
                {profile?.is_patron && (
                  <Badge className="bg-primary text-primary-foreground">
                    <Heart className="w-3 h-3 mr-1 fill-current" />
                    Patron Philanthrope
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {content.residences_text && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Home className="w-4 h-4" />
                  <span>{content.residences_text.split('\n')[0]?.replace('• ', '') || "Résidences"}</span>
                </div>
              )}
              {content.family_text && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{content.family_text.split('\n')[0] || "Famille"}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche - Contenu principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Phrase d'accroche */}
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <p className={`text-xl italic text-foreground/90 leading-relaxed ${isFieldModified('personal_quote') ? 'field-modified' : ''}`}>
                  « {content.personal_quote} »
                </p>
              </CardContent>
            </Card>

            {/* Bio longue */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl">À propos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-foreground/80 leading-relaxed ${isFieldModified('bio') ? 'field-modified' : ''}`}>
                  {content.bio}
                </p>
              </CardContent>
            </Card>

            {/* Faits familiaux */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl">Famille & Résidences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-primary">Famille proche</h4>
                  <div className={`space-y-2 text-foreground/80 whitespace-pre-line ${isFieldModified('family_text') ? 'field-modified' : ''}`}>
                    {content.family_text}
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2 text-primary">Résidences</h4>
                  <div className={`space-y-2 text-foreground/80 whitespace-pre-line ${isFieldModified('residences_text') ? 'field-modified' : ''}`}>
                    {content.residences_text}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Engagements philanthropiques */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Heart className="w-6 h-6 text-primary fill-primary" />
                  Philanthropie & Causes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`space-y-2 text-foreground/80 whitespace-pre-line ${isFieldModified('philanthropy_text') ? 'field-modified' : ''}`}>
                  {content.philanthropy_text}
                </div>
              </CardContent>
            </Card>

            {/* Réseau & affiliations */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Users className="w-6 h-6 text-primary" />
                  Réseau & Affiliations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`space-y-2 text-foreground/80 whitespace-pre-line ${isFieldModified('network_text') ? 'field-modified' : ''}`}>
                  {content.network_text}
                </div>
              </CardContent>
            </Card>

            {/* Anecdotes */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl">Moments marquants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`space-y-2 text-foreground/80 whitespace-pre-line ${isFieldModified('anecdotes_text') ? 'field-modified' : ''}`}>
                  {content.anecdotes_text}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonne droite - Galerie & Actions */}
          <div className="space-y-6">
            {/* Galerie photos */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl">Galerie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {content.portrait_url && (
                    <div className="aspect-square rounded-lg overflow-hidden">
                      <img 
                        src={content.portrait_url} 
                        alt="Portrait" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {content.gallery_photos?.map((photo, index) => (
                    <div key={index} className="aspect-video rounded-lg overflow-hidden">
                      <img 
                        src={photo} 
                        alt={`Galerie ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Activité sociale */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-foreground/80">
                    "Heureux d'annoncer les 3 lauréats de la bourse 2026 — l'art contemporain mérite de nouvelles voix."
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Il y a 2 jours</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-foreground/80">
                    "Soirée privée à la Fondation — discussions inspirantes sur la conservation et la transmission. Merci aux intervenants."
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Il y a 1 semaine</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-foreground/80">
                    "Matin de travail à l'atelier. La création commence tôt."
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Il y a 2 semaines</p>
                </div>
              </CardContent>
            </Card>

            {/* Pitch */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <p className="text-sm text-foreground/90 italic text-center leading-relaxed">
                  Mécène, père, entrepreneur. J'œuvre pour la transmission culturelle et pour des projets qui allient patrimoine et modernité.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>

    <FamilyContentEditor
      open={editorOpen}
      onOpenChange={setEditorOpen}
      content={content}
      onSave={loadContent}
    />
    </>
  );
};

export default FamilySocial;
