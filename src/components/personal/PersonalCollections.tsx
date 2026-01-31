import React, { useState } from "react";
import { Library, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonalModule } from "./PersonalModule";
import { CollectionsEditor } from "./editors/CollectionsEditor";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InlineEditableField } from "@/components/ui/inline-editable-field";
import { useLanguage } from "@/contexts/LanguageContext";

function getCollectionsImageSrc(url: string | undefined | null): string | null {
  if (url == null || typeof url !== "string") return null;
  const s = String(url).trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("data:")) return s.replace(/\r?\n/g, "");
  if (s.startsWith("/") || s.startsWith("./") || s.startsWith("../")) return s;
  return `/${s.replace(/^\/*/, "")}`;
}

function CollectionsImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = getCollectionsImageSrc(src);
  if (failed || !resolvedSrc) {
    return (
      <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-muted/50 rounded-lg shrink-0">
        <Library className="w-6 h-6 text-muted-foreground" />
      </div>
    );
  }
  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover object-center shrink-0"
      loading="lazy"
      decoding="async"
      crossOrigin={resolvedSrc.startsWith("http") ? "anonymous" : undefined}
      referrerPolicy={resolvedSrc.startsWith("http") ? "no-referrer" : undefined}
      onError={() => setFailed(true)}
    />
  );
}

interface CollectionEntry {
  id: string;
  title: string;
  category?: string;
  description?: string;
  image_url?: string;
}

interface PersonalCollectionsProps {
  entries: CollectionEntry[];
  isEditable: boolean;
  onDataChange: () => void;
}

type CategoryType = 'art' | 'montres' | 'voitures' | 'vins' | 'livres' | 'autre';

const CATEGORY_LABELS: Record<CategoryType, string> = {
  art: 'art',
  montres: 'montres',
  voitures: 'voitures',
  vins: 'vins',
  livres: 'livres',
  autre: 'autre'
};

export const PersonalCollections = ({ entries, isEditable, onDataChange }: PersonalCollectionsProps) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CollectionEntry | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [addCategory, setAddCategory] = useState<CategoryType | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

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
        .from("personal_collections")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: t('personalCollectionDeleted') });
      onDataChange();
    } catch (error) {
      console.error("Delete error:", error);
      toast({ title: t('personalErrorDeletingEntry'), variant: "destructive" });
    }
  };

  const handleInlineUpdate = async (id: string, field: string, value: string) => {
    try {
      const { error } = await supabase
        .from("personal_collections")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      onDataChange();
    } catch (error) {
      console.error("Update error:", error);
      toast({ title: t('personalErrorSavingEntry'), variant: "destructive" });
    }
  };

  const getItemsByCategory = (category: CategoryType) => {
    return entries.filter(item => (item.category || 'autre') === category);
  };

  const getCategoryLabel = (category: CategoryType) => {
    switch (category) {
      case 'art':
        return t('personalCollectionsArt');
      case 'montres':
        return t('personalCollectionsWatches');
      case 'voitures':
        return t('personalCollectionsCars');
      case 'vins':
        return t('personalCollectionsWine');
      case 'livres':
        return t('personalCollectionsBooks');
      case 'autre':
      default:
        return t('personalCollectionsOther');
    }
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
          <span className="text-sm">{getCategoryLabel(category)}</span>
          {items.length > 0 && (
            <span className="text-xs text-muted-foreground">({items.length})</span>
          )}
        </button>
        {isExpanded && (
          <div className="ml-5 mt-1 space-y-2">
            {items.map((item) => (
              <div key={item.id} className="p-2 bg-muted/30 rounded-lg group">
                <div className="flex gap-3 justify-between items-start">
                  {item.image_url && getCollectionsImageSrc(item.image_url) && (
                    <CollectionsImage src={item.image_url} alt={item.title} />
                  )}
                  <div className="flex-1 min-w-0">
                    <InlineEditableField
                      value={item.title}
                      onSave={(value) => handleInlineUpdate(item.id, "title", value)}
                      placeholder={t('personalTitlePlaceholder')}
                      disabled={!isEditable}
                      className="font-medium text-sm text-foreground"
                    />
                    {isEditable ? (
                      <InlineEditableField
                        value={item.description || ""}
                        onSave={(value) => handleInlineUpdate(item.id, "description", value)}
                        placeholder={t('personalDescriptionPlaceholder')}
                        multiline
                        className="text-xs text-muted-foreground"
                      />
                    ) : item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
                  </div>
                  {isEditable && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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
      title={t('personalCollectionsTitle')}
      icon={Library}
      moduleType="collections"
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

      <CollectionsEditor
        open={editorOpen}
        onOpenChange={handleEditorClose}
        entry={editingEntry}
        onSave={onDataChange}
        defaultCategory={addCategory}
      />
    </PersonalModule>
  );
};
