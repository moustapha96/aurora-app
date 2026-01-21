import { useState, useEffect } from "react";
import { NetworkModule } from "./NetworkModule";
import { Utensils, Plus, Pencil, Trash2, Loader2, Image, ChevronDown, ChevronRight } from "lucide-react";
// import { Sparkles } from "lucide-react"; // Commenté car bouton suggestion désactivé
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TruncatedText } from "@/components/ui/truncated-text";
import { useLanguage } from "@/contexts/LanguageContext";

interface LifestyleItem {
  id: string;
  title: string;
  organization?: string;
  role?: string;
  cause?: string; // Used as category: gastronomie, oenologie, mode
  description?: string;
  image_url?: string;
}

interface NetworkLifestyleProps {
  data: LifestyleItem[];
  isEditable: boolean;
  onUpdate: () => void;
}

type CategoryType = 'gastronomie' | 'oenologie' | 'mode' | 'automobiles';

const CATEGORY_LABELS: Record<CategoryType, string> = {
  gastronomie: 'Gastronomie',
  oenologie: 'Œnologie',
  mode: 'Mode, bijouterie, horlogerie',
  automobiles: 'Automobiles'
};

export const NetworkLifestyle = ({ data, isEditable, onUpdate }: NetworkLifestyleProps) => {

  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LifestyleItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // const [isGenerating, setIsGenerating] = useState(false); // Commenté car bouton suggestion désactivé
  const [expandedCategories, setExpandedCategories] = useState({
    gastronomie: true,
    oenologie: false,
    mode: false,
    automobiles: false
  });
  const [formData, setFormData] = useState({
    title: "",
    organization: "",
    role: "",
    cause: "",
    description: "",
    image_url: ""
  });

  // Listen for external events to open add dialog
  useEffect(() => {
    const handleOpenAdd = (e: CustomEvent<{ category: CategoryType }>) => {
      resetForm();
      setFormData(prev => ({ ...prev, cause: e.detail.category }));
      setIsDialogOpen(true);
    };

    window.addEventListener('open-add-lifestyle' as any, handleOpenAdd);
    return () => window.removeEventListener('open-add-lifestyle' as any, handleOpenAdd);
  }, []);

  const resetForm = () => {
    setFormData({ title: "", organization: "", role: "", cause: "", description: "", image_url: "" });
    setEditingItem(null);
  };

  const toggleCategory = (category: CategoryType) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleAddToCategory = (category: CategoryType) => {
    resetForm();
    setFormData(prev => ({ ...prev, cause: category }));
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: LifestyleItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      organization: item.organization || "",
      role: item.role || "",
      cause: item.cause || "",
      description: item.description || "",
      image_url: item.image_url || ""
    });
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('notAuthenticated'));

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/lifestyle/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('personal-content')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('personal-content')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success(t('imageUploaded'));
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('uploadError'));
    }
  };

  // const handleAISuggest = async () => {
  //   setIsGenerating(true);
  //   try {
  //     const { data, error } = await supabase.functions.invoke('network-ai-suggest', {
  //       body: { moduleType: 'lifestyle', context: `${formData.cause}: ${formData.title}` }
  //     });
  //     if (error) throw error;
  //     if (data?.suggestion) {
  //       setFormData(prev => ({ ...prev, description: data.suggestion }));
  //       toast.success(t('suggestionGenerated'));
  //     }
  //   } catch (error) {
  //     toast.error(t('generationError'));
  //   } finally {
  //     setIsGenerating(false);
  //   }
  // };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error(t('titleRequired'));
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('notAuthenticated'));

      if (editingItem) {
        const { error } = await supabase
          .from('network_philanthropy')
          .update({
            title: formData.title,
            organization: formData.organization,
            role: formData.role,
            cause: formData.cause,
            description: formData.description,
            image_url: formData.image_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success(t('lifestyleItemUpdated'));
      } else {
        const { error } = await supabase
          .from('network_philanthropy')
          .insert({
            user_id: user.id,
            title: formData.title,
            organization: formData.organization,
            role: formData.role,
            cause: formData.cause,
            description: formData.description,
            image_url: formData.image_url
          });
        if (error) throw error;
        toast.success(t('lifestyleItemAdded'));
      }

      setIsDialogOpen(false);
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving lifestyle:', error);
      toast.error(t('saveError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('network_philanthropy').delete().eq('id', id);
      if (error) throw error;
      toast.success(t('lifestyleItemDeleted'));
      onUpdate();
    } catch (error) {
      toast.error(t('lifestyleItemDeleteError'));
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category as CategoryType) {
      case 'gastronomie':
        return t('gastronomy');
      case 'oenologie':
        return t('oenology');
      case 'mode':
        return t('fashionJewelryWatchmaking');
      case 'automobiles':
        return t('automobiles');
      default:
        return CATEGORY_LABELS[category as CategoryType] || category;
    }
  };

  const getCategoryIcon = (category: CategoryType) => {
    // Utiliser des icônes appropriées pour chaque catégorie
    return Utensils; // Par défaut, on peut ajouter d'autres icônes si nécessaire
  };

  const getItemsByCategory = (category: CategoryType) => {
    return data.filter(item => item.cause === category);
  };

  const renderCategorySection = (category: CategoryType, label: string) => {
    const items = getItemsByCategory(category);
    const Icon = getCategoryIcon(category);
    
    return (
      <div className="p-2.5 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20">
        <Collapsible open={expandedCategories[category]} onOpenChange={() => toggleCategory(category)}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2 hover:text-primary transition-colors">
            {expandedCategories[category] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Icon className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{label}</span>
            {items.length > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">({items.length})</span>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-6 pt-2">
            {items.length > 0 && (
              <div className="space-y-1">
                {items.map((item, index) => (
                  <div key={item.id}>
                    <div className="p-2 sm:p-3 bg-muted/30 rounded-lg group">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <h4 className="font-medium text-sm text-foreground break-words">{item.title}</h4>
                          {item.organization && <TruncatedText text={item.organization} className="text-xs mt-1" />}
                          {item.description && <TruncatedText text={item.description} maxLines={2} className="mt-1" />}
                        </div>
                        {isEditable && (
                          <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleOpenEdit(item)}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    {index < items.length - 1 && (
                      <Separator className="w-full h-[2px]" />
                    )}
                  </div>
                ))}
              </div>
            )}
            {isEditable && (
              <button 
                onClick={() => handleAddToCategory(category)}
                className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> {t('add')}
              </button>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  return (
    <NetworkModule title={t('lifestyleLuxury')} icon={Utensils} moduleType="lifestyle" isEditable={isEditable}>
      <div className="space-y-4">
        {renderCategorySection('gastronomie', t('gastronomy'))}
        {renderCategorySection('oenologie', t('oenology'))}
        {renderCategorySection('mode', t('fashionJewelryWatchmaking'))}
        {renderCategorySection('automobiles', t('automobiles'))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {editingItem ? t('edit') : t('add')} - {getCategoryLabel(formData.cause)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Image upload */}
            <div>
              <Label className="text-sm">{t('photo')}</Label>
              <div className="flex items-center gap-3 mt-1">
                {formData.image_url ? (
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden">
                    <img src={formData.image_url} alt={t('preview')} className="w-full h-full object-cover" />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-1 right-1 h-6 w-6 bg-black/50"
                      onClick={() => setFormData(prev => ({ ...prev, image_url: "" }))}
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <Image className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">{t('add')}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm">{t('title')} *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={
                  formData.cause === 'gastronomie' ? t('lifestyleTitlePlaceholder_gastronomie') :
                  formData.cause === 'oenologie' ? t('lifestyleTitlePlaceholder_oenologie') :
                  t('lifestyleTitlePlaceholder_mode')
                }
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">{t('locationHouse')}</Label>
                <Input
                  value={formData.organization}
                  onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                  placeholder={t('locationPlaceholder')}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-sm">{t('category')}</Label>
                <select
                  value={formData.cause}
                  onChange={(e) => setFormData(prev => ({ ...prev, cause: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="gastronomie">{t('gastronomy')}</option>
                  <option value="oenologie">{t('oenology')}</option>
                  <option value="mode">{t('fashionJewelryWatchmaking')}</option>
                  <option value="automobiles">{t('automobiles')}</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-sm">{t('description')}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('describeExperiencePreference')}
                rows={3}
                className="text-sm min-h-[100px]"
              />
            </div>

            {/* <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={handleAISuggest} 
                disabled={isGenerating}
                className="w-full sm:w-auto text-sm"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin sm:mr-2" /> : <Sparkles className="w-4 h-4 sm:mr-2" />}
                <span className="hidden sm:inline">{t('auroraSuggestion')}</span>
              </Button>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 sm:flex-initial text-sm"
                >
                  {t('cancel')}
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={isLoading} 
                  className="flex-1 sm:flex-initial bg-gold text-black hover:bg-gold/90 text-sm"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('validate')}
                </Button>
              </div>
            </div> */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="w-full sm:w-auto text-sm"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="w-full sm:w-auto text-sm bg-gold text-black hover:bg-gold/90"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('validate')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </NetworkModule>
  );
};
