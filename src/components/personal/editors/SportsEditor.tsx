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
import { X, Sparkles, Loader2, FileUp } from "lucide-react";

interface SportsEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sport?: any;
  onSave: () => void;
  defaultCategory?: string | null;
}

export const SportsEditor = ({ open, onOpenChange, sport, onSave, defaultCategory }: SportsEditorProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
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
        // Pour la méditation, définir le titre par défaut à "Méditation / Recueillement"
        const defaultTitle = defaultCategory === "meditation" 
          ? (t("personalSportLabel_meditation_default") || "Méditation / Recueillement")
          : "";
        reset({
          id: "",
          title: defaultTitle,
          subtitle: "",
          description: "",
          badge_text: "",
          image_url: "",
          sport_type: defaultCategory || ""
        });
      }
    }
  }, [sport, reset, open, defaultCategory, t]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error(t("notAuthenticated"));

      const fileExt = file.name.split(".").pop()?.toLowerCase() || 'jpg';
      const filePath = `${session.user.id}/sport-${Date.now()}.${fileExt}`;
      
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
      console.error("Upload error:", error);
      toast({ title: t("uploadError"), variant: "destructive" });
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

      toast({ title: data.id ? t("sportModified") : t("sportAdded") });
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
      <DialogContent className="w-[95vw] sm:w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border border-gold/30 p-4 sm:p-6" data-scroll>
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">{sport?.id ? t("editSport") : t("addSport")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">{t("title")} *</Label>
              <Input 
                {...register("title", { required: true })} 
                value={watch("sport_type") === "meditation" ? t('personalSportLabel_meditation_default') : ""}
                placeholder=""
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-sm">{t("subtitle")}</Label>
              <Input 
                {...register("subtitle")} 
                placeholder=""
                className="text-sm"
              />
            </div>
          </div>
          <div>
            <Label className="text-sm">{t("badgeLevel")}</Label>
            <Input 
              {...register("badge_text")} 
              placeholder=""
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-sm">{t("description")}</Label>
            <Textarea 
              {...register("description")} 
              placeholder=""
              rows={4} 
              className="text-sm min-h-[100px]"
            />
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAISuggest}
                disabled={generating}
                className="gap-1.5 text-xs h-8 px-2.5 w-full sm:w-auto"
              >
                {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {t("aiAurora")}
              </Button>
              {/* <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('import-doc-sports')?.click()}
                className="gap-1.5 text-xs h-8 px-2.5 w-full sm:w-auto"
              >
                <FileUp className="w-3 h-3" />
                {t("import")}
              </Button>
              <input
                id="import-doc-sports"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    toast({ title: t("documentImported"), description: t("analysisInProgress") });
                  }
                }}
              /> */}
            </div>
          </div>
          <div>
            <Label className="text-sm">{t("photo")}</Label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            {watch("image_url") && (
              <div className="relative mt-2">
                <img 
                  src={watch("image_url")} 
                  alt="Preview" 
                  className="w-full h-32 sm:h-40 object-cover rounded-lg" 
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 sm:h-7 sm:w-7"
                  onClick={() => setValue("image_url", "")}
                >
                  <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto text-xs h-8 px-3"
            >
              {t("cancel")}
            </Button>
            <Button 
              type="submit" 
              size="sm"
              disabled={uploading || submitting} 
              className="bg-gold text-black hover:bg-gold/90 w-full sm:w-auto text-xs h-8 px-3"
            >
              {submitting ? t("saving") : t("validate")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
