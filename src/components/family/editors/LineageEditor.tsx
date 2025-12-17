import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2, Upload, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LineageEntry {
  id?: string;
  generation: string;
  member_name: string;
  title?: string;
  origin_location?: string;
  birth_year?: string;
  description?: string;
  image_url?: string;
}

interface LineageEditorProps {
  entries: LineageEntry[];
  onUpdate: () => void;
}

const GENERATIONS = [
  "Arrière-grands-parents",
  "Grands-parents",
  "Parents",
  "Génération actuelle",
  "Enfants",
  "Petits-enfants"
];

export const LineageEditor = ({ entries, onUpdate }: LineageEditorProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LineageEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<LineageEntry>({
    generation: "",
    member_name: "",
    title: "",
    origin_location: "",
    birth_year: "",
    description: "",
    image_url: ""
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Veuillez sélectionner une image", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const fileExt = file.name.split('.').pop();
      const fileName = `lineage-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('personal-content')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('personal-content')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      toast({ title: "Photo importée avec succès" });
    } catch (error) {
      console.error(error);
      toast({ title: "Erreur lors de l'import", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const openNewDialog = () => {
    setEditingEntry(null);
    setFormData({
      generation: "",
      member_name: "",
      title: "",
      origin_location: "",
      birth_year: "",
      description: "",
      image_url: ""
    });
    setIsOpen(true);
  };

  const openEditDialog = (entry: LineageEntry) => {
    setEditingEntry(entry);
    setFormData({
      generation: entry.generation,
      member_name: entry.member_name,
      title: entry.title || "",
      origin_location: entry.origin_location || "",
      birth_year: entry.birth_year || "",
      description: entry.description || "",
      image_url: entry.image_url || ""
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!formData.member_name || !formData.generation) {
      toast({ title: "Veuillez remplir les champs obligatoires", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      if (editingEntry?.id) {
        await supabase
          .from('family_lineage')
          .update({
            generation: formData.generation,
            member_name: formData.member_name,
            title: formData.title || null,
            origin_location: formData.origin_location || null,
            birth_year: formData.birth_year || null,
            description: formData.description || null,
            image_url: formData.image_url || null
          })
          .eq('id', editingEntry.id);
      } else {
        await supabase
          .from('family_lineage')
          .insert({
            user_id: user.id,
            generation: formData.generation,
            member_name: formData.member_name,
            title: formData.title || null,
            origin_location: formData.origin_location || null,
            birth_year: formData.birth_year || null,
            description: formData.description || null,
            image_url: formData.image_url || null,
            display_order: entries.length
          });
      }

      toast({ title: editingEntry ? "Modifié avec succès" : "Ajouté avec succès" });
      setIsOpen(false);
      onUpdate();
    } catch (error) {
      console.error(error);
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette entrée ?")) return;
    
    try {
      await supabase.from('family_lineage').delete().eq('id', id);
      toast({ title: "Supprimé" });
      onUpdate();
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 relative z-10">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-muted-foreground">Gérer la lignée</h4>
        <Button 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            openNewDialog();
          }} 
          className="bg-gold text-black hover:bg-gold/90 relative z-20"
          type="button"
        >
          <Plus className="w-4 h-4 mr-1" />
          Ajouter
        </Button>
      </div>

      {entries.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{entry.member_name}</p>
                <p className="text-xs text-muted-foreground">{entry.generation}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEditDialog(entry)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(entry.id!)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Modifier" : "Ajouter"} un membre</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Photo Upload */}
            <div className="flex flex-col items-center gap-3">
              <div 
                className="w-24 h-24 rounded-full border-2 border-dashed border-gold/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-gold/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.image_url ? (
                  <img src={formData.image_url} alt="Photo" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="border-gold/30 text-gold hover:bg-gold/10"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {formData.image_url ? "Changer la photo" : "Ajouter une photo"}
              </Button>
            </div>

            <div>
              <Label>Génération *</Label>
              <Select value={formData.generation} onValueChange={(v) => setFormData({...formData, generation: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {GENERATIONS.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Nom complet *</Label>
              <Input 
                value={formData.member_name} 
                onChange={(e) => setFormData({...formData, member_name: e.target.value})}
                placeholder="Prénom Nom"
              />
            </div>
            
            <div>
              <Label>Titre / Fonction</Label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Ex: Fondateur de..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Origine</Label>
                <Input 
                  value={formData.origin_location} 
                  onChange={(e) => setFormData({...formData, origin_location: e.target.value})}
                  placeholder="Ville, Pays"
                />
              </div>
              <div>
                <Label>Année de naissance</Label>
                <Input 
                  value={formData.birth_year} 
                  onChange={(e) => setFormData({...formData, birth_year: e.target.value})}
                  placeholder="1950"
                />
              </div>
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Parcours, anecdotes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={isLoading || isUploading} className="bg-gold text-black hover:bg-gold/90">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
