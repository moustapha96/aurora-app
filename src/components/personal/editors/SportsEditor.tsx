import React from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, Sparkles, Loader2 } from "lucide-react";

interface SportsEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sport?: any;
  onSave: () => void;
  defaultCategory?: string | null;
}

export const SportsEditor = ({ open, onOpenChange, sport, onSave, defaultCategory }: SportsEditorProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      id: "",
      title: "",
      subtitle: "",
      description: "",
      badge_text: "",
      image_url: "",
      sport_type: ""
    }
  });

  React.useEffect(() => {
    if (open) {
      if (sport) {
        reset({
          id: sport.id || "",
          title: sport.title || "",
          subtitle: sport.subtitle || "",
          description: sport.description || "",
          badge_text: sport.badge_text || "",
          image_url: sport.image_url || "",
          sport_type: sport.sport_type || ""
        });
      } else {
        reset({
          id: "",
          title: "",
          subtitle: "",
          description: "",
          badge_text: "",
          image_url: "",
          sport_type: defaultCategory || ""
        });
      }
    }
  }, [sport, reset, open, defaultCategory]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Non authentifié");

      const fileExt = file.name.split(".").pop();
      const filePath = `${session.user.id}/sport-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("personal-content")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("personal-content")
        .getPublicUrl(filePath);

      setValue("image_url", publicUrl);
      toast({ title: "Image téléchargée" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Erreur lors du téléchargement", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleAISuggest = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("personal-ai-suggest", {
        body: { module: "sports", currentContent: watch("description") }
      });

      if (error) throw error;
      if (data?.suggestion) {
        setValue("description", data.suggestion);
        toast({ title: "Suggestion générée" });
      }
    } catch (error) {
      toast({ title: "Erreur lors de la génération", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const onSubmit = async (data: any) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({ title: "Vous devez être connecté", variant: "destructive" });
        return;
      }

      const payload = {
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        badge_text: data.badge_text,
        image_url: data.image_url,
        sport_type: data.sport_type
      };

      if (data.id) {
        const { error } = await supabase
          .from("sports_hobbies")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sports_hobbies")
          .insert({ ...payload, user_id: session.user.id });
        if (error) throw error;
      }

      toast({ title: data.id ? "Sport modifié" : "Sport ajouté" });
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Save error:", error);
      toast({ title: "Erreur lors de l'enregistrement", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{sport?.id ? "Modifier le sport" : "Ajouter un sport"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Titre *</Label>
              <Input {...register("title", { required: true })} placeholder="Ex: Golf, Yachting..." />
            </div>
            <div>
              <Label>Sous-titre</Label>
              <Input {...register("subtitle")} placeholder="Ex: Club de Monaco..." />
            </div>
          </div>
          <div>
            <Label>Badge / Niveau</Label>
            <Input {...register("badge_text")} placeholder="Ex: Expert, Handicap 5..." />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea {...register("description")} placeholder="Décrivez votre passion..." rows={4} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAISuggest}
              disabled={generating}
              className="mt-2 gap-2"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Suggestion IA
            </Button>
          </div>
          <div>
            <Label>Photo</Label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            {watch("image_url") && (
              <div className="relative mt-2">
                <img src={watch("image_url")} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => setValue("image_url", "")}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={uploading || submitting} className="bg-gold text-black hover:bg-gold/90">
              {submitting ? "Enregistrement..." : "Valider"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
