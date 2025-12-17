import { useState } from "react";
import { Lightbulb, Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PersonalModule } from "./PersonalModule";
import { PhilosophieEditor } from "./editors/PhilosophieEditor";

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
  mentors: "Mentors & Modèles",
  philosophie: "Philosophie de vie",
  citations: "Citations inspirantes",
  lectures: "Lectures marquantes"
};

export const PersonalPhilosophie = ({ entries, isEditable, onDataChange }: PersonalPhilosophieProps) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PhilosophieEntry | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);

  const handleCategoryClick = (category: CategoryType) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const handleAddToCategory = (category: CategoryType) => {
    setEditingEntry({ id: '', title: '', category, description: '', image_url: null });
    setEditorOpen(true);
  };

  const handleEdit = (entry: PhilosophieEntry) => {
    setEditingEntry(entry);
    setEditorOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('personal_art_culture')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Élément supprimé");
      onDataChange();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const renderCategory = (category: CategoryType) => {
    const categoryEntries = entries.filter(e => e.category === category);
    const isExpanded = selectedCategory === category;

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
          <span className="text-sm">{CATEGORY_LABELS[category]}</span>
          {categoryEntries.length > 0 && (
            <span className="text-xs text-muted-foreground">({categoryEntries.length})</span>
          )}
        </button>
        {isExpanded && (
          <div className="ml-5 mt-1 space-y-2">
            {categoryEntries.map((entry) => (
              <div key={entry.id} className="p-2 bg-muted/30 rounded-lg group">
                <div className="flex justify-between items-start">
                  <div className="flex-1 flex gap-2">
                    {entry.image_url && (
                      <img src={entry.image_url} alt="" className="w-10 h-10 rounded object-cover" />
                    )}
                    <div>
                      <h4 className="font-medium text-sm text-foreground">{entry.title}</h4>
                      {entry.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{entry.description}</p>
                      )}
                    </div>
                  </div>
                  {isEditable && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                <span>Ajouter</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <PersonalModule
      title="Philosophie & Inspirations"
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
