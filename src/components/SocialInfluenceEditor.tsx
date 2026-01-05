import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SocialInfluenceEditorProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  influence?: any;
  onSave: () => void;
}

export function SocialInfluenceEditor({ open, onOpenChange, influence, onSave }: SocialInfluenceEditorProps) {
  const [platform, setPlatform] = useState("");
  const [metric, setMetric] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (influence) {
      setPlatform(influence.platform || "");
      setMetric(influence.metric || "");
      setValue(influence.value || "");
      setDescription(influence.description || "");
      setImageUrl(influence.image_url || "");
    } else {
      setPlatform("");
      setMetric("");
      setValue("");
      setDescription("");
      setImageUrl("");
    }
  }, [influence, open]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('personal-content')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('personal-content')
        .getPublicUrl(filePath);

      setImageUrl(data.publicUrl);
      toast({ title: "Image téléchargée" });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: "Erreur lors du téléchargement", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Veuillez vous connecter", variant: "destructive" });
        return;
      }

      const influenceData = {
        user_id: user.id,
        platform,
        metric,
        value,
        description,
        image_url: imageUrl,
      };

      if (influence?.id) {
        const { error } = await supabase
          .from('social_influence')
          .update(influenceData)
          .eq('id', influence.id);

        if (error) throw error;
        toast({ title: "Influence modifiée" });
      } else {
        const { error } = await supabase
          .from('social_influence')
          .insert([influenceData]);

        if (error) throw error;
        toast({ title: "Influence ajoutée" });
      }

      onSave();
      if (onOpenChange) onOpenChange(false);
    } catch (error) {
      console.error('Error saving influence:', error);
      toast({ title: "Erreur lors de l'enregistrement", variant: "destructive" });
    }
  };

  const content = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="platform">Plateforme / Événement</Label>
        <Input
          id="platform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          placeholder="Instagram, Forbes, Gala de charité..."
          required
        />
      </div>

      <div>
        <Label htmlFor="metric">Métrique</Label>
        <Input
          id="metric"
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          placeholder="Abonnés, Couverture, Participation..."
          required
        />
      </div>

      <div>
        <Label htmlFor="value">Valeur</Label>
        <Input
          id="value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="250K, Article principal, Président d'honneur..."
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Décrivez votre impact..."
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="image">Image</Label>
        <div className="flex gap-2">
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
          />
          {uploading && <span className="text-sm text-muted-foreground">Téléchargement...</span>}
        </div>
        {imageUrl && (
          <img src={imageUrl} alt="Aperçu" className="mt-2 h-32 w-full object-cover rounded" />
        )}
      </div>

      <Button type="submit" className="w-full">
        {influence ? "Modifier" : "Ajouter"}
      </Button>
    </form>
  );

  if (open !== undefined && onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border border-gold/30 p-4 sm:p-6" data-scroll>
          <DialogHeader>
            <DialogTitle>
              {influence ? "Modifier l'influence" : "Ajouter une influence"}
            </DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border border-gold/30 p-4 sm:p-6" data-scroll>
        <DialogHeader>
          <DialogTitle>Ajouter une influence</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
