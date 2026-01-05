import { useState } from "react";
import { NetworkModule } from "./NetworkModule";
import { Target, Plus, Trash2, Loader2, Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InlineEditableField } from "@/components/ui/inline-editable-field";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AmbitionItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
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

  const handleCategoryClick = (category: CategoryType) => {
    setSelectedCategory(prev => prev === category ? null : category);
  };

  const handleAddToCategory = (category: CategoryType) => {
    resetForm();
    setFormData(prev => ({ ...prev, category: CATEGORY_LABELS[category] }));
    setIsDialogOpen(true);
  };

  const handleAISuggest = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('network-ai-suggest', {
        body: { moduleType: 'ambitions', context: formData.title }
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
        toast.success("Ambition mise à jour");
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
        toast.success("Ambition ajoutée");
      }

      setIsDialogOpen(false);
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving ambition:', error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('network_ambitions').delete().eq('id', id);
      if (error) throw error;
      toast.success("Ambition supprimée");
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
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
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  // Filter items by category
  const getItemsByCategory = (cat: CategoryType) => {
    const label = CATEGORY_LABELS[cat].toLowerCase();
    return data.filter(item => item.category?.toLowerCase().includes(label) || item.category?.toLowerCase() === label);
  };

  const renderCategorySection = (category: CategoryType) => {
    const items = getItemsByCategory(category);
    const label = CATEGORY_LABELS[category];
    
    return (
      <div>
        <button 
          onClick={() => handleCategoryClick(category)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-full group py-1"
        >
          {selectedCategory === category ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
          <span className="text-sm">{label}</span>
          {items.length > 0 && (
            <span className="text-xs text-muted-foreground">({items.length})</span>
          )}
        </button>
        {selectedCategory === category && (
          <div className="ml-5 mt-1 space-y-2">
            {items.map((item) => (
              <div key={item.id} className="p-2 bg-muted/30 rounded-lg group">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <InlineEditableField
                      value={item.title}
                      onSave={(value) => handleInlineUpdate(item.id, "title", value)}
                      placeholder="Titre"
                      disabled={!isEditable}
                      className="font-medium text-sm text-foreground"
                    />
                    {item.timeline && (
                      <span className="text-xs text-muted-foreground">Horizon: {item.timeline}</span>
                    )}
                    {isEditable ? (
                      <InlineEditableField
                        value={item.description || ""}
                        onSave={(value) => handleInlineUpdate(item.id, "description", value)}
                        placeholder="Description"
                        multiline
                        className="text-xs text-muted-foreground"
                      />
                    ) : item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
                  </div>
                  {isEditable && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                onClick={() => handleAddToCategory(category)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Ajouter</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <NetworkModule title="Ambitions Sociales" icon={Target} moduleType="ambitions" isEditable={isEditable}>
      <div className="space-y-2">
        {renderCategorySection('collaborations')}
        {renderCategorySection('rencontres')}
        {renderCategorySection('opportunites')}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Modifier" : "Ajouter"} une ambition</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titre *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Créer une fondation caritative"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Catégorie</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Ex: Impact social"
                />
              </div>
              <div>
                <Label>Horizon</Label>
                <Input
                  value={formData.timeline}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                  placeholder="Ex: 2025, 5 ans"
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez votre ambition sociale..."
              />
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
    </NetworkModule>
  );
};
