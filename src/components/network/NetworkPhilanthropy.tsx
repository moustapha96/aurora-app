import { useState } from "react";
import { NetworkModule } from "./NetworkModule";
import { Heart, Plus, Pencil, Trash2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PhilanthropyItem {
  id: string;
  title: string;
  organization?: string;
  role?: string;
  cause?: string;
  description?: string;
}

interface NetworkPhilanthropyProps {
  data: PhilanthropyItem[];
  isEditable: boolean;
  onUpdate: () => void;
}

export const NetworkPhilanthropy = ({ data, isEditable, onUpdate }: NetworkPhilanthropyProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PhilanthropyItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    organization: "",
    role: "",
    cause: "",
    description: ""
  });

  const resetForm = () => {
    setFormData({ title: "", organization: "", role: "", cause: "", description: "" });
    setEditingItem(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: PhilanthropyItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      organization: item.organization || "",
      role: item.role || "",
      cause: item.cause || "",
      description: item.description || ""
    });
    setIsDialogOpen(true);
  };

  const handleAISuggest = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('network-ai-suggest', {
        body: { moduleType: 'philanthropy', context: formData.title }
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
          .from('network_philanthropy')
          .update({
            title: formData.title,
            organization: formData.organization,
            role: formData.role,
            cause: formData.cause,
            description: formData.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success("Engagement mis à jour");
      } else {
        const { error } = await supabase
          .from('network_philanthropy')
          .insert({
            user_id: user.id,
            title: formData.title,
            organization: formData.organization,
            role: formData.role,
            cause: formData.cause,
            description: formData.description
          });
        if (error) throw error;
        toast.success("Engagement ajouté");
      }

      setIsDialogOpen(false);
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving philanthropy:', error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('network_philanthropy').delete().eq('id', id);
      if (error) throw error;
      toast.success("Engagement supprimé");
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <NetworkModule title="Philanthropie" icon={Heart} moduleType="philanthropy" isEditable={isEditable}>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.id} className="p-3 bg-muted/30 rounded-lg group">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{item.title}</h4>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {item.organization && <span>{item.organization}</span>}
                  {item.role && <span>• {item.role}</span>}
                  {item.cause && <span className="text-primary">• {item.cause}</span>}
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                )}
              </div>
              {isEditable && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(item)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}

        {data.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-4">
            Aucun engagement philanthropique ajouté
          </p>
        )}

        {isEditable && (
          <Button variant="outline" className="w-full mt-3" onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Modifier" : "Ajouter"} un engagement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titre *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Fondation pour l'Éducation"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Organisation</Label>
                <Input
                  value={formData.organization}
                  onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                  placeholder="Ex: UNICEF"
                />
              </div>
              <div>
                <Label>Rôle</Label>
                <Input
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="Ex: Mécène, Fondateur"
                />
              </div>
            </div>
            <div>
              <Label>Cause</Label>
              <Input
                value={formData.cause}
                onChange={(e) => setFormData(prev => ({ ...prev, cause: e.target.value }))}
                placeholder="Ex: Éducation, Santé, Environnement"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description de votre engagement..."
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
