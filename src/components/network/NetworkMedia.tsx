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
import { useLanguage } from "@/contexts/LanguageContext";

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

// Media types will be translated dynamically using t()
const MEDIA_TYPES = [
  { value: 'interview' },
  { value: 'tribune' },
  { value: 'citation' },
  { value: 'documentary' },
  { value: 'conference' },
  { value: 'roundtable' },
  { value: 'expertise' },
  { value: 'award' },
  { value: 'ranking' },
  { value: 'recognition' }
];

// Privacy levels will be translated dynamically using t()
const PRIVACY_LEVELS = [
  { value: 'private', icon: Lock },
  { value: 'aurora_circle', icon: Users },
  // { value: 'concierge_only', icon: Shield }
];

// Social platforms will be translated dynamically using t()
const SOCIAL_PLATFORMS = [
  { value: 'linkedin' },
  { value: 'twitter' },
  { value: 'publications' }
];

export const NetworkMedia = ({ data, isEditable, onUpdate }: NetworkMediaProps) => {
  const { t } = useLanguage();

  // Helper functions to get translated labels
  const getMediaTypeLabel = (value: string) => {
    return t(`mediaType_${value}` as any) || value;
  };

  const getPrivacyLevelLabel = (value: string) => {
    return t(`privacyLevel_${value}` as any) || value;
  };

  const getSocialPlatformLabel = (value: string) => {
    return t(`socialPlatform_${value}` as any) || value;
  };
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
        toast.success(t('suggestionGenerated'));
      }
    } catch (error) {
      toast.error(t('generationError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error(t('titleRequired'));
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
        toast.success(t('mediaItemUpdated'));
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
        toast.success(t('mediaItemAdded'));
      }

      setIsDialogOpen(false);
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving media:', error);
      toast.error(t('saveError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('network_media').delete().eq('id', id);
      if (error) throw error;
      toast.success(t('mediaItemDeleted'));
      onUpdate();
    } catch (error) {
      toast.error(t('mediaItemDeleteError'));
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
      toast.success(t('mediaPostureSaved'));
      setIsPostureDialogOpen(false);
      loadPosture();
    } catch (error) {
      toast.error(t('saveError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSocialLink = async () => {
    if (!socialFormData.platform) {
      toast.error(t('platformRequired'));
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

      toast.success(t('socialLinkSaved'));
      setIsSocialDialogOpen(false);
      setEditingSocialLink(null);
      setSocialFormData({ platform: '', url: '', privacy_level: 'aurora_circle' });
      loadSocialLinks();
    } catch (error) {
      toast.error(t('saveError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSocialLink = async (id: string) => {
    try {
      const { error } = await supabase.from('network_social_links').delete().eq('id', id);
      if (error) throw error;
      toast.success(t('socialLinkDeleted'));
      loadSocialLinks();
    } catch (error) {
      toast.error(t('socialLinkDeleteError'));
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
            <span className="font-medium text-foreground">{item.platform || t('source')}</span>
            {item.media_type && (
              <span className="text-muted-foreground">—</span>
            )}
            {item.media_type && (
              <span className="text-sm text-muted-foreground">
                {getMediaTypeLabel(item.media_type)}
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
      case 'medias': return t('mediaDialogTitle');
      case 'interventions': return t('interventionDialogTitle');
      case 'distinctions': return t('distinctionDialogTitle');
      default: return t('mediaPresence');
    }
  };

  return (
    <NetworkModule 
      title={t('mediaPresence')} 
      icon={Newspaper} 
      moduleType="media" 
      isEditable={isEditable}
    >
      <p className="text-xs text-muted-foreground mb-4">
        {t('mediaPresenceSubtitle')}
      </p>

      <div className="space-y-4">
        {/* Bloc A — Médias & Publications */}
        <Collapsible open={expandedBlocs.medias} onOpenChange={() => toggleBloc('medias')}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2 hover:text-primary transition-colors">
            {expandedBlocs.medias ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Newspaper className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{t('mediaPublications')}</span>
            <span className="text-xs text-muted-foreground ml-auto">{mediasData.length}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-6 pt-2">
            {mediasData.length > 0 ? (
              <div className="space-y-1">
                {mediasData.map(renderMediaItem)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2">
                {t('noPublication')}
              </p>
            )}
            {isEditable && (
              <button 
                onClick={() => handleOpenAdd('medias')}
                className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> {t('add')}
              </button>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Bloc B — Interventions publiques */}
        <Collapsible open={expandedBlocs.interventions} onOpenChange={() => toggleBloc('interventions')}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2 hover:text-primary transition-colors">
            {expandedBlocs.interventions ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Mic className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{t('publicInterventions')}</span>
            <span className="text-xs text-muted-foreground ml-auto">{interventionsData.length}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-6 pt-2">
            {interventionsData.length > 0 ? (
              <div className="space-y-1">
                {interventionsData.map(renderMediaItem)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2">
                {t('noIntervention')}
              </p>
            )}
            {isEditable && (
              <button 
                onClick={() => handleOpenAdd('interventions')}
                className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> {t('add')}
              </button>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Bloc C — Distinctions */}
        <Collapsible open={expandedBlocs.distinctions} onOpenChange={() => toggleBloc('distinctions')}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2 hover:text-primary transition-colors">
            {expandedBlocs.distinctions ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Award className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{t('distinctionsRecognitions')}</span>
            <span className="text-xs text-muted-foreground ml-auto">{distinctionsData.length}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-6 pt-2">
            {distinctionsData.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {distinctionsData.map(renderDistinctionItem)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2">
                {t('noDistinction')}
              </p>
            )}
            {isEditable && (
              <button 
                onClick={() => handleOpenAdd('distinctions')}
                className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> {t('add')}
              </button>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Bloc D — Posture médiatique */}
        <Collapsible open={expandedBlocs.posture} onOpenChange={() => toggleBloc('posture')}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2 hover:text-primary transition-colors">
            {expandedBlocs.posture ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{t('mediaPosture')}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-6 pt-2">
            {posture.posture_text ? (
              <div className="bg-muted/30 rounded-lg p-3 relative group">
                <p className="text-sm italic text-foreground/90">« {posture.posture_text} »</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  {getPrivacyIcon(posture.privacy_level)}
                  <span>{getPrivacyLevelLabel(posture.privacy_level || '')}</span>
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
                  {t('describeMediaApproach')}
                </p>
                {isEditable && (
                  <button 
                    onClick={() => setIsPostureDialogOpen(true)}
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> {t('add')}
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
            <span className="text-sm font-medium">{t('networks')}</span>
            <span className="text-xs text-muted-foreground ml-auto">{socialLinks.length}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-6 pt-2">
            <p className="text-xs text-muted-foreground mb-2">
              {t('professionalPresence')}
            </p>
            {socialLinks.length > 0 ? (
              <div className="space-y-2">
                {socialLinks.map(link => (
                  <div key={link.id} className="flex items-center gap-2 py-1 group">
                    <span className="font-medium text-sm">
                      {getSocialPlatformLabel(link.platform)}
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
              <p className="text-sm text-muted-foreground py-2">{t('noNetworkAdded')}</p>
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
                <Plus className="w-3.5 h-3.5" /> {t('add')}
              </button>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Dialog for Media/Interventions/Distinctions */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? t('edit') : t('add')} — {getDialogTitle()}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('sourceMedia')} *</Label>
                <Input
                  value={formData.platform}
                  onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                  placeholder={t('sourceMediaPlaceholder')}
                />
              </div>
              <div>
                <Label>{t('year')}</Label>
                <Input
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                  placeholder={t('yearPlaceholder')}
                />
              </div>
            </div>
            <div>
              <Label>{t('type')}</Label>
              <Select value={formData.media_type} onValueChange={(v) => setFormData(prev => ({ ...prev, media_type: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectType')} />
                </SelectTrigger>
                <SelectContent>
                  {MEDIA_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{getMediaTypeLabel(type.value)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('titleSubject')}</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t('articleTitlePlaceholder')}
              />
            </div>
            <div>
              <Label>{t('descriptionOptional')}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('shortDescriptionPlaceholder')}
                rows={2}
              />
            </div>
            <div>
              <Label>{t('privacy')}</Label>
              <Select value={formData.privacy_level} onValueChange={(v) => setFormData(prev => ({ ...prev, privacy_level: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIVACY_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center gap-2">
                        <level.icon className="w-4 h-4" />
                        {getPrivacyLevelLabel(level.value)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleAISuggest} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {t('auroraSuggestion')}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t('cancel')}</Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('validate')}
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
            <DialogTitle>{t('mediaPosture')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('describeMediaApproachDescription')}
            </p>
            <div>
              <Label>{t('yourPosture')}</Label>
              <Textarea
                value={postureText}
                onChange={(e) => setPostureText(e.target.value)}
                placeholder={t('posturePlaceholder')}
                rows={4}
              />
            </div>
            <div>
              <Label>{t('privacy')}</Label>
              <Select value={posturePrivacy} onValueChange={setPosturePrivacy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIVACY_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center gap-2">
                        <level.icon className="w-4 h-4" />
                        {getPrivacyLevelLabel(level.value)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsPostureDialogOpen(false)}>{t('cancel')}</Button>
              <Button onClick={handleSavePosture} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('validate')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for Social Links */}
      <Dialog open={isSocialDialogOpen} onOpenChange={setIsSocialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSocialLink ? t('edit') : t('add')} {t('aNetwork')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('platform')}</Label>
              <Select value={socialFormData.platform} onValueChange={(v) => setSocialFormData(prev => ({ ...prev, platform: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('select')} />
                </SelectTrigger>
                <SelectContent>
                  {SOCIAL_PLATFORMS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{getSocialPlatformLabel(p.value)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('urlOptional')}</Label>
              <Input
                value={socialFormData.url}
                onChange={(e) => setSocialFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder={t('urlPlaceholder')}
              />
            </div>
            <div>
              <Label>{t('privacy')}</Label>
              <Select value={socialFormData.privacy_level} onValueChange={(v) => setSocialFormData(prev => ({ ...prev, privacy_level: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIVACY_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center gap-2">
                        <level.icon className="w-4 h-4" />
                        {getPrivacyLevelLabel(level.value)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsSocialDialogOpen(false)}>{t('cancel')}</Button>
              <Button onClick={handleSaveSocialLink} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('validate')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </NetworkModule>
  );
};
