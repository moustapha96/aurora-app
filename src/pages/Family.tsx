import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Heart, Users, Trophy, Home, Calendar, Edit, FileText, X } from "lucide-react";
import { FamilyContentEditor } from "@/components/FamilyContentEditor";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getHonorificTitleTranslation } from "@/lib/honorificTitles";
import alexandrePortrait from "@/assets/alexandre-portrait.jpg";
import maisonIleRe from "@/assets/maison-ile-re.jpg";
import atelierLittoral from "@/assets/atelier-littoral.jpg";
import dinerPrive from "@/assets/diner-prive.jpg";

// Utilitaire simple pour extraire du texte brut depuis du HTML
const stripHtmlTags = (html: string | undefined | null): string => {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, "").trim();
};

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
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
          <p className="text-sm sm:text-base">{t('loading')}</p>
        </div>
      </>
    );
  }

  if (!isOwnProfile && !hasAccess) {
    return (
      <>
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
          <div className="text-center max-w-md w-full">
            <p className="mb-4 text-sm sm:text-base px-4">Vous n'avez pas accès à cette section du profil.</p>
            <Button 
              variant="outline" 
              onClick={() => navigate(id ? `/profile/${id}` : "/profile")}
              className="w-full sm:w-auto"
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
        {/* Header - Responsive */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(id ? `/profile/${id}` : "/profile")}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('back')}</span>
              </Button>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif text-primary tracking-wide truncate">{t('family')}</h1>
            </div>
            {isOwnProfile && (
              <Button variant="outline" size="sm" onClick={() => setEditorOpen(true)} className="shrink-0">
                <Edit className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('edit')}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
        {/* Carte résumé - Responsive */}
        <Card className="mb-6 sm:mb-8 border-primary/20 shadow-premium">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xl sm:text-2xl lg:text-3xl mb-2 break-words">{profile ? `${profile.first_name} ${profile.last_name}` : "Membre"}</CardTitle>
                <CardDescription className="text-sm sm:text-base lg:text-lg text-foreground/80 break-words">
                  {profile?.honorific_title 
                    ? getHonorificTitleTranslation(profile.honorific_title, language, t)
                    : profile?.job_function || "Membre"}
                </CardDescription>
              </div>
              <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                {profile?.is_founder && (
                  <Badge className="bg-primary text-primary-foreground text-xs sm:text-sm">
                    <Trophy className="w-3 h-3 mr-1" />
                    <span className="whitespace-nowrap">Fondateur</span>
                  </Badge>
                )}
                {profile?.is_patron && (
                  <Badge className="bg-primary text-primary-foreground text-xs sm:text-sm">
                    <Heart className="w-3 h-3 mr-1 fill-current" />
                    <span className="whitespace-nowrap">Patron Philanthrope</span>
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {content.residences_text && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm sm:text-base">
                  <Home className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {stripHtmlTags(content.residences_text).split("\n")[0]?.replace("• ", "") ||
                      "Résidences"}
                  </span>
                </div>
              )}
              {content.family_text && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm sm:text-base">
                  <Users className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {stripHtmlTags(content.family_text).split("\n")[0] || "Famille"}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Colonne gauche - Contenu principal */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Phrase d'accroche - Responsive */}
            <Card className="border-primary/20">
              <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                <p className={`text-base sm:text-lg lg:text-xl italic text-foreground/90 leading-relaxed ${isFieldModified('personal_quote') ? 'field-modified' : ''}`}>
                  « {content.personal_quote} »
                </p>
              </CardContent>
            </Card>

            {/* Bio longue - Responsive */}
            <Card className="border-primary/20">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl">À propos</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div
                  className={`prose prose-sm sm:prose-base max-w-none text-foreground/80 leading-relaxed ${
                    isFieldModified("bio") ? "field-modified" : ""
                  }`}
                  // Permet d'afficher du texte riche (HTML collé) avec images intégrées
                  dangerouslySetInnerHTML={{ __html: content.bio || "" }}
                />
              </CardContent>
            </Card>

            {/* Faits familiaux - Responsive */}
            <Card className="border-primary/20">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl">Famille & Résidences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div>
                  <h4 className="font-semibold mb-2 text-primary text-base sm:text-lg">Famille proche</h4>
                  <div
                    className={`space-y-2 text-foreground/80 prose prose-sm sm:prose-base max-w-none ${
                      isFieldModified("family_text") ? "field-modified" : ""
                    }`}
                    // Rendu HTML pour permettre texte + images intégrés
                    dangerouslySetInnerHTML={{ __html: content.family_text || "" }}
                  />
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2 text-primary text-base sm:text-lg">Résidences</h4>
                  <div
                    className={`space-y-2 text-foreground/80 prose prose-sm sm:prose-base max-w-none ${
                      isFieldModified("residences_text") ? "field-modified" : ""
                    }`}
                    // Rendu HTML pour permettre texte + images intégrés
                    dangerouslySetInnerHTML={{ __html: content.residences_text || "" }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Engagements philanthropiques - Responsive */}
            <Card className="border-primary/20">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-primary fill-primary shrink-0" />
                  <span>Philanthropie & Causes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div
                  className={`space-y-2 text-foreground/80 prose prose-sm sm:prose-base max-w-none ${
                    isFieldModified("philanthropy_text") ? "field-modified" : ""
                  }`}
                  // Rendu HTML pour permettre texte + images intégrés
                  dangerouslySetInnerHTML={{ __html: content.philanthropy_text || "" }}
                />
              </CardContent>
            </Card>

            {/* Réseau & affiliations - Responsive */}
            <Card className="border-primary/20">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
                  <span>Réseau & Affiliations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div
                  className={`space-y-2 text-foreground/80 prose prose-sm sm:prose-base max-w-none ${
                    isFieldModified("network_text") ? "field-modified" : ""
                  }`}
                  // Rendu HTML pour permettre texte + images intégrés
                  dangerouslySetInnerHTML={{ __html: content.network_text || "" }}
                />
              </CardContent>
            </Card>

            {/* Anecdotes - Responsive */}
            <Card className="border-primary/20">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl">Moments marquants</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div
                  className={`space-y-2 text-foreground/80 prose prose-sm sm:prose-base max-w-none ${
                    isFieldModified("anecdotes_text") ? "field-modified" : ""
                  }`}
                  // Rendu HTML pour permettre texte + images intégrés
                  dangerouslySetInnerHTML={{ __html: content.anecdotes_text || "" }}
                />
              </CardContent>
            </Card>

            {/* Documents PDF - Responsive */}
            {Array.isArray(content.pdf_documents) && content.pdf_documents.length > 0 && (
              <Card className="border-primary/20">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                    <span>{t('documents') || 'Documents'}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                  {/* Affichage de tous les documents PDF */}
                  <div className="space-y-4 sm:space-y-6">
                    {content.pdf_documents.map((url: string, index: number) => {
                      const fileName = url.split("/").pop() || `Document ${index + 1}`;

                      return (
                        <div key={index} className="space-y-2 sm:space-y-3">
                          {/* En-tête du document - Responsive */}
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary shrink-0" />
                            <h4 className="text-base sm:text-lg font-semibold text-foreground truncate">
                              {fileName}
                            </h4>
                          </div>
                          
                          {/* Viewer PDF - Responsive */}
                          <div className="relative border rounded-lg overflow-hidden bg-muted/40">
                            <div className="w-full h-[300px] xs:h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] xl:h-[800px] max-h-[900px]">
                              {/* Iframe pour affichage direct avec paramètres PDF optimisés */}
                              <iframe
                                src={`${url}#toolbar=1&navpanes=1&scrollbar=1&zoom=page-width`}
                                title={`Document PDF - ${fileName}`}
                                className="w-full h-full border-0"
                                loading="lazy"
                                allow="fullscreen"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t('pdfInfoText') || "Les documents s'ouvrent directement sur cette page pour une consultation rapide. Vous pouvez également les ouvrir dans un nouvel onglet si nécessaire."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Colonne droite - Galerie & Actions - Responsive */}
          <div className="space-y-4 sm:space-y-6">
            {/* Galerie photos - Responsive */}
            <Card className="border-primary/20">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Galerie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                <div className="space-y-3">
                  {content.portrait_url && (
                    <div className="aspect-square rounded-lg overflow-hidden">
                      <img 
                        src={content.portrait_url} 
                        alt="Portrait" 
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  {content.gallery_photos?.map((photo, index) => (
                    <div key={index} className="aspect-video rounded-lg overflow-hidden">
                      <img 
                        src={photo} 
                        alt={`Galerie ${index + 1}`} 
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Activité sociale - Responsive */}
            <Card className="border-primary/20">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                  <span>Activité récente</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs sm:text-sm text-foreground/80">
                    "Heureux d'annoncer les 3 lauréats de la bourse 2026 — l'art contemporain mérite de nouvelles voix."
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Il y a 2 jours</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs sm:text-sm text-foreground/80">
                    "Soirée privée à la Fondation — discussions inspirantes sur la conservation et la transmission. Merci aux intervenants."
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Il y a 1 semaine</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs sm:text-sm text-foreground/80">
                    "Matin de travail à l'atelier. La création commence tôt."
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Il y a 2 semaines</p>
                </div>
              </CardContent>
            </Card>

            {/* Pitch - Responsive */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                <p className="text-xs sm:text-sm text-foreground/90 italic text-center leading-relaxed">
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
