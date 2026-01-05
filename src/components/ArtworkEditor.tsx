import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ArtworkFormData {
  title: string;
  artist: string;
  year: string;
  medium: string;
  price: string;
  acquisition: string;
  description: string;
  image_url?: string;
}

interface ArtworkEditorProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  artwork?: any;
  onSave: () => void;
}

export const ArtworkEditor: React.FC<ArtworkEditorProps> = ({ open: controlledOpen, onOpenChange, artwork, onSave }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [formData, setFormData] = useState<ArtworkFormData>(artwork || {
    title: "",
    artist: "",
    year: "",
    medium: "",
    price: "",
    acquisition: "",
    description: "",
  });
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('personal-content')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('personal-content')
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: publicUrl });
      toast({ title: "Image téléchargée avec succès" });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ 
        title: "Erreur lors du téléchargement", 
        variant: "destructive" 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (artwork?.id) {
        const { error } = await supabase
          .from('artwork_collection')
          .update(formData)
          .eq('id', artwork.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('artwork_collection')
          .insert([{ ...formData, user_id: user.id }]);
        
        if (error) throw error;
      }

      toast({ title: artwork?.id ? "Œuvre modifiée" : "Œuvre ajoutée" });
      setOpen(false);
      onSave();
    } catch (error) {
      console.error('Error saving artwork:', error);
      toast({ 
        title: "Erreur lors de la sauvegarde", 
        variant: "destructive" 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={artwork ? "sm" : "default"}>
          {artwork ? <Pencil className="w-4 h-4" /> : <><Plus className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Ajouter une œuvre</span></>}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border border-gold/30 p-4 sm:p-6" data-scroll>
        <DialogHeader>
          <DialogTitle>{artwork ? "Modifier l'œuvre" : "Ajouter une œuvre"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Image de l'œuvre</Label>
            <div className="flex items-center gap-4 mt-2">
              {formData.image_url && (
                <img 
                  src={formData.image_url} 
                  alt="Preview" 
                  className="w-32 h-32 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Titre</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Artiste</Label>
              <Input
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Année</Label>
              <Input
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Prix</Label>
              <Input
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label>Médium</Label>
            <Input
              value={formData.medium}
              onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Acquisition</Label>
            <Input
              value={formData.acquisition}
              onChange={(e) => setFormData({ ...formData, acquisition: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">
              {artwork ? "Modifier" : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
