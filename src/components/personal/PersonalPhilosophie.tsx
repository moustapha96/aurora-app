import { useState } from "react";
import { Lightbulb, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

type CategoryType = 'mentors' | 'philosophie' | 'citations' | 'lectures';

const CATEGORY_LABELS: Record<CategoryType, string> = {
  mentors: "mentors",
  philosophie: "philosophie",
  citations: "citations",
  lectures: "lectures"
};

export const PersonalPhilosophie = ({ entries, isEditable, onDataChange }: PersonalPhilosophieProps) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PhilosophieEntry | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const { t } = useLanguage();

  const handleCategoryClick = (category: CategoryType) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const handleAddToCategory = (category: CategoryType) => {
    setEditingEntry({ id: '', title: '', category, description: '', image_url: null });
    setEditorOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('personal_art_culture')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(t('personalEntryDeleted'));
      onDataChange();
    } catch (error) {
      toast.error(t('personalErrorDeletingEntry'));
    }
  };

  const handleInlineUpdate = async (id: string, field: string, value: string) => {
    try {
      const { error } = await supabase
        .from("personal_art_culture")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      onDataChange();
    } catch (error) {
      console.error("Update error:", error);
      toast.error(t('personalErrorSavingEntry'));
    }
  };

  const renderCategory = (category: CategoryType) => {
    const categoryEntries = entries.filter(e => e.category === category);
    const isExpanded = selectedCategory === category;

    const label = (() => {
      switch (category) {
        case 'mentors':
          return t('personalPhilosophyMentors');
        case 'philosophie':
          return t('personalPhilosophyLife');
        case 'citations':
          return t('personalPhilosophyQuotes');
        case 'lectures':
        default:
          return t('personalPhilosophyReadings');
      }
    })();

    return (
      <div key={category}>
        <button 
          onClick={() => handleCategoryClick(category)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-full group py-1"
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
          <span className="text-sm">{label}</span>
          {categoryEntries.length > 0 && (
            <span className="text-xs text-muted-foreground">({categoryEntries.length})</span>
          )}
        </button>
        {isExpanded && (
          <div className="ml-5 mt-1 space-y-2">
            {categoryEntries.map((entry) => (
              <div key={entry.id} className="p-2 bg-muted/30 rounded-lg group">
                <div className="flex justify-between items-start gap-2">
                  {entry.image_url && getPhilosophieImageSrc(entry.image_url) && (
                    <PhilosophieImage src={entry.image_url} alt={entry.title} />
                  )}
                  <div className="flex-1 min-w-0">
                      <InlineEditableField
                        value={entry.title}
                        onSave={(value) => handleInlineUpdate(entry.id, "title", value)}
                        placeholder={t('personalTitlePlaceholder')}
                        disabled={!isEditable}
                        className="font-medium text-sm text-foreground"
                      />
                      {isEditable ? (
                        <InlineEditableField
                          value={entry.description || ""}
                          onSave={(value) => handleInlineUpdate(entry.id, "description", value)}
                          placeholder={t('personalDescriptionPlaceholder')}
                          multiline
                          className="text-xs text-muted-foreground"
                        />
                      ) : entry.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{entry.description}</p>
                      )}
                  </div>
                  {isEditable && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(entry.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isEditable && (
              <button 
                onClick={() => handleAddToCategory(category)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>{t('add')}</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <PersonalModule
      title={t('personalPhilosophyTitle')}
      icon={Lightbulb}
      moduleType="philosophie"
    >
      <div className="space-y-1">
        {(Object.keys(CATEGORY_LABELS) as CategoryType[])
          .sort((a, b) => {
            const aCount = entries.filter(e => e.category === a).length;
            const bCount = entries.filter(e => e.category === b).length;
            if (aCount > 0 && bCount === 0) return -1;
            if (aCount === 0 && bCount > 0) return 1;
            return 0;
          })
          .map(renderCategory)}
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
