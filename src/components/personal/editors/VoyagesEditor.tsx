import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { X, Sparkles, Loader2, FileUp, Plane } from "lucide-react";

function getVoyageImageSrc(url: string | undefined | null): string | null {
  if (url == null || typeof url !== "string") return null;
  const s = String(url).trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("data:")) return s.replace(/\r?\n/g, "");
  if (s.startsWith("/") || s.startsWith("./") || s.startsWith("../")) return s;
  return `/${s.replace(/^\/*/, "")}`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Impossible de lire l'image"));
    reader.readAsDataURL(file);
  });
}

function VoyageImagePreview({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = getVoyageImageSrc(src);
  if (failed || !resolvedSrc) {
    return (
      <div className="w-full h-32 flex items-center justify-center bg-muted rounded-lg">
        <Plane className="w-10 h-10 text-muted-foreground" />
      </div>
    );
  }
  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className="w-full h-32 object-cover rounded-lg"
      onError={() => setFailed(true)}
      crossOrigin={resolvedSrc.startsWith("http") ? "anonymous" : undefined}
      referrerPolicy={resolvedSrc.startsWith("http") ? "no-referrer" : undefined}
    />
  );
}

interface VoyagesEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: any;
  onSave: () => void;
  defaultCategory?: string | null;
}

export const VoyagesEditor = ({ open, onOpenChange, entry, onSave, defaultCategory }: VoyagesEditorProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      id: "",
      destination: "",
      period: "",
      description: "",
      image_url: "",
      category: ""
    }
  });

  React.useEffect(() => {
    if (open) {
      if (entry) {
        reset({
          id: entry.id || "",
          destination: entry.destination || "",
          period: entry.period || "",
          description: entry.description || "",
          image_url: entry.image_url || "",
          category: entry.category || ""
        });
      } else {
        reset({ id: "", destination: "", period: "", description: "", image_url: "", category: defaultCategory || "" });
      }
    }
  }, [entry, reset, open, defaultCategory]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: t("error"), description: t("businessImageFormatNotAllowed") || "Format non supporté", variant: "destructive" });
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setValue("image_url", dataUrl);
      toast({ title: t("imageUploaded") });
    } catch {
      toast({ title: t("uploadError"), variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleAISuggest = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("personal-ai-suggest", {
        body: { module: "voyages", currentContent: watch("description") }
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
        destination: data.destination,
        period: data.period,
        description: data.description,
        image_url: data.image_url
      };

      if (data.id) {
        const { error } = await supabase
          .from("personal_voyages")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("personal_voyages")
          .insert({ ...payload, user_id: session.user.id });
        if (error) throw error;
      }

      toast({ title: data.id ? t("travelModified") : t("travelAdded") });
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
          <DialogTitle className="text-base sm:text-lg font-serif text-gold">
            {entry?.id ? t("edit") : t("add")} {t("travel")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
          {/* Destination & Période */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-medium text-gold/80">
                {t("destination")} *
              </Label>
              <Input
                {...register("destination", { required: true })}
                placeholder={t("exMaldivesAspen")}
                className="bg-background/40 border-gold/30 focus:border-gold/60 text-sm h-9 sm:h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-medium text-gold/80">
                {t("period")}
              </Label>
              <Input
                {...register("period")}
                placeholder={t("exSummerWinterAnnual")}
                className="bg-background/40 border-gold/30 focus:border-gold/60 text-sm h-9 sm:h-10"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm font-medium text-gold/80">
              {t("description")}
            </Label>
            <Textarea
              {...register("description")}
              placeholder={t("describeThisDestination")}
              rows={4}
              className="bg-background/40 border-gold/30 focus:border-gold/60 text-sm min-h-[90px] sm:min-h-[110px] resize-none"
            />
          </div>

          {/* Photo */}
          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm font-medium text-gold/80">
              {t("photo")}
            </Label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              disabled={uploading}
              className="flex h-9 sm:h-10 w-full rounded-md border border-gold/30 bg-background/40 px-3 py-1.5 text-xs sm:text-sm text-foreground"
            />
            {watch("image_url") && (
              <div className="relative mt-2">
                <VoyageImagePreview src={watch("image_url")} alt={t("photo")} />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={() => setValue("image_url", "")}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-gold/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto text-sm"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={uploading || submitting}
              className="w-full sm:w-auto bg-gold text-black hover:bg-gold/90 text-sm"
            >
              {submitting ? t("saving") : t("validate")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
