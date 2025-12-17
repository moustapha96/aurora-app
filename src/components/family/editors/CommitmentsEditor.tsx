import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2, Upload, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Commitment {
  id?: string;
  title: string;
  category?: string;
  organization?: string;
  start_year?: string;
  description?: string;
  image_url?: string;
}

interface CommitmentsEditorProps {
  commitments: Commitment[];
  onUpdate: () => void;
}

const CATEGORIES = [
  "Philanthropie",
  "Éducation",
  "Santé",
  "Environnement",
  "Culture & Arts",
  "Social",
  "Sport",
  "Autre"
];

export const CommitmentsEditor = ({ commitments, onUpdate }: CommitmentsEditorProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Commitment>({
    title: "",
    category: "",
    organization: "",
    start_year: "",
    description: "",
    image_url: ""
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/commitments/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('personal-content')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('personal-content')
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: publicUrl });
      toast({ title: "Image téléchargée" });
    } catch (error) {
      console.error(error);
      toast({ title: "Erreur lors du téléchargement", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const openNewDialog = () => {
    setEditingCommitment(null);
    setFormData({
      title: "",
      category: "",
      organization: "",
      start_year: "",
      description: "",
      image_url: ""
    });
    setIsOpen(true);
  };

  const openEditDialog = (commitment: Commitment) => {
    setEditingCommitment(commitment);
    setFormData({
      title: commitment.title,
      category: commitment.category || "",
      organization: commitment.organization || "",
      start_year: commitment.start_year || "",
      description: commitment.description || "",
      image_url: commitment.image_url || ""
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast({ title: "Veuillez indiquer un titre", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      if (editingCommitment?.id) {
        await supabase
          .from('family_commitments')
          .update({
            title: formData.title,
            category: formData.category || null,
            organization: formData.organization || null,
            start_year: formData.start_year || null,
            description: formData.description || null,
            image_url: formData.image_url || null
          })
          .eq('id', editingCommitment.id);
      } else {
        await supabase
          .from('family_commitments')
          .insert({
            user_id: user.id,
            title: formData.title,
            category: formData.category || null,
            organization: formData.organization || null,
            start_year: formData.start_year || null,
            description: formData.description || null,
            image_url: formData.image_url || null,
            display_order: commitments.length
          });
      }

      toast({ title: editingCommitment ? "Modifié avec succès" : "Ajouté avec succès" });
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
    if (!confirm("Supprimer cet engagement ?")) return;
    
    try {
      await supabase.from('family_commitments').delete().eq('id', id);
      toast({ title: "Supprimé" });
      onUpdate();
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-muted-foreground">Engagements familiaux</h4>
        <Button size="sm" onClick={openNewDialog} className="bg-gold text-black hover:bg-gold/90">
          <Plus className="w-4 h-4 mr-1" />
          Ajouter
        </Button>
      </div>

      {commitments.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {commitments.map((commitment) => (
            <div key={commitment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{commitment.title}</p>
                <p className="text-xs text-muted-foreground">{commitment.category} {commitment.organization && `• ${commitment.organization}`}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEditDialog(commitment)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(commitment.id!)}>
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
            <DialogTitle>{editingCommitment ? "Modifier" : "Ajouter"} un engagement</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Image upload */}
            <div className="flex flex-col items-center gap-3">
              <div 
                className="w-32 h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-border hover:border-gold transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.image_url ? (
                  <img src={formData.image_url} alt="Image" className="w-full h-full object-cover" />
                ) : (
                  <Image className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                {formData.image_url ? "Changer l'image" : "Ajouter une image"}
              </Button>
            </div>

            <div>
              <Label>Titre / Nom de l'engagement *</Label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Fondation familiale, Mécénat..."
              />
            </div>
            
            <div>
              <Label>Catégorie</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Organisation</Label>
                <Input 
                  value={formData.organization} 
                  onChange={(e) => setFormData({...formData, organization: e.target.value})}
                  placeholder="Fondation, ONG..."
                />
              </div>
              <div>
                <Label>Depuis</Label>
                <Input 
                  value={formData.start_year} 
                  onChange={(e) => setFormData({...formData, start_year: e.target.value})}
                  placeholder="2015"
                />
              </div>
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Objectifs, actions, impact..."
                rows={4}
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
