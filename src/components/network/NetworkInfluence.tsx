import { useState } from "react";
import { NetworkModule } from "./NetworkModule";
import { TrendingUp, Plus, Pencil, Trash2, Loader2, Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TruncatedText } from "@/components/ui/truncated-text";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InfluenceItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
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

  const handleCategoryClick = (category: CategoryType) => {
    setSelectedCategory(prev => prev === category ? null : category);
  };

  const handleAddToCategory = (category: CategoryType) => {
    resetForm();
    const categoryLabel = category === 'metric' ? 'Métrique' : category === 'clubs' ? 'Club' : 'Association';
    setFormData(prev => ({ ...prev, category: categoryLabel }));
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: InfluenceItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category || "",
      metric: item.metric || "",
      value: item.value || "",
      description: item.description || ""
    });
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
        toast.success("Influence mise à jour");
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
        toast.success("Influence ajoutée");
      }

      setIsDialogOpen(false);
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving influence:', error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('network_influence').delete().eq('id', id);
      if (error) throw error;
      toast.success("Influence supprimée");
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
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

  const renderCategorySection = (category: CategoryType, label: string) => {
    const items = getItemsByCategory(category);
    
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
                    <h4 className="font-medium text-sm text-foreground">{item.title}</h4>
                    {item.metric && item.value && (
                      <span className="text-xs text-muted-foreground">{item.metric}: {item.value}</span>
                    )}
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
    <NetworkModule title="Influence & Communautés" icon={TrendingUp} moduleType="influence" isEditable={isEditable}>
      <div className="space-y-2">
        {renderCategorySection('metric', "Métrique d'influence")}
        {renderCategorySection('clubs', 'Clubs membres')}
        {renderCategorySection('associations', 'Associations')}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Modifier" : "Ajouter"} une influence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titre *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Réseau LinkedIn"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Catégorie</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Ex: Réseaux sociaux"
                />
              </div>
              <div>
                <Label>Métrique</Label>
                <Input
                  value={formData.metric}
                  onChange={(e) => setFormData(prev => ({ ...prev, metric: e.target.value }))}
                  placeholder="Ex: Followers"
                />
              </div>
            </div>
            <div>
              <Label>Valeur</Label>
              <Input
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder="Ex: 50K+"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description de votre influence..."
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
