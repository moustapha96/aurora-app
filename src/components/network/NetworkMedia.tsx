import { useState, useEffect } from "react";
import { NetworkModule } from "./NetworkModule";
import { Newspaper, Plus, Pencil, Trash2, Loader2, Sparkles, ChevronDown, ChevronRight, Award, Mic, Link2, Lock, Users, Shield } from "lucide-react";
import { TruncatedText } from "@/components/ui/truncated-text";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MediaItem {
  id: string;
  title: string;
  platform?: string;
  description?: string;
  url?: string;
  image_url?: string;
  category?: string;
  year?: string;
  media_type?: string;
  privacy_level?: string;
}

interface MediaPosture {
  id?: string;
  posture_text?: string;
  privacy_level?: string;
}

interface SocialLink {
  id: string;
  platform: string;
  url?: string;
  privacy_level?: string;
}

interface NetworkMediaProps {
  data: MediaItem[];
  isEditable: boolean;
  onUpdate: () => void;
}

const MEDIA_TYPES = [
  { value: 'interview', label: 'Portrait / Interview' },
  { value: 'tribune', label: 'Tribune sectorielle' },
  { value: 'citation', label: 'Classement / Citation' },
  { value: 'documentary', label: 'Documentaire / Intervention' },
  { value: 'conference', label: 'Conférence' },
  { value: 'roundtable', label: 'Table ronde' },
  { value: 'expertise', label: 'Audition / Expertise' },
  { value: 'award', label: 'Prix / Distinction' },
  { value: 'ranking', label: 'Classement sectoriel' },
  { value: 'recognition', label: 'Reconnaissance institutionnelle' }
];

const PRIVACY_LEVELS = [
  { value: 'private', label: 'Privé (moi seul)', icon: Lock },
  { value: 'aurora_circle', label: 'Cercle Aurora', icon: Users },
  { value: 'concierge_only', label: 'Conciergerie uniquement', icon: Shield }
];

const SOCIAL_PLATFORMS = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'X (Twitter)' },
  { value: 'publications', label: 'Publications / Tribunes' }
];

