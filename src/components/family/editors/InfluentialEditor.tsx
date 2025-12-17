import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Loader2, Upload, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InfluentialPerson {
  id?: string;
  person_name: string;
  relationship?: string;
  context?: string;
  description?: string;
  image_url?: string;
}

interface InfluentialEditorProps {
  people: InfluentialPerson[];
  onUpdate: () => void;
}

export const InfluentialEditor = ({ people, onUpdate }: InfluentialEditorProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<InfluentialPerson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<InfluentialPerson>({
    person_name: "",
    relationship: "",
    context: "",
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
      const fileName = `${user.id}/influential/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('personal-content')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('personal-content')
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: publicUrl });
      toast({ title: "Photo téléchargée" });
    } catch (error) {
      console.error(error);
      toast({ title: "Erreur lors du téléchargement", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const openNewDialog = () => {
    setEditingPerson(null);
    setFormData({
      person_name: "",
      relationship: "",
      context: "",
      description: "",
      image_url: ""
    });
    setIsOpen(true);
  };

  const openEditDialog = (person: InfluentialPerson) => {
    setEditingPerson(person);
    setFormData({
      person_name: person.person_name,
      relationship: person.relationship || "",
      context: person.context || "",
      description: person.description || "",
      image_url: person.image_url || ""
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!formData.person_name) {
      toast({ title: "Veuillez indiquer le nom", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      if (editingPerson?.id) {
        await supabase
          .from('family_influential')
          .update({
            person_name: formData.person_name,
            relationship: formData.relationship || null,
            context: formData.context || null,
            description: formData.description || null,
            image_url: formData.image_url || null
          })
          .eq('id', editingPerson.id);
      } else {
        await supabase
          .from('family_influential')
          .insert({
            user_id: user.id,
            person_name: formData.person_name,
            relationship: formData.relationship || null,
            context: formData.context || null,
            description: formData.description || null,
            image_url: formData.image_url || null,
            display_order: people.length
          });
      }

      toast({ title: editingPerson ? "Modifié avec succès" : "Ajouté avec succès" });
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
    if (!confirm("Supprimer cette personne ?")) return;
    
    try {
      await supabase.from('family_influential').delete().eq('id', id);
      toast({ title: "Supprimé" });
      onUpdate();
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-muted-foreground">Personnes marquantes</h4>
        <Button size="sm" onClick={openNewDialog} className="bg-gold text-black hover:bg-gold/90">
          <Plus className="w-4 h-4 mr-1" />
          Ajouter
        </Button>
      </div>

      {people.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {people.map((person) => (
            <div key={person.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{person.person_name}</p>
                <p className="text-xs text-muted-foreground">{person.relationship || person.context}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEditDialog(person)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(person.id!)}>
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
            <DialogTitle>{editingPerson ? "Modifier" : "Ajouter"} une personne</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Photo upload */}
            <div className="flex flex-col items-center gap-3">
              <div 
                className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-border hover:border-gold transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.image_url ? (
                  <img src={formData.image_url} alt="Photo" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
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
                {formData.image_url ? "Changer la photo" : "Ajouter une photo"}
              </Button>
            </div>

            <div>
              <Label>Nom *</Label>
              <Input 
                value={formData.person_name} 
                onChange={(e) => setFormData({...formData, person_name: e.target.value})}
                placeholder="Prénom Nom"
              />
            </div>
            
            <div>
              <Label>Relation</Label>
              <Input 
                value={formData.relationship} 
                onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                placeholder="Mentor, Ami proche, Parrain..."
              />
            </div>
            
            <div>
              <Label>Contexte</Label>
              <Input 
                value={formData.context} 
                onChange={(e) => setFormData({...formData, context: e.target.value})}
                placeholder="Business, Arts, Philanthropie..."
              />
            </div>
            
            <div>
              <Label>Description / Impact</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="En quoi cette personne vous a marqué..."
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
