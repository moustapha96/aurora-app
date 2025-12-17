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

interface CloseFamilyMember {
  id?: string;
  relation_type: string;
  member_name: string;
  birth_year?: string;
  occupation?: string;
  description?: string;
  image_url?: string;
}

interface CloseFamilyEditorProps {
  members: CloseFamilyMember[];
  onUpdate: () => void;
}

const RELATION_TYPES = [
  "Époux/Épouse",
  "Fils",
  "Fille",
  "Frère",
  "Sœur",
  "Père",
  "Mère",
  "Autre"
];

export const CloseFamilyEditor = ({ members, onUpdate }: CloseFamilyEditorProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<CloseFamilyMember | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<CloseFamilyMember>({
    relation_type: "",
    member_name: "",
    birth_year: "",
    occupation: "",
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
      const fileName = `family-${user.id}-${Date.now()}.${fileExt}`;
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
    setEditingMember(null);
    setFormData({
      relation_type: "",
      member_name: "",
      birth_year: "",
      occupation: "",
      description: "",
      image_url: ""
    });
    setIsOpen(true);
  };

  const openEditDialog = (member: CloseFamilyMember) => {
    setEditingMember(member);
    setFormData({
      relation_type: member.relation_type,
      member_name: member.member_name,
      birth_year: member.birth_year || "",
      occupation: member.occupation || "",
      description: member.description || "",
      image_url: member.image_url || ""
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!formData.member_name || !formData.relation_type) {
      toast({ title: "Veuillez remplir les champs obligatoires", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      if (editingMember?.id) {
        await supabase
          .from('family_close')
          .update({
            relation_type: formData.relation_type,
            member_name: formData.member_name,
            birth_year: formData.birth_year || null,
            occupation: formData.occupation || null,
            description: formData.description || null,
            image_url: formData.image_url || null
          })
          .eq('id', editingMember.id);
      } else {
        await supabase
          .from('family_close')
          .insert({
            user_id: user.id,
            relation_type: formData.relation_type,
            member_name: formData.member_name,
            birth_year: formData.birth_year || null,
            occupation: formData.occupation || null,
            description: formData.description || null,
            image_url: formData.image_url || null,
            display_order: members.length
          });
      }

      toast({ title: editingMember ? "Modifié avec succès" : "Ajouté avec succès" });
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
    if (!confirm("Supprimer ce membre ?")) return;
    
    try {
      await supabase.from('family_close').delete().eq('id', id);
      toast({ title: "Supprimé" });
      onUpdate();
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-muted-foreground">Gérer la famille proche</h4>
        <Button size="sm" onClick={openNewDialog} className="bg-gold text-black hover:bg-gold/90">
          <Plus className="w-4 h-4 mr-1" />
          Ajouter
        </Button>
      </div>

      {members.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{member.member_name}</p>
                <p className="text-xs text-muted-foreground">{member.relation_type}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEditDialog(member)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(member.id!)}>
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
            <DialogTitle>{editingMember ? "Modifier" : "Ajouter"} un membre</DialogTitle>
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
              <Label>Relation *</Label>
              <Select value={formData.relation_type} onValueChange={(v) => setFormData({...formData, relation_type: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {RELATION_TYPES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
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
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Année de naissance</Label>
                <Input 
                  value={formData.birth_year} 
                  onChange={(e) => setFormData({...formData, birth_year: e.target.value})}
                  placeholder="1990"
                />
              </div>
              <div>
                <Label>Profession</Label>
                <Input 
                  value={formData.occupation} 
                  onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                  placeholder="Avocat, Médecin..."
                />
              </div>
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Quelques mots sur cette personne..."
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
