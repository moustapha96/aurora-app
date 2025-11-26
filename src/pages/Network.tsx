import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { MessageSquare, Users, TrendingUp, ArrowLeft, Edit, Save, X, Link as LinkIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { EditableImage } from "@/components/EditableImage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import socialEventImg from "@/assets/social-event.jpg";
import magazineCoverImg from "@/assets/magazine-cover.jpg";
import charityGalaImg from "@/assets/charity-gala.jpg";

interface NetworkSection {
  id: string;
  icon: typeof MessageSquare;
  title: string;
  content: string;
  image: string;
  editing: boolean;
  socialLinks: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    website?: string;
  };
}

const Network = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  const defaultSections: NetworkSection[] = [
    {
      id: "social",
      icon: MessageSquare,
      title: "Réseaux Sociaux",
      content: "",
      image: socialEventImg,
      editing: false,
      socialLinks: {},
    },
    {
      id: "media",
      icon: Users,
      title: "Médias & Couverture Presse",
      content: "",
      image: magazineCoverImg,
      editing: false,
      socialLinks: {},
    },
    {
      id: "philanthropy",
      icon: TrendingUp,
      title: "Philanthropie & Engagement",
      content: "",
      image: charityGalaImg,
      editing: false,
      socialLinks: {},
    },
  ];

  const [sections, setSections] = useState<NetworkSection[]>(defaultSections);
  const [initialSections, setInitialSections] = useState<NetworkSection[]>(defaultSections);

  useEffect(() => {
    loadNetworkContent();
  }, [id]);

  const loadNetworkContent = async () => {
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
          .select('network_access')
          .or(`and(user_id.eq.${user.id},friend_id.eq.${profileId}),and(user_id.eq.${profileId},friend_id.eq.${user.id})`);

        if (!friendships || friendships.length === 0 || !friendships[0].network_access) {
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

      // Load network content from database
      const { data: networkData, error } = await supabase
        .from('network_content')
        .select('*')
        .eq('user_id', profileId);

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading network content:', error);
      }

      // Map database data to sections
      const loadedSections = defaultSections.map(section => {
        const dbSection = networkData?.find((n: any) => n.section_id === section.id);
        if (dbSection) {
          return {
            ...section,
            title: dbSection.title || section.title,
            content: dbSection.content || '',
            image: dbSection.image_url || section.image,
            socialLinks: (dbSection.social_links as any) || {},
          };
        }
        return section;
      });

      setSections(loadedSections);
      setInitialSections(JSON.parse(JSON.stringify(loadedSections)));
    } catch (error) {
      console.error('Error loading network content:', error);
      toast({
        title: t('error') || 'Erreur',
        description: "Erreur lors du chargement du contenu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFieldModified = (id: string, field: 'content' | 'image' | 'socialLinks'): boolean => {
    const currentSection = sections.find(s => s.id === id);
    const initialSection = initialSections.find(s => s.id === id);
    
    if (!currentSection || !initialSection) return false;
    
    if (field === 'content') {
      const currentValue = currentSection.content;
      const initialValue = initialSection.content;
      if ((!currentValue || currentValue === '') && (!initialValue || initialValue === '')) {
        return false;
      }
      return currentValue !== initialValue;
    }
    
    if (field === 'image') {
      return currentSection.image !== initialSection.image;
    }
    
    if (field === 'socialLinks') {
      return JSON.stringify(currentSection.socialLinks) !== JSON.stringify(initialSection.socialLinks);
    }
    
    return false;
  };

  const hasModifications = (sectionId: string): boolean => {
    return isFieldModified(sectionId, 'content') || 
           isFieldModified(sectionId, 'image') || 
           isFieldModified(sectionId, 'socialLinks');
  };

  const handleEdit = (id: string) => {
    setSections(sections.map(s => 
      s.id === id ? { ...s, editing: !s.editing } : s
    ));
  };

  const handleContentChange = (id: string, newContent: string) => {
    setSections(sections.map(s => 
      s.id === id ? { ...s, content: newContent } : s
    ));
  };

  const handleImageChange = (id: string, newImageUrl: string) => {
    setSections(sections.map(s => 
      s.id === id ? { ...s, image: newImageUrl } : s
    ));
  };

  const handleSocialLinkChange = (sectionId: string, platform: string, value: string) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { 
        ...s, 
        socialLinks: { ...s.socialLinks, [platform]: value } 
      } : s
    ));
  };

  const handleSave = async (sectionId: string) => {
    if (!isOwnProfile) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const section = sections.find(s => s.id === sectionId);
      if (!section) return;

      const { error } = await supabase
        .from('network_content')
        .upsert({
          user_id: user.id,
          section_id: sectionId,
          title: section.title,
          content: section.content,
          image_url: section.image,
          social_links: section.socialLinks,
        }, {
          onConflict: 'user_id,section_id'
        });

      if (error) throw error;

      toast({
        title: t('success') || 'Succès',
        description: "Contenu sauvegardé avec succès",
      });

      // Reload to get updated data
      await loadNetworkContent();
      
      // Close editing mode
      setSections(sections.map(s => 
        s.id === sectionId ? { ...s, editing: false } : s
      ));
    } catch (error: any) {
      console.error('Error saving network content:', error);
      toast({
        title: t('error') || 'Erreur',
        description: error.message || "Erreur lors de la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || isCheckingAccess) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6 flex items-center justify-center">
        <p>{t('loading') || 'Chargement...'}</p>
      </div>
    );
  }

  if (!isOwnProfile && !hasAccess) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="mb-4">Vous n'avez pas accès à cette section du profil.</p>
          <Button 
            variant="outline" 
            onClick={() => navigate(id ? `/profile/${id}` : "/profile")}
          >
            {t('backToProfile') || 'Retour au profil'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 pb-16 pt-24">
        <h1 className="text-6xl font-serif text-primary text-center mb-16">
          {t('networkPage') || 'Influence & Network'}
        </h1>
        
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {sections.map((section) => (
              <AccordionItem 
                key={section.id} 
                value={section.id}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-primary/5 transition-luxury">
                  <div className="flex items-center gap-4 w-full">
                    <div className="p-3 rounded-full border border-primary/30">
                      <section.icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-xl font-serif text-foreground flex-1 text-left">
                      {section.title}
                    </span>
                    {isOwnProfile && hasModifications(section.id) && !section.editing && (
                      <span className="text-xs text-primary/60">Modifié</span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <div className="space-y-4 pt-4">
                    {section.image && (
                      <div className="mb-6">
                        <EditableImage
                          imageUrl={section.image}
                          onSave={(newUrl) => handleImageChange(section.id, newUrl)}
                          className="w-full h-64 object-cover rounded-lg"
                          alt={section.title}
                          storageFolder="network-content"
                          editable={isOwnProfile}
                        />
                      </div>
                    )}
                    
                    {isOwnProfile && (
                      <div className="flex justify-end gap-2">
                        {section.editing ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(section.id)}
                              className="gap-2"
                              disabled={saving}
                            >
                              <X className="w-4 h-4" />
                              {t('cancel') || 'Annuler'}
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleSave(section.id)}
                              className="gap-2"
                              disabled={saving}
                            >
                              <Save className="w-4 h-4" />
                              {saving ? (t('loading') || 'Enregistrement...') : (t('save') || 'Enregistrer')}
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(section.id)}
                            className="gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            {t('edit') || 'Modifier'}
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {section.editing && isOwnProfile ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Contenu
                          </label>
                          <Textarea
                            value={section.content}
                            onChange={(e) => handleContentChange(section.id, e.target.value)}
                            className="min-h-[150px] bg-background"
                            placeholder="Décrivez vos réseaux sociaux, médias, ou engagements..."
                          />
                        </div>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <LinkIcon className="w-5 h-5" />
                              Liens Sociaux
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <label className="text-sm font-medium mb-1 block">Instagram</label>
                              <Input
                                value={section.socialLinks.instagram || ''}
                                onChange={(e) => handleSocialLinkChange(section.id, 'instagram', e.target.value)}
                                placeholder="@username ou URL"
                                className="bg-background"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-1 block">LinkedIn</label>
                              <Input
                                value={section.socialLinks.linkedin || ''}
                                onChange={(e) => handleSocialLinkChange(section.id, 'linkedin', e.target.value)}
                                placeholder="URL LinkedIn"
                                className="bg-background"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-1 block">Twitter/X</label>
                              <Input
                                value={section.socialLinks.twitter || ''}
                                onChange={(e) => handleSocialLinkChange(section.id, 'twitter', e.target.value)}
                                placeholder="@username ou URL"
                                className="bg-background"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-1 block">Facebook</label>
                              <Input
                                value={section.socialLinks.facebook || ''}
                                onChange={(e) => handleSocialLinkChange(section.id, 'facebook', e.target.value)}
                                placeholder="URL Facebook"
                                className="bg-background"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-1 block">Site Web</label>
                              <Input
                                value={section.socialLinks.website || ''}
                                onChange={(e) => handleSocialLinkChange(section.id, 'website', e.target.value)}
                                placeholder="https://..."
                                className="bg-background"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className={`whitespace-pre-line text-muted-foreground ${isFieldModified(section.id, 'content') ? 'field-modified' : ''}`}>
                          {section.content || <span className="text-muted-foreground/50 italic">Aucun contenu renseigné</span>}
                        </div>

                        {Object.keys(section.socialLinks).length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {section.socialLinks.instagram && (
                              <a 
                                href={section.socialLinks.instagram.startsWith('http') ? section.socialLinks.instagram : `https://instagram.com/${section.socialLinks.instagram.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                Instagram
                              </a>
                            )}
                            {section.socialLinks.linkedin && (
                              <a 
                                href={section.socialLinks.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                LinkedIn
                              </a>
                            )}
                            {section.socialLinks.twitter && (
                              <a 
                                href={section.socialLinks.twitter.startsWith('http') ? section.socialLinks.twitter : `https://twitter.com/${section.socialLinks.twitter.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                Twitter
                              </a>
                            )}
                            {section.socialLinks.facebook && (
                              <a 
                                href={section.socialLinks.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                Facebook
                              </a>
                            )}
                            {section.socialLinks.website && (
                              <a 
                                href={section.socialLinks.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                Site Web
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="flex justify-center mt-12">
          <Button
            variant="outline"
            onClick={() => navigate(id ? `/profile/${id}` : '/profile')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToProfile') || 'Retour au profil'}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Network;
