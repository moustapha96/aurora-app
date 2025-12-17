import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProjetEntry {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  image_url: string | null;
}

interface ProjetsEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: ProjetEntry | null;
  onSave: () => void;
}

const CATEGORIES = [
  { value: 'en_cours', label: "Projet en cours" },
  { value: 'a_venir', label: "Projet à venir" },
  { value: 'realises', label: "Projet réalisé" }
];

export const ProjetsEditor = ({ open, onOpenChange, entry, onSave }: ProjetsEditorProps) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entry) {
      setTitle(entry.title || "");
      setCategory(entry.category || "en_cours");
      setDescription(entry.description || "");
    }
  }, [entry]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const data = {
        user_id: user.id,
        title: title.trim(),
        category,
        description: description.trim() || null
      };

      if (entry?.id) {
        const { error } = await supabase
          .from('personal_collections')
          .update(data)
          .eq('id', entry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('personal_collections')
          .insert(data);
        if (error) throw error;
      }

      toast.success(entry?.id ? "Modifié" : "Ajouté");
      onOpenChange(false);
      onSave();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{entry?.id ? "Modifier" : "Ajouter"} un projet</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Statut</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Titre du projet *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Écriture d'un livre" />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Décrivez votre projet..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-primary text-primary-foreground">
              Valider
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
