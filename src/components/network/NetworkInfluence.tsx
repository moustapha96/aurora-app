import { useState } from "react";
import { NetworkModule } from "./NetworkModule";
import { TrendingUp, Plus, Trash2, Loader2, ChevronDown, ChevronRight, BarChart, Users, Building2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InlineEditableField } from "@/components/ui/inline-editable-field";
import { useLanguage } from "@/contexts/LanguageContext";

interface InfluenceItem {
  id: string;
  title: string;
  category?: string;
  metric?: string;
  value?: string;
  description?: string;
}

interface NetworkInfluenceProps {
  data: InfluenceItem[];
  isEditable: boolean;
  onUpdate: () => void;
}

type CategoryType = 'metric' | 'clubs' | 'associations';

export const NetworkInfluence = ({ data, isEditable, onUpdate }: NetworkInfluenceProps) => {
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InfluenceItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({
    metric: true,
    clubs: false,
    associations: false
  });
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    metric: "",
    value: "",
    description: ""
  });

  const resetForm = () => {
    setFormData({ title: "", category: "", metric: "", value: "", description: "" });
    setEditingItem(null);
  };

  const toggleCategory = (category: CategoryType) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleAddToCategory = (category: CategoryType) => {
    resetForm();
    const categoryLabel = category === 'metric' ? 'Métrique' : category === 'clubs' ? 'Club' : 'Association';
    setFormData(prev => ({ ...prev, category: categoryLabel }));
    setIsDialogOpen(true);
  };

  const handleAISuggest = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('network-ai-suggest', {
        body: { moduleType: 'influence', context: formData.title }
      });
      if (error) throw error;
      if (data?.suggestion) {
        setFormData(prev => ({ ...prev, description: data.suggestion }));
        toast.success(t('networkModuleSuggestionGenerated'));
      }
    } catch (error) {
      toast.error(t('networkModuleSuggestionError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error(t('networkInfluenceTitleRequired'));
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthenticated");

      if (editingItem) {
        const { error } = await supabase
          .from('network_influence')
          .update({
            title: formData.title,
            category: formData.category,
            metric: formData.metric,
            value: formData.value,
            description: formData.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success(t('networkInfluenceUpdated'));
      } else {
        const { error } = await supabase
          .from('network_influence')
          .insert({
            user_id: user.id,
            title: formData.title,
            category: formData.category,
            metric: formData.metric,
            value: formData.value,
            description: formData.description
          });
        if (error) throw error;
        toast.success(t('networkInfluenceAdded'));
      }

      setIsDialogOpen(false);
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving influence:', error);
      toast.error(t('networkInfluenceSaveError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('network_influence').delete().eq('id', id);
      if (error) throw error;
      toast.success(t('networkInfluenceDeleted'));
      onUpdate();
    } catch (error) {
      toast.error(t('networkInfluenceDeleteError'));
    }
  };

  const handleInlineUpdate = async (id: string, field: string, value: string) => {
    try {
      const { error } = await supabase
        .from("network_influence")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error("Update error:", error);
      toast.error(t('networkInfluenceSaveError'));
    }
  };

  // Filter items by category
  const getItemsByCategory = (cat: CategoryType) => {
    const categoryMap: Record<CategoryType, string[]> = {
      metric: ['Métrique', 'métrique', 'Metric'],
      clubs: ['Club', 'club', 'Clubs'],
      associations: ['Association', 'association', 'Associations']
    };
    return data.filter(item => categoryMap[cat].some(c => item.category?.toLowerCase().includes(c.toLowerCase())));
  };

  const getCategoryIcon = (category: CategoryType) => {
    switch (category) {
      case 'metric': return BarChart;
      case 'clubs': return Users;
      case 'associations': return Building2;
    }
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
                          <InlineEditableField
                            value={item.title}
                            onSave={(value) => handleInlineUpdate(item.id, "title", value)}
                            placeholder={t('title')}
                            disabled={!isEditable}
                            className="font-medium text-sm text-foreground break-words"
                          />
                          {item.metric && item.value && (
                            <span className="text-xs text-muted-foreground block mt-1">{item.metric}: {item.value}</span>
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
    <NetworkModule title={t('influenceCommunities')} icon={TrendingUp} moduleType="influence" isEditable={isEditable}>
      <div className="space-y-4">
        {renderCategorySection('metric', t('influenceMetric'))}
        
        
        {renderCategorySection('clubs', t('memberClubs'))}
        
        
        {renderCategorySection('associations', t('associations'))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{editingItem ? t('edit') : t('add')} {t('anInfluence') || "une influence"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">{t('title')} *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t('influenceTitlePlaceholder') || "Ex: Réseau LinkedIn"}
                className="text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">{t('category')}</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder={t('influenceCategoryPlaceholder') || "Ex: Réseaux sociaux"}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-sm">{t('metric')}</Label>
                <Input
                  value={formData.metric}
                  onChange={(e) => setFormData(prev => ({ ...prev, metric: e.target.value }))}
                  placeholder={t('influenceMetricPlaceholder') || "Ex: Followers"}
                  className="text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm">{t('value')}</Label>
              <Input
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder={t('influenceValuePlaceholder') || "Ex: 50K+"}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-sm">{t('description')}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('influenceDescriptionPlaceholder') || "Description de votre influence..."}
                rows={3}
                className="text-sm min-h-[80px]"
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleAISuggest}
                disabled={isGenerating}
                size="sm"
                className="gap-2 w-full sm:w-auto text-sm"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {t('networkModuleAISuggestButton')}
              </Button>
              <div className="flex flex-col sm:flex-row gap-2 justify-end w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  size="sm"
                  className="w-full sm:w-auto text-sm"
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  size="sm"
                  className="w-full sm:w-auto text-sm"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('validate')}
                </Button>
              </div>
            </div>
            {/* Ancien footer conservé pour référence, mais désormais géré par le bloc ci-dessus
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                size="sm"
                className="w-full sm:w-auto text-sm"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                size="sm"
                className="w-full sm:w-auto text-sm"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('validate')}
              </Button>
            </div>
            */}
          </div>
        </DialogContent>
      </Dialog>
    </NetworkModule>
  );
};
