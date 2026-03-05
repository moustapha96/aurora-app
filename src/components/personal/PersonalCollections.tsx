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

type CategoryType = "art" | "montres" | "voitures" | "vins" | "livres" | "autre";

export const PersonalCollections = ({ entries, isEditable, onDataChange }: PersonalCollectionsProps) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CollectionEntry | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleEditorClose = (open: boolean) => {
    setEditorOpen(open);
    if (!open) {
      setEditingEntry(null);
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

  return (
    <PersonalModule
      title={t('personalCollectionsTitle')}
      icon={Library}
      moduleType="collections"
    >
      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            {t("personalNoCollections")}
          </p>
        ) : (
          entries.map((item) => {
            const cat = (item.category as CategoryType) || "autre";
            return (
              <div key={item.id} className="p-2 bg-muted/30 rounded-lg group">
                <div className="flex gap-3 justify-between items-start">
                  {isEditable ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEntry(item);
                        setEditorOpen(true);
                      }}
                      className="shrink-0 focus:outline-none"
                    >
                      {item.image_url && getCollectionsImageSrc(item.image_url) ? (
                        <CollectionsImage src={item.image_url} alt={item.title} />
                      ) : (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-muted/50 rounded-lg shrink-0 border border-dashed border-gold/30 text-[10px] text-muted-foreground">
                          {t("photo")}
                        </div>
                      )}
                    </button>
                  ) : (
                    item.image_url &&
                    getCollectionsImageSrc(item.image_url) && (
                      <CollectionsImage src={item.image_url} alt={item.title} />
                    )
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap justify-between">
                      <InlineEditableField
                        value={item.title}
                        onSave={(value) => handleInlineUpdate(item.id, "title", value)}
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
                        value={item.description || ""}
                        onSave={(value) => handleInlineUpdate(item.id, "description", value)}
                        placeholder={t("personalDescriptionPlaceholder")}
                        multiline
                        className="text-xs text-muted-foreground"
                      />
                    ) : (
                      item.description && (
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                          {item.description}
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
                        onClick={() => handleDelete(item.id)}
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

      <CollectionsEditor
        open={editorOpen}
        onOpenChange={handleEditorClose}
        entry={editingEntry}
        onSave={onDataChange}
        defaultCategory={null}
      />
    </PersonalModule>
  );
};
