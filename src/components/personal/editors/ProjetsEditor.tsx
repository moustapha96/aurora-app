import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sparkles, Loader2, FileUp } from "lucide-react";

interface ProjetEntry {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  image_url: string | null;
}

interface ProjetsEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: ProjetEntry | null;
  onSave: () => void;
}

const getCategories = (t: (key: string) => string) => [
  { value: 'en_cours', label: t("projectInProgress") },
  { value: 'a_venir', label: t("upcomingProject") },
  { value: 'realises', label: t("completedProject") }
];

export const ProjetsEditor = ({ open, onOpenChange, entry, onSave }: ProjetsEditorProps) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const CATEGORIES = getCategories(t);

  useEffect(() => {
    if (entry) {
      setTitle(entry.title || "");
      setCategory(entry.category || "en_cours");
      setDescription(entry.description || "");
    }
  }, [entry]);

  const handleAISuggest = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("personal-ai-suggest", {
        body: { 
          module: "projets", 
          currentContent: description,
          context: { title, category }
        }
      });

      if (error) throw error;
      if (data?.suggestion) {
        setDescription(data.suggestion);
        toast.success(t("suggestionGenerated"));
      }
    } catch (error) {
      toast.error(t("generationError"));
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error(t("titleRequired"));
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthenticated"));

      const data = {
        user_id: user.id,
        title: title.trim(),
        category,
        description: description.trim() || null
      };

      if (entry?.id) {
        const { error } = await supabase
          .from('personal_collections')
          .update(data)
          .eq('id', entry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('personal_collections')
          .insert(data);
        if (error) throw error;
      }

      toast.success(entry?.id ? t("modified") : t("added"));
      onOpenChange(false);
      onSave();
    } catch (error) {
      console.error(error);
      toast.error(t("saveError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border border-gold/30 p-4 sm:p-6" data-scroll>
        <DialogHeader>
          <DialogTitle>{entry?.id ? t("edit") : t("add")} {t("project")}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>{t("status")}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t("projectTitle")} *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("exWritingBook")} />
          </div>

          <div>
            <Label>{t("description")}</Label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder={t("describeYourProject")}
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAISuggest}
                disabled={generating}
                className="gap-2"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {t("aiAurora")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('import-doc-projets')?.click()}
                className="gap-2"
              >
                <FileUp className="w-4 h-4" />
                {t("import")}
              </Button>
              <input
                id="import-doc-projets"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    toast.success(t("documentImportedAnalysisInProgress"));
                  }
                }}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-primary text-primary-foreground">
              {t("validate")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
