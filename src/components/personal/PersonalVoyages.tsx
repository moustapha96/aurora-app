import React, { useState } from "react";
import { Plane, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonalModule } from "./PersonalModule";
import { VoyagesEditor } from "./editors/VoyagesEditor";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InlineEditableField } from "@/components/ui/inline-editable-field";

interface VoyageEntry {
  id: string;
  destination: string;
  period?: string;
  description?: string;
  image_url?: string;
  category?: string;
}

interface PersonalVoyagesProps {
  entries: VoyageEntry[];
  isEditable: boolean;
  onDataChange: () => void;
}

type CategoryType = 'europe' | 'asie' | 'amerique' | 'afrique' | 'oceanie' | 'autre';

const CATEGORY_LABELS: Record<CategoryType, string> = {
  europe: 'Europe',
  asie: 'Asie & Moyen-Orient',
  amerique: 'Amériques',
  afrique: 'Afrique',
  oceanie: 'Océanie & Pacifique',
  autre: 'Autres destinations'
};

export const PersonalVoyages = ({ entries, isEditable, onDataChange }: PersonalVoyagesProps) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<VoyageEntry | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [addCategory, setAddCategory] = useState<CategoryType | null>(null);
  const { toast } = useToast();

  const handleCategoryClick = (category: CategoryType) => {
    setSelectedCategory(prev => prev === category ? null : category);
  };

  const handleAddToCategory = (category: CategoryType) => {
    setAddCategory(category);
    setEditingEntry(null);
    setEditorOpen(true);
  };

  const handleEditorClose = (open: boolean) => {
    setEditorOpen(open);
    if (!open) {
      setEditingEntry(null);
      setAddCategory(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("personal_voyages")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Voyage supprimé" });
      onDataChange();
    } catch (error) {
      console.error("Delete error:", error);
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    }
  };

  const handleInlineUpdate = async (id: string, field: string, value: string) => {
    try {
      const { error } = await supabase
        .from("personal_voyages")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      onDataChange();
    } catch (error) {
      console.error("Update error:", error);
      toast({ title: "Erreur lors de la sauvegarde", variant: "destructive" });
    }
  };

  const getItemsByCategory = (category: CategoryType) => {
    return entries.filter(item => (item.category || 'autre') === category);
  };

  const renderCategory = (category: CategoryType) => {
    const items = getItemsByCategory(category);
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
          {items.length > 0 && (
            <span className="text-xs text-muted-foreground">({items.length})</span>
          )}
        </button>
        {isExpanded && (
          <div className="ml-5 mt-1 space-y-2">
            {items.map((item) => (
              <div key={item.id} className="p-2 bg-muted/30 rounded-lg group">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <InlineEditableField
                      value={item.destination}
                      onSave={(value) => handleInlineUpdate(item.id, "destination", value)}
                      placeholder="Destination"
                      disabled={!isEditable}
                      className="font-medium text-sm text-foreground"
                    />
                    {isEditable ? (
                      <InlineEditableField
                        value={item.period || ""}
                        onSave={(value) => handleInlineUpdate(item.id, "period", value)}
                        placeholder="Période"
                        className="text-xs text-gold"
                      />
                    ) : item.period && <span className="text-xs text-gold">{item.period}</span>}
                    {isEditable ? (
                      <InlineEditableField
                        value={item.description || ""}
                        onSave={(value) => handleInlineUpdate(item.id, "description", value)}
                        placeholder="Description"
                        multiline
                        className="text-xs text-muted-foreground"
                      />
                    ) : item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
                  </div>
                  {isEditable && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(item.id)}>
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
      title="Voyages & Destinations"
      icon={Plane}
      moduleType="voyages"
    >
      <div className="space-y-2">
        {(Object.keys(CATEGORY_LABELS) as CategoryType[])
          .sort((a, b) => {
            const aCount = getItemsByCategory(a).length;
            const bCount = getItemsByCategory(b).length;
            if (aCount > 0 && bCount === 0) return -1;
            if (aCount === 0 && bCount > 0) return 1;
            return 0;
          })
          .map(renderCategory)}
      </div>

      <VoyagesEditor
        open={editorOpen}
        onOpenChange={handleEditorClose}
        entry={editingEntry}
        onSave={onDataChange}
        defaultCategory={addCategory}
      />
    </PersonalModule>
  );
};
