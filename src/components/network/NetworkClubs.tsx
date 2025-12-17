import { useState, useEffect } from "react";
import { NetworkModule } from "./NetworkModule";
import { Users, Plus, Pencil, Trash2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClubItem {
  id: string;
  title: string;
  club_type?: string;
  role?: string;
  since_year?: string;
  description?: string;
}

interface NetworkClubsProps {
  data: ClubItem[];
  isEditable: boolean;
  onUpdate: () => void;
}

export const NetworkClubs = ({ data, isEditable, onUpdate }: NetworkClubsProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClubItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    club_type: "",
    role: "",
    since_year: "",
    description: ""
  });

  const resetForm = () => {
    setFormData({ title: "", club_type: "", role: "", since_year: "", description: "" });
    setEditingItem(null);
  };

  const handleOpenAdd = (type?: string) => {
    resetForm();
    if (type) {
      setFormData(prev => ({ ...prev, club_type: type }));
    }
    setIsDialogOpen(true);
  };

  // Listen for custom events from NetworkInfluence
  useEffect(() => {
    const handleAddClub = () => handleOpenAdd("Club");
    const handleAddAssociation = () => handleOpenAdd("Association");

    window.addEventListener('open-add-club', handleAddClub);
    window.addEventListener('open-add-association', handleAddAssociation);

    return () => {
      window.removeEventListener('open-add-club', handleAddClub);
      window.removeEventListener('open-add-association', handleAddAssociation);
    };
  }, []);

  const handleOpenEdit = (item: ClubItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      club_type: item.club_type || "",
      role: item.role || "",
      since_year: item.since_year || "",
      description: item.description || ""
    });
    setIsDialogOpen(true);
  };

  const handleAISuggest = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('network-ai-suggest', {
        body: { moduleType: 'clubs', context: formData.title }
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
          .from('network_clubs')
          .update({
            title: formData.title,
            club_type: formData.club_type,
            role: formData.role,
            since_year: formData.since_year,
            description: formData.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success("Club mis à jour");
      } else {
        const { error } = await supabase
          .from('network_clubs')
          .insert({
            user_id: user.id,
            title: formData.title,
            club_type: formData.club_type,
            role: formData.role,
            since_year: formData.since_year,
            description: formData.description
          });
        if (error) throw error;
        toast.success("Club ajouté");
      }

      setIsDialogOpen(false);
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving club:', error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('network_clubs').delete().eq('id', id);
      if (error) throw error;
      toast.success("Club supprimé");
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <NetworkModule title="Clubs & Associations" icon={Users} moduleType="clubs" isEditable={isEditable}>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.id} className="p-3 bg-muted/30 rounded-lg group">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{item.title}</h4>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {item.club_type && <span className="text-primary">{item.club_type}</span>}
                  {item.role && <span>• {item.role}</span>}
                  {item.since_year && <span>• Depuis {item.since_year}</span>}
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
            Aucun club ou association ajouté
          </p>
        )}

        {isEditable && (
          <Button variant="outline" className="w-full mt-3" onClick={() => handleOpenAdd()}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Modifier" : "Ajouter"} un club</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom du club *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Yacht Club de Monaco"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Input
                  value={formData.club_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, club_type: e.target.value }))}
                  placeholder="Ex: Yacht Club, Cercle"
                />
              </div>
              <div>
                <Label>Membre depuis</Label>
                <Input
                  value={formData.since_year}
                  onChange={(e) => setFormData(prev => ({ ...prev, since_year: e.target.value }))}
                  placeholder="Ex: 2015"
                />
              </div>
            </div>
            <div>
              <Label>Rôle</Label>
              <Input
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                placeholder="Ex: Membre fondateur, Président"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description du club et de votre implication..."
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
