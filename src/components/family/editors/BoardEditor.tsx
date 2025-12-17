import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Loader2, Upload, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BoardMember {
  id?: string;
  member_name: string;
  role: string;
  organization?: string;
  expertise?: string;
  description?: string;
  image_url?: string;
}

interface BoardEditorProps {
  members: BoardMember[];
  onUpdate: () => void;
}

export const BoardEditor = ({ members, onUpdate }: BoardEditorProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<BoardMember | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<BoardMember>({
    member_name: "",
    role: "",
    organization: "",
    expertise: "",
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
      const fileName = `${user.id}/board/${Date.now()}.${fileExt}`;

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
    setEditingMember(null);
    setFormData({
      member_name: "",
      role: "",
      organization: "",
      expertise: "",
      description: "",
      image_url: ""
    });
    setIsOpen(true);
  };

  const openEditDialog = (member: BoardMember) => {
    setEditingMember(member);
    setFormData({
      member_name: member.member_name,
      role: member.role,
      organization: member.organization || "",
      expertise: member.expertise || "",
      description: member.description || "",
      image_url: member.image_url || ""
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!formData.member_name || !formData.role) {
      toast({ title: "Veuillez remplir les champs obligatoires", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      if (editingMember?.id) {
        await supabase
          .from('family_board')
          .update({
            member_name: formData.member_name,
            role: formData.role,
            organization: formData.organization || null,
            expertise: formData.expertise || null,
            description: formData.description || null,
            image_url: formData.image_url || null
          })
          .eq('id', editingMember.id);
      } else {
        await supabase
          .from('family_board')
          .insert({
            user_id: user.id,
            member_name: formData.member_name,
            role: formData.role,
            organization: formData.organization || null,
            expertise: formData.expertise || null,
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
      await supabase.from('family_board').delete().eq('id', id);
      toast({ title: "Supprimé" });
      onUpdate();
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-muted-foreground">Réseau clé / Board</h4>
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
                <p className="text-xs text-muted-foreground">{member.role} {member.organization && `• ${member.organization}`}</p>
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
              <Label>Nom complet *</Label>
              <Input 
                value={formData.member_name} 
                onChange={(e) => setFormData({...formData, member_name: e.target.value})}
                placeholder="Prénom Nom"
              />
            </div>
            
            <div>
              <Label>Rôle / Fonction *</Label>
              <Input 
                value={formData.role} 
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                placeholder="Conseiller juridique, Mentor business..."
              />
            </div>
            
            <div>
              <Label>Organisation</Label>
              <Input 
                value={formData.organization} 
                onChange={(e) => setFormData({...formData, organization: e.target.value})}
                placeholder="Cabinet, Entreprise..."
              />
            </div>
            
            <div>
              <Label>Expertise</Label>
              <Input 
                value={formData.expertise} 
                onChange={(e) => setFormData({...formData, expertise: e.target.value})}
                placeholder="Finance, Droit, Immobilier..."
              />
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Rôle et apport au réseau familial..."
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
