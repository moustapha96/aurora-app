import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Loader2, Crown, Sparkles } from "lucide-react";
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingField, setGeneratingField] = useState<string | null>(null);
  
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

  const handleAISuggest = async (field: 'values_text' | 'legacy_vision' | 'heritage_description') => {
    setIsGenerating(true);
    setGeneratingField(field);
    try {
      const { data, error } = await supabase.functions.invoke('family-ai-suggest', {
        body: {
          module: 'heritage',
          currentInput: {
            motto: formData.motto,
            field
          }
        }
      });
      if (error) throw error;
      if (data?.suggestion) {
        setFormData({ ...formData, [field]: data.suggestion });
        toast({ title: "Suggestion générée" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Erreur lors de la génération", variant: "destructive" });
    } finally {
      setIsGenerating(false);
      setGeneratingField(null);
    }
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
              <div className="flex items-center justify-between mb-1">
                <Label>Valeurs transmises</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAISuggest('values_text')}
                  disabled={isGenerating}
                  className="text-gold hover:text-gold/80 h-6 px-2"
                >
                  {generatingField === 'values_text' ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 mr-1" />
                  )}
                  IA
                </Button>
              </div>
              <Textarea 
                value={formData.values_text} 
                onChange={(e) => setFormData({...formData, values_text: e.target.value})}
                placeholder="Les valeurs fondatrices de votre famille..."
                rows={3}
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Vision de transmission</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAISuggest('legacy_vision')}
                  disabled={isGenerating}
                  className="text-gold hover:text-gold/80 h-6 px-2"
                >
                  {generatingField === 'legacy_vision' ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 mr-1" />
                  )}
                  IA
                </Button>
              </div>
              <Textarea 
                value={formData.legacy_vision} 
                onChange={(e) => setFormData({...formData, legacy_vision: e.target.value})}
                placeholder="Comment souhaitez-vous transmettre cet héritage..."
                rows={3}
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Description de l'héritage</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAISuggest('heritage_description')}
                  disabled={isGenerating}
                  className="text-gold hover:text-gold/80 h-6 px-2"
                >
                  {generatingField === 'heritage_description' ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 mr-1" />
                  )}
                  IA
                </Button>
              </div>
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
