import { useState } from "react";
import { Lightbulb, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PersonalModule } from "./PersonalModule";
import { PhilosophieEditor } from "./editors/PhilosophieEditor";
import { InlineEditableField } from "@/components/ui/inline-editable-field";
import { useLanguage } from "@/contexts/LanguageContext";

function getPhilosophieImageSrc(url: string | undefined | null): string | null {
  if (url == null || typeof url !== "string") return null;
  const s = String(url).trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("data:")) return s.replace(/\r?\n/g, "");
  if (s.startsWith("/") || s.startsWith("./") || s.startsWith("../")) return s;
  return `/${s.replace(/^\/*/, "")}`;
}

function PhilosophieImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = getPhilosophieImageSrc(src);
  if (failed || !resolvedSrc) {
    return (
      <div className="w-10 h-10 flex items-center justify-center bg-muted/50 rounded object-cover shrink-0">
        <Lightbulb className="w-5 h-5 text-muted-foreground" />
      </div>
    );
  }
  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className="w-10 h-10 rounded object-cover object-center shrink-0"
      loading="lazy"
      decoding="async"
      crossOrigin={resolvedSrc.startsWith("http") ? "anonymous" : undefined}
      referrerPolicy={resolvedSrc.startsWith("http") ? "no-referrer" : undefined}
      onError={() => setFailed(true)}
    />
  );
}

interface PhilosophieEntry {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  image_url: string | null;
}

interface PersonalPhilosophieProps {
  entries: PhilosophieEntry[];
  isEditable: boolean;
  onDataChange: () => void;
}

type CategoryType = "mentors" | "philosophie" | "citations" | "lectures";

export const PersonalPhilosophie = ({ entries, isEditable, onDataChange }: PersonalPhilosophieProps) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PhilosophieEntry | null>(null);
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('personal_philosophie')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: t('personalEntryDeleted') });
      onDataChange();
    } catch (error) {
      toast({ title: t('personalErrorDeletingEntry'), variant: "destructive" });
    }
  };

  const handleInlineUpdate = async (id: string, field: keyof PhilosophieEntry, value: string | null) => {
    try {
      const { error } = await supabase
        .from("personal_philosophie")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      onDataChange();
    } catch (error) {
      console.error("Update error:", error);
      toast({ title: t('personalErrorSavingEntry'), variant: "destructive" });
    }
  };

  const getCategoryLabel = (category: CategoryType) => {
    switch (category) {
      case "mentors":
        return t("personalPhilosophyMentors");
      case "philosophie":
        return t("personalPhilosophyLife");
      case "citations":
        return t("personalPhilosophyQuotes");
      case "lectures":
      default:
        return t("personalPhilosophyReadings");
    }
  };

  return (
    <PersonalModule
      title={t('personalPhilosophyTitle')}
      icon={Lightbulb}
      moduleType="philosophie"
    >
      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            {t("personalNoPhilosophyEntries") || "Aucune entrée enregistrée"}
          </p>
        ) : (
          entries.map((entry) => {
            const cat = (entry.category as CategoryType) || "philosophie";
            return (
              <div key={entry.id} className="p-2 sm:p-3 bg-muted/30 rounded-lg group">
                <div className="flex flex-col sm:flex-row items-start gap-3">
                  {isEditable ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEntry(entry);
                        setEditorOpen(true);
                      }}
                      className="shrink-0 focus:outline-none w-full sm:w-16 sm:h-16 max-h-24 sm:max-h-none rounded-lg overflow-hidden bg-muted/50"
                    >
                      {entry.image_url && getPhilosophieImageSrc(entry.image_url) ? (
                        <PhilosophieImage src={entry.image_url} alt={entry.title} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground border border-dashed border-gold/30">
                          {t("photo")}
                        </div>
                      )}
                    </button>
                  ) : (
                    entry.image_url &&
                    getPhilosophieImageSrc(entry.image_url) && (
                      <div className="w-full sm:w-16 sm:h-16 max-h-24 sm:max-h-none rounded-lg overflow-hidden bg-muted/50 sm:shrink-0">
                        <PhilosophieImage src={entry.image_url} alt={entry.title} />
                      </div>
                    )
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap justify-between">
                      <InlineEditableField
                        value={entry.title}
                        onSave={(value) => handleInlineUpdate(entry.id, "title", value)}
                        placeholder={t("personalTitlePlaceholder")}
                        disabled={!isEditable}
                        className="font-medium text-sm text-foreground flex-1 min-w-0"
                      />
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/30 whitespace-nowrap">
                        {getCategoryLabel(cat)}
                      </span>
                    </div>
                    {isEditable ? (
                      <InlineEditableField
                        value={entry.description || ""}
                        onSave={(value) => handleInlineUpdate(entry.id, "description", value)}
                        placeholder={t("personalDescriptionPlaceholder")}
                        multiline
                        className="text-xs text-muted-foreground w-full"
                      />
                    ) : (
                      entry.description && (
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words mt-1">
                          {entry.description}
                        </p>
                      )
                    )}
                  </div>
                  {isEditable && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-start sm:self-auto shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        {isEditable && (
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingEntry(null);
                setEditorOpen(true);
              }}
              className="text-xs gap-2 border-gold/40 text-gold hover:bg-gold/10"
            >
              <Plus className="w-3 h-3" />
              {t("add")}
            </Button>
          </div>
        )}
      </div>

      <PhilosophieEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        entry={editingEntry}
        onSave={onDataChange}
      />
    </PersonalModule>
  );
};
