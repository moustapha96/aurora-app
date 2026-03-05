import React, { useState } from "react";
import { Plane, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonalModule } from "./PersonalModule";
import { VoyagesEditor } from "./editors/VoyagesEditor";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InlineEditableField } from "@/components/ui/inline-editable-field";
import { useLanguage } from "@/contexts/LanguageContext";

function getVoyageImageSrc(url: string | undefined | null): string | null {
  if (url == null || typeof url !== "string") return null;
  const s = String(url).trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("data:")) return s.replace(/\r?\n/g, "");
  if (s.startsWith("/") || s.startsWith("./") || s.startsWith("../")) return s;
  return `/${s.replace(/^\/*/, "")}`;
}

function VoyageImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = getVoyageImageSrc(src);
  if (failed || !resolvedSrc) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/50 rounded-lg">
        <Plane className="w-6 h-6 text-muted-foreground" />
      </div>
    );
  }
  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className="w-full h-full object-cover object-center rounded-lg"
      loading="lazy"
      decoding="async"
      crossOrigin={resolvedSrc.startsWith("http") ? "anonymous" : undefined}
      referrerPolicy={resolvedSrc.startsWith("http") ? "no-referrer" : undefined}
      onError={() => setFailed(true)}
    />
  );
}

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
  tripsDescription?: string;
  onTripsDescriptionSave?: (value: string) => void;
}

type CategoryType = "europe" | "asie" | "amerique" | "afrique" | "oceanie" | "autre";

export const PersonalVoyages = ({
  entries,
  isEditable,
  onDataChange,
  tripsDescription,
  onTripsDescriptionSave,
}: PersonalVoyagesProps) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<VoyageEntry | null>(null);
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
        .from("personal_voyages")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: t('personalTripDeleted') });
      onDataChange();
    } catch (error) {
      console.error("Delete error:", error);
      toast({ title: t('personalErrorDeletingEntry'), variant: "destructive" });
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
      toast({ title: t('personalErrorSavingEntry'), variant: "destructive" });
    }
  };

  const getCategoryLabel = (category: CategoryType) => {
    switch (category) {
      case 'europe':
        return t('personalTripsEurope');
      case 'asie':
        return t('personalTripsAsia');
      case 'amerique':
        return t('personalTripsAmericas');
      case 'afrique':
        return t('personalTripsAfrica');
      case 'oceanie':
        return t('personalTripsOceania');
      case 'autre':
      default:
        return t('personalTripsOther');
    }
  };

  return (
    <PersonalModule
      title={t('personalTripsTitle')}
      icon={Plane}
      moduleType="voyages"
    >
      {/* Description globale des voyages, sous le titre du module */}
      {isEditable ? (
        <InlineEditableField
          value={tripsDescription || ""}
          onSave={(value) => onTripsDescriptionSave && onTripsDescriptionSave(value)}
          placeholder={t("personalDescriptionPlaceholder")}
          multiline
          className="text-sm text-muted-foreground w-full mb-3"
        />
      ) : tripsDescription ? (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words mb-3">
          {tripsDescription}
        </p>
      ) : null}

      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            {t("personalNoTrips") || "Aucun voyage enregistré"}
          </p>
        ) : (
          entries.map((item) => {
            const cat = (item.category as CategoryType) || "autre";
            return (
              <div key={item.id} className="p-2 sm:p-3 bg-muted/30 rounded-lg group">
                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  {isEditable ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEntry(item);
                        setEditorOpen(true);
                      }}
                      className="w-full sm:w-20 sm:h-20 max-h-32 sm:max-h-none rounded-lg overflow-hidden bg-muted/50 sm:shrink-0 focus:outline-none"
                    >
                      {item.image_url && getVoyageImageSrc(item.image_url) ? (
                        <VoyageImage src={item.image_url} alt={item.destination} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground border border-dashed border-gold/30">
                          {t("photo")}
                        </div>
                      )}
                    </button>
                  ) : (
                    item.image_url &&
                    getVoyageImageSrc(item.image_url) && (
                      <div className="w-full sm:w-20 sm:h-20 max-h-32 sm:max-h-none rounded-lg overflow-hidden bg-muted/50 sm:shrink-0">
                        <VoyageImage src={item.image_url} alt={item.destination} />
                      </div>
                    )
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap justify-between">
                      <InlineEditableField
                        value={item.destination}
                        onSave={(value) => handleInlineUpdate(item.id, "destination", value)}
                        placeholder="Destination"
                        disabled={!isEditable}
                        className="font-medium text-sm text-foreground flex-1 min-w-0"
                      />
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/30 whitespace-nowrap">
                        {getCategoryLabel(cat)}
                      </span>
                    </div>
                    {isEditable ? (
                      <InlineEditableField
                        value={item.period || ""}
                        onSave={(value) => handleInlineUpdate(item.id, "period", value)}
                        placeholder={t("personalTripsPeriodPlaceholder")}
                        className="text-xs text-gold"
                      />
                    ) : (
                      item.period && <span className="text-xs text-gold">{item.period}</span>
                    )}
                    {isEditable ? (
                      <InlineEditableField
                        value={item.description || ""}
                        onSave={(value) => handleInlineUpdate(item.id, "description", value)}
                        placeholder={t("personalDescriptionPlaceholder")}
                        multiline
                        className="text-xs text-muted-foreground w-full"
                      />
                    ) : (
                      item.description && (
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words mt-1">
                          {item.description}
                        </p>
                      )
                    )}
                  </div>
                  {isEditable && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-start sm:self-auto">
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

      <VoyagesEditor
        open={editorOpen}
        onOpenChange={handleEditorClose}
        entry={editingEntry}
        onSave={onDataChange}
        defaultCategory={null}
      />
    </PersonalModule>
  );
};