export const NetworkMedia = ({ data, isEditable, onUpdate }: NetworkMediaProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dialogCategory, setDialogCategory] = useState<string>('medias');
  
  // Expanded states for each bloc
  const [expandedBlocs, setExpandedBlocs] = useState({
    medias: true,
    interventions: false,
    distinctions: false,
    posture: false,
    reseaux: false
  });

  // Posture state
  const [posture, setPosture] = useState<MediaPosture>({});
  const [isPostureDialogOpen, setIsPostureDialogOpen] = useState(false);
  const [postureText, setPostureText] = useState('');
  const [posturePrivacy, setPosturePrivacy] = useState('aurora_circle');

  // Social links state
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [isSocialDialogOpen, setIsSocialDialogOpen] = useState(false);
  const [editingSocialLink, setEditingSocialLink] = useState<SocialLink | null>(null);
  const [socialFormData, setSocialFormData] = useState({ platform: '', url: '', privacy_level: 'aurora_circle' });

  const [formData, setFormData] = useState({
    title: "",
    platform: "",
    description: "",
    url: "",
    year: "",
    media_type: "",
    privacy_level: "aurora_circle"
  });

  // Filter data by category
  const mediasData = data.filter(item => !item.category || item.category === 'medias');
  const interventionsData = data.filter(item => item.category === 'interventions');
  const distinctionsData = data.filter(item => item.category === 'distinctions');

  // Load posture and social links on mount
  useEffect(() => {
    loadPosture();
    loadSocialLinks();
  }, []);

  const loadPosture = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: postureData } = await supabase
        .from('network_media_posture')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (postureData) {
        setPosture(postureData);
        setPostureText(postureData.posture_text || '');
        setPosturePrivacy(postureData.privacy_level || 'aurora_circle');
      }
    } catch (error) {
      // No posture yet, that's fine
    }
  };

  const loadSocialLinks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: links } = await supabase
        .from('network_social_links')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order');

      if (links) {
        setSocialLinks(links);
      }
    } catch (error) {
      console.error('Error loading social links:', error);
    }
  };

  const toggleBloc = (bloc: keyof typeof expandedBlocs) => {
    setExpandedBlocs(prev => ({ ...prev, [bloc]: !prev[bloc] }));
  };

  const resetForm = () => {
    setFormData({ title: "", platform: "", description: "", url: "", year: "", media_type: "", privacy_level: "aurora_circle" });
    setEditingItem(null);
  };

  const handleOpenAdd = (category: string) => {
    resetForm();
    setDialogCategory(category);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: MediaItem) => {
    setEditingItem(item);
    setDialogCategory(item.category || 'medias');
    setFormData({
      title: item.title,
      platform: item.platform || "",
      description: item.description || "",
      url: item.url || "",
      year: item.year || "",
      media_type: item.media_type || "",
      privacy_level: item.privacy_level || "aurora_circle"
    });
    setIsDialogOpen(true);
  };

  const handleAISuggest = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('network-ai-suggest', {
        body: { moduleType: 'media', context: `${dialogCategory}: ${formData.title}` }
      });
      if (error) throw error;
      if (data?.suggestion) {
        setFormData(prev => ({ ...prev, description: data.suggestion }));
        toast.success("Suggestion générée");
      }
    } catch (error) {
      toast.error("Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      if (editingItem) {
        const { error } = await supabase
          .from('network_media')
          .update({
            title: formData.title,
            platform: formData.platform,
            description: formData.description,
            url: formData.url,
            year: formData.year,
            media_type: formData.media_type,
            privacy_level: formData.privacy_level,
            category: dialogCategory,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success("Élément mis à jour");
      } else {
        const { error } = await supabase
          .from('network_media')
          .insert({
            user_id: user.id,
            title: formData.title,
            platform: formData.platform,
            description: formData.description,
            url: formData.url,
            year: formData.year,
            media_type: formData.media_type,
            privacy_level: formData.privacy_level,
            category: dialogCategory
          });
        if (error) throw error;
        toast.success("Élément ajouté");
      }

      setIsDialogOpen(false);
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving media:', error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('network_media').delete().eq('id', id);
      if (error) throw error;
      toast.success("Élément supprimé");
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleSavePosture = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from('network_media_posture')
        .upsert({
          user_id: user.id,
          posture_text: postureText,
          privacy_level: posturePrivacy,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success("Posture médiatique enregistrée");
      setIsPostureDialogOpen(false);
      loadPosture();
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSocialLink = async () => {
    if (!socialFormData.platform) {
      toast.error("La plateforme est requise");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      if (editingSocialLink) {
        const { error } = await supabase
          .from('network_social_links')
          .update({
            platform: socialFormData.platform,
            url: socialFormData.url,
            privacy_level: socialFormData.privacy_level,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingSocialLink.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('network_social_links')
          .insert({
            user_id: user.id,
            platform: socialFormData.platform,
            url: socialFormData.url,
            privacy_level: socialFormData.privacy_level
          });
        if (error) throw error;
      }

      toast.success("Lien enregistré");
      setIsSocialDialogOpen(false);
      setEditingSocialLink(null);
      setSocialFormData({ platform: '', url: '', privacy_level: 'aurora_circle' });
      loadSocialLinks();
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSocialLink = async (id: string) => {
    try {
      const { error } = await supabase.from('network_social_links').delete().eq('id', id);
      if (error) throw error;
      toast.success("Lien supprimé");
      loadSocialLinks();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const getPrivacyIcon = (level?: string) => {
    const found = PRIVACY_LEVELS.find(p => p.value === level);
    const Icon = found?.icon || Users;
    return <Icon className="w-3 h-3" />;
  };

  const renderMediaItem = (item: MediaItem) => (
    <div key={item.id} className="py-2 border-b border-border/30 last:border-0 group">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{item.platform || 'Source'}</span>
            {item.media_type && (
              <span className="text-muted-foreground">—</span>
            )}
            {item.media_type && (
              <span className="text-sm text-muted-foreground">
                {MEDIA_TYPES.find(t => t.value === item.media_type)?.label || item.media_type}
              </span>
            )}
            {item.year && (
              <span className="text-sm text-muted-foreground">({item.year})</span>
            )}
            <span className="text-muted-foreground/50 ml-auto">{getPrivacyIcon(item.privacy_level)}</span>
          </div>
          {item.title && item.title !== item.platform && (
            <p className="text-sm text-foreground/80 mt-0.5">{item.title}</p>
          )}
          {item.description && (
            <TruncatedText text={item.description} className="mt-1" maxLines={2} />
          )}
        </div>
        {isEditable && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEdit(item)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderDistinctionItem = (item: MediaItem) => (
    <div key={item.id} className="group">
      <Badge variant="outline" className="border-primary/50 bg-primary/5 text-foreground py-1.5 px-3 font-normal">
        <Award className="w-3.5 h-3.5 mr-2 text-primary" />
        {item.title}
        {item.year && <span className="ml-2 text-muted-foreground">({item.year})</span>}
        {isEditable && (
          <div className="inline-flex ml-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleOpenEdit(item)}>
              <Pencil className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => handleDelete(item.id)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </Badge>
    </div>
  );

  const getDialogTitle = () => {
    switch (dialogCategory) {
      case 'medias': return 'Média & Publication';
      case 'interventions': return 'Intervention publique';
      case 'distinctions': return 'Distinction / Reconnaissance';
      default: return 'Présence médiatique';
    }
  };

  return (
    <NetworkModule 
      title="Présence médiatique" 
      icon={Newspaper} 
      moduleType="media" 
      isEditable={isEditable}
    >
      <p className="text-xs text-muted-foreground mb-4">
        Exposition publique, interventions et visibilité choisie
      </p>

      <div className="space-y-4">
        {/* Bloc A — Médias & Publications */}
        <Collapsible open={expandedBlocs.medias} onOpenChange={() => toggleBloc('medias')}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2 hover:text-primary transition-colors">
            {expandedBlocs.medias ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Newspaper className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Médias & Publications</span>
            <span className="text-xs text-muted-foreground ml-auto">{mediasData.length}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-6 pt-2">
            {mediasData.length > 0 ? (
              <div className="space-y-1">
                {mediasData.map(renderMediaItem)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2">Aucune publication</p>
            )}
            {isEditable && (
              <button 
                onClick={() => handleOpenAdd('medias')}
                className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Bloc B — Interventions publiques */}
        <Collapsible open={expandedBlocs.interventions} onOpenChange={() => toggleBloc('interventions')}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2 hover:text-primary transition-colors">
            {expandedBlocs.interventions ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Mic className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Interventions publiques</span>
            <span className="text-xs text-muted-foreground ml-auto">{interventionsData.length}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-6 pt-2">
            {interventionsData.length > 0 ? (
              <div className="space-y-1">
                {interventionsData.map(renderMediaItem)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2">Aucune intervention</p>
            )}
            {isEditable && (
              <button 
                onClick={() => handleOpenAdd('interventions')}
                className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Bloc C — Distinctions */}
        <Collapsible open={expandedBlocs.distinctions} onOpenChange={() => toggleBloc('distinctions')}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2 hover:text-primary transition-colors">
            {expandedBlocs.distinctions ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Award className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Distinctions & Reconnaissances</span>
            <span className="text-xs text-muted-foreground ml-auto">{distinctionsData.length}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-6 pt-2">
            {distinctionsData.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {distinctionsData.map(renderDistinctionItem)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2">Aucune distinction</p>
            )}
            {isEditable && (
              <button 
                onClick={() => handleOpenAdd('distinctions')}
                className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Bloc D — Posture médiatique */}
        <Collapsible open={expandedBlocs.posture} onOpenChange={() => toggleBloc('posture')}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2 hover:text-primary transition-colors">
            {expandedBlocs.posture ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Posture médiatique</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-6 pt-2">
            {posture.posture_text ? (
              <div className="bg-muted/30 rounded-lg p-3 relative group">
                <p className="text-sm italic text-foreground/90">« {posture.posture_text} »</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  {getPrivacyIcon(posture.privacy_level)}
                  <span>{PRIVACY_LEVELS.find(p => p.value === posture.privacy_level)?.label}</span>
                </div>
                {isEditable && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100"
                    onClick={() => setIsPostureDialogOpen(true)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground py-2">
                  Décrivez votre approche de la visibilité médiatique
                </p>
                {isEditable && (
                  <button 
                    onClick={() => setIsPostureDialogOpen(true)}
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Définir ma posture
                  </button>
                )}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Bloc E — Réseaux */}
        <Collapsible open={expandedBlocs.reseaux} onOpenChange={() => toggleBloc('reseaux')}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2 hover:text-primary transition-colors">
            {expandedBlocs.reseaux ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Link2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Réseaux</span>
            <span className="text-xs text-muted-foreground ml-auto">{socialLinks.length}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-6 pt-2">
            <p className="text-xs text-muted-foreground mb-2">
              Présence professionnelle (pas d'affichage de followers)
            </p>
            {socialLinks.length > 0 ? (
              <div className="space-y-2">
                {socialLinks.map(link => (
                  <div key={link.id} className="flex items-center gap-2 py-1 group">
                    <span className="font-medium text-sm">
                      {SOCIAL_PLATFORMS.find(p => p.value === link.platform)?.label || link.platform}
                    </span>
                    {link.url && (
                      <span className="text-xs text-muted-foreground truncate max-w-[150px]">{link.url}</span>
                    )}
                    <span className="text-muted-foreground/50 ml-auto">{getPrivacyIcon(link.privacy_level)}</span>
                    {isEditable && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => {
                            setEditingSocialLink(link);
                            setSocialFormData({
                              platform: link.platform,
                              url: link.url || '',
                              privacy_level: link.privacy_level || 'aurora_circle'
                            });
                            setIsSocialDialogOpen(true);
                          }}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive"
                          onClick={() => handleDeleteSocialLink(link.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2">Aucun réseau ajouté</p>
            )}
            {isEditable && (
              <button 
                onClick={() => {
                  setEditingSocialLink(null);
                  setSocialFormData({ platform: '', url: '', privacy_level: 'aurora_circle' });
                  setIsSocialDialogOpen(true);
                }}
                className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Dialog for Media/Interventions/Distinctions */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Modifier" : "Ajouter"} — {getDialogTitle()}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Source / Média *</Label>
                <Input
                  value={formData.platform}
                  onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                  placeholder="Ex: Le Monde, Forbes, Arte"
                />
              </div>
              <div>
                <Label>Année</Label>
                <Input
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                  placeholder="2024"
                />
              </div>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={formData.media_type} onValueChange={(v) => setFormData(prev => ({ ...prev, media_type: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  {MEDIA_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Titre / Sujet</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Titre de l'article ou intervention"
              />
            </div>
            <div>
              <Label>Description (optionnel)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description courte..."
                rows={2}
              />
            </div>
            <div>
              <Label>Confidentialité</Label>
              <Select value={formData.privacy_level} onValueChange={(v) => setFormData(prev => ({ ...prev, privacy_level: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIVACY_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center gap-2">
                        <level.icon className="w-4 h-4" />
                        {level.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleAISuggest} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Suggestion Aurora
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Valider"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for Posture médiatique */}
      <Dialog open={isPostureDialogOpen} onOpenChange={setIsPostureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Posture médiatique</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Décrivez votre approche de la visibilité médiatique. Cela clarifie vos préférences auprès du réseau.
            </p>
            <div>
              <Label>Votre posture</Label>
              <Textarea
                value={postureText}
                onChange={(e) => setPostureText(e.target.value)}
                placeholder="Ex: Je privilégie une présence médiatique ponctuelle, liée à des enjeux de fond..."
                rows={4}
              />
            </div>
            <div>
              <Label>Confidentialité</Label>
              <Select value={posturePrivacy} onValueChange={setPosturePrivacy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIVACY_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center gap-2">
                        <level.icon className="w-4 h-4" />
                        {level.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsPostureDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSavePosture} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Valider"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for Social Links */}
      <Dialog open={isSocialDialogOpen} onOpenChange={setIsSocialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSocialLink ? "Modifier" : "Ajouter"} un réseau</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Plateforme</Label>
              <Select value={socialFormData.platform} onValueChange={(v) => setSocialFormData(prev => ({ ...prev, platform: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {SOCIAL_PLATFORMS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>URL (optionnel)</Label>
              <Input
                value={socialFormData.url}
                onChange={(e) => setSocialFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div>
              <Label>Confidentialité</Label>
              <Select value={socialFormData.privacy_level} onValueChange={(v) => setSocialFormData(prev => ({ ...prev, privacy_level: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIVACY_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center gap-2">
                        <level.icon className="w-4 h-4" />
                        {level.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsSocialDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSaveSocialLink} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Valider"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </NetworkModule>
  );
};
