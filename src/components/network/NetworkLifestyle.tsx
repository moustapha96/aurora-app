import { useState, useEffect } from "react";
import { NetworkModule } from "./NetworkModule";
import { Utensils, Plus, Pencil, Trash2, Loader2, Sparkles, Image, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
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

  const handleCategoryClick = (category: CategoryType) => {
    // Toggle category expansion
    setSelectedCategory(prev => prev === category ? null : category);
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

  const handleAISuggest = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('network-ai-suggest', {
        body: { moduleType: 'lifestyle', context: `${formData.cause}: ${formData.title}` }
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

  return (
    <NetworkModule title={t('lifestyleLuxury')} icon={Utensils} moduleType="lifestyle" isEditable={isEditable}>
      <div className="space-y-2">
        {/* Category: Gastronomie */}
        <div>
          <button 
            onClick={() => handleCategoryClick('gastronomie')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-full group py-1"
          >
            {selectedCategory === 'gastronomie' ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            <span className="text-sm">{t('gastronomy')}</span>
            {data.filter(item => item.cause === 'gastronomie').length > 0 && (
              <span className="text-xs text-muted-foreground">({data.filter(item => item.cause === 'gastronomie').length})</span>
            )}
          </button>
          {selectedCategory === 'gastronomie' && (
            <div className="ml-5 mt-1 space-y-2">
              {data.filter(item => item.cause === 'gastronomie').map((item) => (
                <div key={item.id} className="p-2 bg-muted/30 rounded-lg group">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-foreground">{item.title}</h4>
                      {item.organization && <TruncatedText text={item.organization} className="text-xs" />}
                      {item.description && <TruncatedText text={item.description} maxLines={2} />}
                    </div>
                    {isEditable && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
              ))}
              {isEditable && (
                <button 
                  onClick={() => handleAddToCategory('gastronomie')}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>{t('add')}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Category: Œnologie */}
        <div>
          <button 
            onClick={() => handleCategoryClick('oenologie')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-full group py-1"
          >
            {selectedCategory === 'oenologie' ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            <span className="text-sm">{t('oenology')}</span>
            {data.filter(item => item.cause === 'oenologie').length > 0 && (
              <span className="text-xs text-muted-foreground">({data.filter(item => item.cause === 'oenologie').length})</span>
            )}
          </button>
          {selectedCategory === 'oenologie' && (
            <div className="ml-5 mt-1 space-y-2">
              {data.filter(item => item.cause === 'oenologie').map((item) => (
                <div key={item.id} className="p-2 bg-muted/30 rounded-lg group">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-foreground">{item.title}</h4>
                      {item.organization && <TruncatedText text={item.organization} className="text-xs" />}
                      {item.description && <TruncatedText text={item.description} maxLines={2} />}
                    </div>
                    {isEditable && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
              ))}
              {isEditable && (
                <button 
                  onClick={() => handleAddToCategory('oenologie')}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>{t('add')}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Category: Mode */}
        <div>
          <button 
            onClick={() => handleCategoryClick('mode')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-full group py-1"
          >
            {selectedCategory === 'mode' ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            <span className="text-sm">{t('fashionJewelryWatchmaking')}</span>
            {data.filter(item => item.cause === 'mode').length > 0 && (
              <span className="text-xs text-muted-foreground">({data.filter(item => item.cause === 'mode').length})</span>
            )}
          </button>
          {selectedCategory === 'mode' && (
            <div className="ml-5 mt-1 space-y-2">
              {data.filter(item => item.cause === 'mode').map((item) => (
                <div key={item.id} className="p-2 bg-muted/30 rounded-lg group">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-foreground">{item.title}</h4>
                      {item.organization && <TruncatedText text={item.organization} className="text-xs" />}
                      {item.description && <TruncatedText text={item.description} maxLines={2} />}
                    </div>
                    {isEditable && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
              ))}
              {isEditable && (
                <button 
                  onClick={() => handleAddToCategory('mode')}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>{t('add')}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Category: Automobiles */}
        <div>
          <button 
            onClick={() => handleCategoryClick('automobiles')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-full group py-1"
          >
            {selectedCategory === 'automobiles' ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            <span className="text-sm">{t('automobiles')}</span>
            {data.filter(item => item.cause === 'automobiles').length > 0 && (
              <span className="text-xs text-muted-foreground">({data.filter(item => item.cause === 'automobiles').length})</span>
            )}
          </button>
          {selectedCategory === 'automobiles' && (
            <div className="ml-5 mt-1 space-y-2">
              {data.filter(item => item.cause === 'automobiles').map((item) => (
                <div key={item.id} className="p-2 bg-muted/30 rounded-lg group">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-foreground">{item.title}</h4>
                      {item.organization && <TruncatedText text={item.organization} className="text-xs" />}
                      {item.description && <TruncatedText text={item.description} maxLines={2} />}
                    </div>
                    {isEditable && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
              ))}
              {isEditable && (
                <button 
                  onClick={() => handleAddToCategory('automobiles')}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>{t('add')}</span>
                </button>
              )}
            </div>
          )}
        </div>
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

            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
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
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </NetworkModule>
  );
};
