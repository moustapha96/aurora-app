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

interface GastronomieEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: any;
  onSave: () => void;
  defaultCategory?: string | null;
}

export const GastronomieEditor = ({ open, onOpenChange, entry, onSave, defaultCategory }: GastronomieEditorProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      id: "",
      title: "",
      category: "",
      description: "",
      image_url: ""
    }
  });

  React.useEffect(() => {
    if (open) {
      if (entry) {
        reset({
          id: entry.id || "",
          title: entry.title || "",
          category: entry.category || "",
          description: entry.description || "",
          image_url: entry.image_url || ""
        });
      } else {
        reset({ id: "", title: "", category: defaultCategory || "", description: "", image_url: "" });
      }
    }
  }, [entry, reset, open, defaultCategory]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Non authentifié");

      const fileExt = file.name.split(".").pop();
      const filePath = `${session.user.id}/gastro-${Date.now()}.${fileExt}`;

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
      toast({ title: "Erreur lors du téléchargement", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleAISuggest = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("personal-ai-suggest", {
        body: { module: "gastronomie", currentContent: watch("description") }
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
        category: data.category,
        description: data.description,
        image_url: data.image_url
      };

      if (data.id) {
        const { error } = await supabase
          .from("personal_gastronomie")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("personal_gastronomie")
          .insert({ ...payload, user_id: session.user.id });
        if (error) throw error;
      }

      toast({ title: data.id ? "Entrée modifiée" : "Entrée ajoutée" });
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
          <DialogTitle>{entry?.id ? "Modifier" : "Ajouter"} Gastronomie</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Titre *</Label>
              <Input {...register("title", { required: true })} placeholder="Ex: Cave à vins, Tables étoilées..." />
            </div>
            <div>
              <Label>Catégorie</Label>
              <Input {...register("category")} placeholder="Ex: Œnologie, Cuisine, Cigares..." />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea {...register("description")} placeholder="Décrivez votre passion gastronomique..." rows={4} />
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
