import { useState } from "react";
import { Rocket, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PersonalModule } from "./PersonalModule";
import { ProjetsEditor } from "./editors/ProjetsEditor";
import { useLanguage } from "@/contexts/LanguageContext";
import { InlineEditableField } from "@/components/ui/inline-editable-field";

function getProjetsImageSrc(url: string | undefined | null): string | null {
  if (url == null || typeof url !== "string") return null;
  const s = String(url).trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("data:")) return s.replace(/\r?\n/g, "");
  if (s.startsWith("/") || s.startsWith("./") || s.startsWith("../")) return s;
  return `/${s.replace(/^\/*/, "")}`;
}

function ProjetsImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = getProjetsImageSrc(src);
  if (failed || !resolvedSrc) {
    return (
      <div className="w-10 h-10 flex items-center justify-center bg-muted/50 rounded object-cover shrink-0">
        <Rocket className="w-5 h-5 text-muted-foreground" />
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

interface ProjetEntry {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  image_url: string | null;
}

interface PersonalProjetsProps {
  entries: ProjetEntry[];
  isEditable: boolean;
  onDataChange: () => void;
}

type CategoryType = 'en_cours' | 'a_venir' | 'realises';

export const PersonalProjets = ({ entries, isEditable, onDataChange }: PersonalProjetsProps) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ProjetEntry | null>(null);
  const { t } = useLanguage();

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('personal_projets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(t('personalProjectDeleted'));
      onDataChange();
    } catch (error) {
      toast.error(t('personalErrorDeletingEntry'));
    }
  };

  const handleInlineUpdate = async (id: string, field: keyof ProjetEntry, value: string | null) => {
    try {
      const { error } = await supabase
        .from("personal_projets")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      onDataChange();
    } catch (error) {
      console.error("Update error:", error);
      toast.error(t("personalErrorSavingEntry"));
    }
  };

  const getCategoryLabel = (category: CategoryType) => {
    switch (category) {
      case "en_cours":
        return t("personalProjectsOngoing");
      case "a_venir":
        return t("personalProjectsUpcoming");
      case "realises":
      default:
        return t("personalProjectsCompleted");
    }
  };

  
  return (
    <PersonalModule
      title={t('personalProjectsTitle')}
      icon={Rocket}
      moduleType="projets"
    >
      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            {t("personalNoProjects") || "Aucun projet enregistré"}
          </p>
        ) : (
          entries.map((entry) => {
            const cat = (entry.category as CategoryType) || "en_cours";
            return (
              <div key={entry.id} className="p-2 bg-muted/30 rounded-lg group">
                <div className="flex gap-3 justify-between items-start">
                  {isEditable ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEntry(entry);
                        setEditorOpen(true);
                      }}
                      className="shrink-0 focus:outline-none"
                    >
                      {entry.image_url && getProjetsImageSrc(entry.image_url) ? (
                        <ProjetsImage src={entry.image_url} alt={entry.title} />
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center bg-muted/50 rounded shrink-0 border border-dashed border-gold/30 text-[10px] text-muted-foreground">
                          {t("photo")}
                        </div>
                      )}
                    </button>
                  ) : (
                    entry.image_url &&
                    getProjetsImageSrc(entry.image_url) && (
                      <ProjetsImage src={entry.image_url} alt={entry.title} />
                    )
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap justify-between">
                      <InlineEditableField
                        value={entry.title}
                        onSave={(value) => handleInlineUpdate(entry.id, "title", value)}
                        placeholder={t("projectTitle")}
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
                        placeholder={t("describeYourProject")}
                        multiline
                        className="text-xs text-muted-foreground"
                      />
                    ) : (
                      entry.description && (
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                          {entry.description}
                        </p>
                      )
                    )}
                  </div>
                  {isEditable && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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

      <ProjetsEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        entry={editingEntry}
        onSave={onDataChange}
      />
    </PersonalModule>
  );
};
