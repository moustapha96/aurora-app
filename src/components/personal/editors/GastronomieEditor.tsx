import React from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
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
  const { t } = useLanguage();
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
      if (!session?.user) throw new Error(t("notAuthenticated"));

      const fileExt = file.name.split(".").pop()?.toLowerCase() || 'jpg';
      const filePath = `${session.user.id}/gastro-${Date.now()}.${fileExt}`;
      
      // Get correct MIME type
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp'
      };
      const contentType = mimeTypes[fileExt] || 'image/jpeg';
      
      // Create proper File object with correct MIME type
      const properFile = new File([file], file.name, { 
        type: contentType, 
        lastModified: Date.now() 
      });

      const { error: uploadError } = await supabase.storage
        .from("personal-content")
        .upload(filePath, properFile, { contentType });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("personal-content")
        .getPublicUrl(filePath);

      setValue("image_url", publicUrl);
      toast({ title: t("imageUploaded") });
    } catch (error) {
      toast({ title: t("uploadError"), variant: "destructive" });
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
        toast({ title: t("suggestionGenerated") });
      }
    } catch (error) {
      toast({ title: t("generationError"), variant: "destructive" });
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
        toast({ title: t("youMustBeConnected"), variant: "destructive" });
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

      toast({ title: data.id ? t("entryModified") : t("entryAdded") });
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Save error:", error);
      toast({ title: t("saveError"), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border border-gold/30 p-4 sm:p-6" data-scroll>
        <DialogHeader>
          <DialogTitle>{entry?.id ? t("edit") : t("add")} {t("gastronomy")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("title")} *</Label>
              <Input {...register("title", { required: true })} placeholder={t("exWineCellarStarredTables")} />
            </div>
            <div>
              <Label>{t("category")}</Label>
              <Input {...register("category")} placeholder={t("exOenologyCuisineCigars")} />
            </div>
          </div>
          <div>
            <Label>{t("description")}</Label>
            <Textarea {...register("description")} placeholder={t("describeYourGastronomicPassion")} rows={4} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAISuggest}
              disabled={generating}
              className="mt-2 gap-2"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {t("aiSuggestion")}
            </Button>
          </div>
          <div>
            <Label>{t("photo")}</Label>
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
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={uploading || submitting} className="bg-gold text-black hover:bg-gold/90">
              {submitting ? t("saving") : t("validate")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
