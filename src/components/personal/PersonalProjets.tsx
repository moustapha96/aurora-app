import { useState } from "react";
import { Rocket, Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PersonalModule } from "./PersonalModule";
import { ProjetsEditor } from "./editors/ProjetsEditor";
import { useLanguage } from "@/contexts/LanguageContext";

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

const CATEGORY_LABELS: Record<CategoryType, string> = {
  en_cours: "en_cours",
  a_venir: "a_venir",
  realises: "realises"
};

export const PersonalProjets = ({ entries, isEditable, onDataChange }: PersonalProjetsProps) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ProjetEntry | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const { t } = useLanguage();

  const handleCategoryClick = (category: CategoryType) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const handleAddToCategory = (category: CategoryType) => {
    setEditingEntry({ id: '', title: '', category, description: '', image_url: null });
    setEditorOpen(true);
  };

  const handleEdit = (entry: ProjetEntry) => {
    setEditingEntry(entry);
    setEditorOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('personal_collections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(t('personalProjectDeleted'));
      onDataChange();
    } catch (error) {
      toast.error(t('personalErrorDeletingEntry'));
    }
  };

  const renderCategory = (category: CategoryType) => {
    const categoryEntries = entries.filter(e => e.category === category);
    const isExpanded = selectedCategory === category;

    const label = (() => {
      switch (category) {
        case 'en_cours':
          return t('personalProjectsOngoing');
        case 'a_venir':
          return t('personalProjectsUpcoming');
        case 'realises':
        default:
          return t('personalProjectsCompleted');
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
                <div className="flex gap-3 justify-between items-start">
                  {entry.image_url && getProjetsImageSrc(entry.image_url) && (
                    <ProjetsImage src={entry.image_url} alt={entry.title} />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-foreground">{entry.title}</h4>
                    {entry.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{entry.description}</p>
                    )}
                  </div>
                  {isEditable && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(entry)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
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
      title={t('personalProjectsTitle')}
      icon={Rocket}
      moduleType="projets"
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

      <ProjetsEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        entry={editingEntry}
        onSave={onDataChange}
      />
    </PersonalModule>
  );
};
