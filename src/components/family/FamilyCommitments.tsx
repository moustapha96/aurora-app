// React and UI Components
import React, { useState } from "react";
import { Heart, Trash2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Supabase client
import { supabase } from "@/integrations/supabase/client";

// Utilities
import { toast } from "sonner";
import { InlineEditableField } from "@/components/ui/inline-editable-field";
import { useLanguage } from "@/contexts/LanguageContext";

interface Commitment {
  id?: string;
  description?: string;
}

interface FamilyCommitmentsProps {
  commitments: Commitment[];
  isEditable?: boolean;
  onUpdate?: () => void;
}

export const FamilyCommitments = ({ commitments, isEditable = false, onUpdate }: FamilyCommitmentsProps) => {
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Commitment>>({});
  const [saving, setSaving] = useState(false);

  const openNewDialog = () => {
    setFormData({ description: "" });
    setDialogOpen(true);
  };

  const updateField = async (commitmentId: string, field: keyof Commitment, value: string) => {
    try {
      const { error } = await supabase
        .from("family_commitments")
        .update({ [field]: value || null })
        .eq("id", commitmentId);
      if (error) throw error;
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddNew = async () => {
    const description = (formData.description || "").trim();
    if (!description) {
      toast.error(t("descriptionRequired") || "Description requise");
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthenticated"));

      const { error } = await supabase.from("family_commitments").insert({
        user_id: user.id,
        // on garde un titre dérivé pour compatibilité éventuelle
        title: description.substring(0, 80),
        description,
      });

      if (error) throw error;

      toast.success(t("commitmentAdded"));
      setDialogOpen(false);
      setFormData({});
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t("deleteThisCommitment"))) return;
    try {
      const { error } = await supabase.from("family_commitments").delete().eq("id", id);
      if (error) throw error;
      toast.success(t("commitmentDeleted"));
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message);
    }
  };


  return (
    <div className="space-y-5 sm:space-y-6">
      {isEditable && (
        <Button
          onClick={openNewDialog}
          variant="outline"
          size="sm"
          className="border-gold/30 text-gold hover:bg-gold/10"
          type="button"
        >
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t("add")}</span>
        </Button>
      )}

      {!commitments || commitments.length === 0 ? (
        <p className="text-muted-foreground text-sm italic">
          {t("noFamilyCommitmentEntered")}
        </p>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {commitments.map((commitment, idx) => (
            <div
              key={commitment.id || idx}
              className="relative flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 border border-gold/20 rounded-lg hover:border-gold/30 transition-colors"
            >
              {isEditable && commitment.id && (
                <button
                  onClick={(e) => handleDelete(commitment.id!, e)}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-2 sm:p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0 border border-gold/30 bg-gold/5 flex items-center justify-center">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-gold/60" />
              </div>

              <div className="flex-1 min-w-0 pr-0 sm:pr-8">
                {isEditable && commitment.id ? (
                  <>
                    <div className="text-sm text-muted-foreground">
                      <InlineEditableField
                        value={commitment.description || ""}
                        onSave={(v) => updateField(commitment.id!, "description", v)}
                        placeholder={t("description")}
                        className="text-sm w-full"
                        multiline
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {commitment.description && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                        {commitment.description}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFormData({});
          }
          setDialogOpen(open);
        }}
      >
        <DialogContent className="w-[95vw] sm:w-full max-w-md mx-auto max-h-[90vh] sm:max-h-[92vh] overflow-y-auto overflow-x-hidden bg-background border border-gold/20 p-0 flex flex-col">
          <DialogHeader className="sticky top-0 z-10 bg-background border-b border-gold/10 px-4 py-3 sm:px-6 sm:py-4">
            <DialogTitle className="text-base sm:text-lg md:text-xl font-serif text-gold">
              {t("addCommitment")}
            </DialogTitle>
          </DialogHeader>

          <div className="px-4 py-3 sm:px-6 sm:py-4 space-y-3 sm:space-y-4 overflow-y-auto flex-1 min-h-0">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium">
                {t("description")}
              </Label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="bg-background/50 border-gold/20 focus:border-gold/50 min-h-[110px] resize-none text-sm"
                rows={3}
              />
            </div>
          </div>

          <div className="sticky bottom-0 bg-background border-t border-gold/10 px-4 py-3 sm:px-6 sm:py-4 flex-shrink-0">
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1 text-sm h-10 min-h-[44px] sm:min-h-0 touch-manipulation"
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleAddNew}
                disabled={saving}
                className="flex-1 bg-gold hover:bg-gold/90 text-primary-foreground font-medium text-sm h-10 min-h-[44px] sm:min-h-0 touch-manipulation"
              >
                {saving && (
                  <Loader2 className="w-4 h-4 animate-spin mr-1 flex-shrink-0" />
                )}
                {saving ? t("adding") : t("add")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
