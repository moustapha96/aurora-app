import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Loader2, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HeritageData {
  id?: string;
  motto?: string;
  values_text?: string;
  legacy_vision?: string;
  heritage_description?: string;
  banner_image_url?: string;
}

interface HeritageEditorProps {
  heritage: HeritageData | null;
  onUpdate: () => void;
}

export const HeritageEditor = ({ heritage, onUpdate }: HeritageEditorProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<HeritageData>({
    motto: heritage?.motto || "",
    values_text: heritage?.values_text || "",
    legacy_vision: heritage?.legacy_vision || "",
    heritage_description: heritage?.heritage_description || ""
  });

  const openDialog = () => {
    setFormData({
      motto: heritage?.motto || "",
      values_text: heritage?.values_text || "",
      legacy_vision: heritage?.legacy_vision || "",
      heritage_description: heritage?.heritage_description || ""
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      await supabase
        .from('family_heritage')
        .upsert({
          user_id: user.id,
          motto: formData.motto || null,
          values_text: formData.values_text || null,
          legacy_vision: formData.legacy_vision || null,
          heritage_description: formData.heritage_description || null
        }, { onConflict: 'user_id' });

      toast({ title: "Enregistré avec succès" });
      setIsOpen(false);
      onUpdate();
    } catch (error) {
      console.error(error);
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-muted-foreground">Héritage & Transmission</h4>
        <Button size="sm" onClick={openDialog} className="bg-gold text-black hover:bg-gold/90">
          <Pencil className="w-4 h-4 mr-1" />
          Modifier
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-gold" />
              Modifier l'héritage familial
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Devise familiale</Label>
              <Input 
                value={formData.motto} 
                onChange={(e) => setFormData({...formData, motto: e.target.value})}
                placeholder="Ex: L'excellence par le travail"
              />
            </div>
            
            <div>
              <Label>Valeurs transmises</Label>
              <Textarea 
                value={formData.values_text} 
                onChange={(e) => setFormData({...formData, values_text: e.target.value})}
                placeholder="Les valeurs fondatrices de votre famille..."
                rows={3}
              />
            </div>
            
            <div>
              <Label>Vision de transmission</Label>
              <Textarea 
                value={formData.legacy_vision} 
                onChange={(e) => setFormData({...formData, legacy_vision: e.target.value})}
                placeholder="Comment souhaitez-vous transmettre cet héritage..."
                rows={3}
              />
            </div>
            
            <div>
              <Label>Description de l'héritage</Label>
              <Textarea 
                value={formData.heritage_description} 
                onChange={(e) => setFormData({...formData, heritage_description: e.target.value})}
                placeholder="L'histoire et la richesse de votre patrimoine familial..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={isLoading} className="bg-gold text-black hover:bg-gold/90">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
