import { useState } from "react";
import { NetworkModule } from "./NetworkModule";
import { Target, Plus, Trash2, Loader2, ChevronDown, ChevronRight } from "lucide-react";
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
import { InlineEditableField } from "@/components/ui/inline-editable-field";
import { useLanguage } from "@/contexts/LanguageContext";

interface AmbitionItem {
  id: string;
  title: string;
  category?: string;
  timeline?: string;
  description?: string;
}

interface NetworkAmbitionsProps {
  data: AmbitionItem[];
  isEditable: boolean;
  onUpdate: () => void;
}

type CategoryType = 'collaborations' | 'rencontres' | 'opportunites';

const CATEGORY_LABELS: Record<CategoryType, string> = {
  collaborations: 'Collaborations',
  rencontres: 'Rencontres intellectuelles',
  opportunites: 'Opportunités culturelles'
};

export const NetworkAmbitions = ({ data, isEditable, onUpdate }: NetworkAmbitionsProps) => {
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AmbitionItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // const [isGenerating, setIsGenerating] = useState(false); // Commenté car bouton suggestion désactivé
  const [expandedCategories, setExpandedCategories] = useState({
    collaborations: true,
    rencontres: false,
    opportunites: false
  });
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    timeline: "",
    description: ""
  });

  const resetForm = () => {
    setFormData({ title: "", category: "", timeline: "", description: "" });
    setEditingItem(null);
  };

  const toggleCategory = (category: CategoryType) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleAddToCategory = (category: CategoryType) => {
    resetForm();
    setFormData(prev => ({ ...prev, category: CATEGORY_LABELS[category] }));
    setIsDialogOpen(true);
  };

  // const handleAISuggest = async () => {
  //   setIsGenerating(true);
  //   try {
  //     const { data, error } = await supabase.functions.invoke('network-ai-suggest', {
  //       body: { moduleType: 'ambitions', context: formData.title }
  //     });
  //     if (error) throw error;
  //     if (data?.suggestion) {
  //       setFormData(prev => ({ ...prev, description: data.suggestion }));
  //       toast.success(t('poloAchievementSuggestionGenerated'));
  //     }
  //   } catch (error) {
  //     toast.error(t('poloAchievementGenerationError'));
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
          .from('network_ambitions')
          .update({
            title: formData.title,
            category: formData.category,
            timeline: formData.timeline,
            description: formData.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success(t('networkAmbitionUpdated'));
      } else {
        const { error } = await supabase
          .from('network_ambitions')
          .insert({
            user_id: user.id,
            title: formData.title,
            category: formData.category,
            timeline: formData.timeline,
            description: formData.description
          });
        if (error) throw error;
        toast.success(t('networkAmbitionAdded'));
      }

      setIsDialogOpen(false);
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving ambition:', error);
      toast.error(t('poloErrorSaving'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('network_ambitions').delete().eq('id', id);
      if (error) throw error;
      toast.success(t('networkAmbitionDeleted'));
      onUpdate();
    } catch (error) {
      toast.error(t('networkAmbitionDeleteError'));
    }
  };

  const handleInlineUpdate = async (id: string, field: string, value: string) => {
    try {
      const { error } = await supabase
        .from("network_ambitions")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error("Update error:", error);
      toast.error(t('poloErrorSaving'));
    }
  };

  // Filter items by category
  const getItemsByCategory = (cat: CategoryType) => {
    const label = CATEGORY_LABELS[cat].toLowerCase();
    return data.filter(item => item.category?.toLowerCase().includes(label) || item.category?.toLowerCase() === label);
  };

  const getDisplayLabel = (cat: CategoryType) => {
    switch (cat) {
      case 'collaborations':
        return t('collaborations');
      case 'rencontres':
        return t('intellectualMeetings');
      case 'opportunites':
        return t('culturalOpportunities');
      default:
        return CATEGORY_LABELS[cat];
    }
  };

  const getCategoryIcon = (category: CategoryType) => {
    return Target; // Icône par défaut, peut être personnalisée par catégorie
  };

  const renderCategorySection = (category: CategoryType) => {
    const items = getItemsByCategory(category);
    const label = getDisplayLabel(category);
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
                          <InlineEditableField
                            value={item.title}
                            onSave={(value) => handleInlineUpdate(item.id, "title", value)}
                            placeholder={t('title')}
                            disabled={!isEditable}
                            className="font-medium text-sm text-foreground break-words"
                          />
                          {item.timeline && (
                            <span className="text-xs text-muted-foreground block mt-1">{t('networkAmbitionTimeline')}: {item.timeline}</span>
                          )}
                          {isEditable ? (
                            <InlineEditableField
                              value={item.description || ""}
                              onSave={(value) => handleInlineUpdate(item.id, "description", value)}
                              placeholder={t('description')}
                              multiline
                              className="text-xs text-muted-foreground mt-1"
                            />
                          ) : item.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1 break-words">{item.description}</p>}
                        </div>
                        {isEditable && (
                          <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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
    <NetworkModule title={t('socialAmbitions')} icon={Target} moduleType="ambitions" isEditable={isEditable}>
      <div className="space-y-4">
        {renderCategorySection('collaborations')}
        {renderCategorySection('rencontres')}
        {renderCategorySection('opportunites')}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{editingItem ? t('edit') : t('add')} {t('networkAmbitionAnAmbition')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">{t('title')} *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t('networkAmbitionTitlePlaceholder')}
                className="text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">{t('category')}</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder={t('networkAmbitionCategoryPlaceholder')}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-sm">{t('networkAmbitionTimeline')}</Label>
                <Input
                  value={formData.timeline}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                  placeholder={t('networkAmbitionTimelinePlaceholder')}
                  className="text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm">{t('description')}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('networkAmbitionDescriptionPlaceholder')}
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
                <span className="hidden sm:inline">{t('aiAurora')}</span>
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
                  className="flex-1 sm:flex-initial text-sm"
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
                className="w-full sm:w-auto text-sm"
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
