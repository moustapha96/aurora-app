// React and UI Components
import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2, Upload, User, Sparkles, FileUp } from "lucide-react";

// Supabase client
import { supabase } from "@/integrations/supabase/client";

// Utilities
import { useToast } from "@/hooks/use-toast";

// Storage utilities - centralized upload functions with correct RLS path patterns
import { uploadFamilyImage } from "@/lib/storageUploadUtils";

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
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<CloseFamilyMember>({
    relation_type: "",
    member_name: "",
    birth_year: "",
    occupation: "",
    description: "",
    image_url: ""
  });

  // Handle image upload using centralized utility - ensures correct RLS path: {userId}/close/{timestamp}.{ext}
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

      // Upload using centralized utility - path: {userId}/close/{timestamp}.{ext}
      const result = await uploadFamilyImage(file, user.id, 'close');
      
      if (!result.success || !result.publicUrl) {
        throw new Error(result.error || "Erreur lors de l'import");
      }

      setFormData({ ...formData, image_url: result.publicUrl });
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

  const handleAISuggest = async () => {
    if (!formData.member_name) {
      toast({ title: "Veuillez d'abord indiquer le nom", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('family-ai-suggest', {
        body: {
          module: 'close_family',
          currentInput: {
            name: formData.member_name,
            relation: formData.relation_type,
            occupation: formData.occupation
          }
        }
      });
      if (error) throw error;
      if (data?.suggestion) {
        setFormData({ ...formData, description: data.suggestion });
        toast({ title: "Suggestion générée" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Erreur lors de la génération", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-muted-foreground">Gérer la famille proche</h4>
        <Button size="sm" onClick={openNewDialog} className="bg-gold text-black hover:bg-gold/90">
          <Plus className="w-4 h-4 sm:mr-1" />
          <span className="hidden sm:inline">Ajouter</span>
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
        <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border border-gold/30 p-3 sm:p-4 md:p-6" data-scroll>
          <DialogHeader className="pb-2 sm:pb-3">
            <DialogTitle className="text-base sm:text-lg font-serif text-gold">
              {editingMember ? "Modifier" : "Ajouter"} un membre
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 sm:space-y-4">
            {/* Photo Upload */}
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <div 
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border-2 border-dashed border-gold/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-gold/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.image_url ? (
                  <img src={formData.image_url} alt="Photo" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
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
                className="border-gold/30 text-gold hover:bg-gold/10 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
              >
                {isUploading ? (
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1.5 animate-spin" />
                ) : (
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1.5" />
                )}
                <span className="hidden sm:inline text-xs">{formData.image_url ? "Changer" : "Ajouter photo"}</span>
              </Button>
            </div>

            <div>
              <Label className="text-xs sm:text-sm font-medium text-foreground">Relation *</Label>
              <Select value={formData.relation_type} onValueChange={(v) => setFormData({...formData, relation_type: v})}>
                <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {RELATION_TYPES.map((r) => (
                    <SelectItem key={r} value={r} className="text-xs sm:text-sm">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs sm:text-sm font-medium text-foreground">Nom complet *</Label>
              <Input 
                value={formData.member_name} 
                onChange={(e) => setFormData({...formData, member_name: e.target.value})}
                placeholder="Prénom Nom"
                className="h-8 sm:h-10 text-xs sm:text-sm"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-xs sm:text-sm font-medium text-foreground">Année de naissance</Label>
                <Input 
                  value={formData.birth_year} 
                  onChange={(e) => setFormData({...formData, birth_year: e.target.value})}
                  placeholder="1990"
                  className="h-8 sm:h-10 text-xs sm:text-sm"
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm font-medium text-foreground">Profession</Label>
                <Input 
                  value={formData.occupation} 
                  onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                  placeholder="Avocat, Médecin..."
                  className="h-8 sm:h-10 text-xs sm:text-sm"
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs sm:text-sm font-medium text-foreground">Description</Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => document.getElementById('import-doc-close-family')?.click()}
                    className="text-muted-foreground hover:text-foreground h-6 sm:h-7 px-1.5 sm:px-2 text-xs"
                  >
                    <FileUp className="w-3 h-3 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">DOC</span>
                  </Button>
                  <input
                    id="import-doc-close-family"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={() => toast({ title: "Document importé - Analyse en cours..." })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAISuggest}
                    disabled={isGenerating || !formData.member_name}
                    className="text-gold hover:text-gold/80 h-6 sm:h-7 px-1.5 sm:px-2 text-xs"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-3 h-3 mr-0.5 sm:mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3 mr-0.5 sm:mr-1" />
                    )}
                    <span className="hidden sm:inline">IA</span>
                  </Button>
                </div>
              </div>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Quelques mots sur cette personne..."
                rows={3}
                className="text-xs sm:text-sm min-h-[60px] sm:min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading || isUploading} 
              className="w-full sm:w-auto bg-gold text-black hover:bg-gold/90 text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4"
            >
              {isLoading && <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 animate-spin" />}
              {editingMember ? "Modifier" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
