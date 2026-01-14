import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Heart, Calendar, Building, Trash2, Plus, Sparkles, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InlineEditableField } from "@/components/ui/inline-editable-field";
import { useLanguage } from "@/contexts/LanguageContext";

interface Commitment {
  id?: string;
  title: string;
  category?: string;
  description?: string;
  organization?: string;
  start_year?: string;
  image_url?: string;
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const getCategoryColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case "philanthropie":
        return "bg-pink-500/20 text-pink-400 border-pink-500/30";
      case "éducation":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "environnement":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gold/20 text-gold border-gold/30";
    }
  };

  const openNewDialog = () => {
    setFormData({ title: "" });
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
    if (!formData.title) {
      toast.error(t("titleRequired"));
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthenticated"));

      const { error } = await supabase.from("family_commitments").insert({
        user_id: user.id,
        title: formData.title,
        category: formData.category || null,
        description: formData.description || null,
        organization: formData.organization || null,
        start_year: formData.start_year || null,
        image_url: formData.image_url || null,
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

  const handleAISuggest = async () => {
    if (!formData.title) {
      toast.error(t("pleaseIndicateTitleFirst"));
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("family-ai-suggest", {
        body: {
          module: "commitments",
          currentInput: {
            title: formData.title,
            category: formData.category,
            organization: formData.organization,
          },
        },
      });
      if (error) throw error;
      if (data?.suggestion) {
        setFormData({ ...formData, description: data.suggestion });
        toast.success(t("suggestionGenerated"));
      }
    } catch {
      toast.error(t("generationError"));
    } finally {
      setIsGenerating(false);
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      } else {
        // Pour PDF/DOCX, on lit le fichier comme base64 et on extrait le texte brut
        const reader = new FileReader();
        reader.onload = (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const bytes = new Uint8Array(arrayBuffer);
          let text = '';
          // Extraire les caractères ASCII lisibles
          for (let i = 0; i < Math.min(bytes.length, 50000); i++) {
            const char = bytes[i];
            if (char >= 32 && char <= 126) {
              text += String.fromCharCode(char);
            } else if (char === 10 || char === 13) {
              text += '\n';
            } else if (char === 9) {
              text += ' ';
            }
          }
          resolve(text);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du type de fichier
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
      toast.error(t("unsupportedFormat") || "Format de fichier non supporté");
      return;
    }

    // Validation de la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("fileTooLarge") || "Le fichier est trop volumineux (max 5MB)");
      return;
    }

    setIsImporting(true);
    toast.info(t("documentImportedAnalysisInProgress") || "Analyse du document en cours...");

    try {
      // Extraire le texte du fichier
      let documentText = await extractTextFromFile(file);

      if (!documentText || documentText.trim().length < 20) {
        toast.error(t("cannotExtractTextFromFile") || "Impossible d'extraire le texte du fichier");
        setIsImporting(false);
        return;
      }

      // Limiter la longueur du texte pour l'API
      const limitedText = documentText.substring(0, 30000);

      // Appeler la fonction AI pour analyser le document
      const { data, error } = await supabase.functions.invoke("family-ai-suggest", {
        body: {
          module: "commitments",
          currentInput: {
            title: formData.title || "",
            category: formData.category || "",
            organization: formData.organization || "",
            documentText: limitedText, // Passer le texte du document
          },
        },
      });

      if (error) throw error;

      if (data?.suggestion) {
        setFormData({ ...formData, description: data.suggestion });
        toast.success(t("documentAnalyzed") || "Document analysé avec succès");
      } else {
        // Si pas de suggestion, utiliser le texte extrait directement
        setFormData({ ...formData, description: documentText.substring(0, 2000) });
        toast.success(t("documentImported") || "Document importé");
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.message || t("generationError") || "Erreur lors de l'analyse");
    } finally {
      setIsImporting(false);
      // Réinitialiser l'input file pour permettre de réimporter le même fichier
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Bouton Ajouter */}
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

      {/* Liste */}
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
              {/* Bouton Supprimer */}
              {isEditable && commitment.id && (
                <button
                  onClick={(e) => handleDelete(commitment.id!, e)}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-2 sm:p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Icône */}
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-lg flex-shrink-0 border border-gold/20 bg-gold/5 flex items-center justify-center">
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-gold/40" />
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0 pr-0 sm:pr-8">
                {isEditable && commitment.id ? (
                  <>
                    {/* Titre + Catégorie */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-wrap mb-1">
                      <h4 className="font-semibold text-foreground">
                        <InlineEditableField
                          value={commitment.title}
                          onSave={(v) => updateField(commitment.id!, "title", v)}
                          placeholder={t("title")}
                        />
                      </h4>
                      <Badge variant="outline" className={getCategoryColor(commitment.category)}>
                        <InlineEditableField
                          value={commitment.category || ""}
                          onSave={(v) => updateField(commitment.id!, "category", v)}
                          placeholder={t("category")}
                          className="text-xs"
                        />
                      </Badge>
                    </div>

                    {/* Métadonnées */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3 flex-shrink-0" />
                        <InlineEditableField
                          value={commitment.organization || ""}
                          onSave={(v) => updateField(commitment.id!, "organization", v)}
                          placeholder={t("organization")}
                          className="text-sm"
                        />
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        {t("since")}{" "}
                        <InlineEditableField
                          value={commitment.start_year || ""}
                          onSave={(v) => updateField(commitment.id!, "start_year", v)}
                          placeholder={t("year")}
                          className="text-sm"
                        />
                      </span>
                    </div>

                    {/* Description */}
                    <div className="text-sm text-muted-foreground">
                      <InlineEditableField
                        value={commitment.description || ""}
                        onSave={(v) => updateField(commitment.id!, "description", v)}
                        placeholder={t("description")}
                        className="text-sm"
                        multiline
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-wrap mb-1">
                      <h4 className="font-semibold text-foreground">
                        {commitment.title}
                      </h4>
                      {commitment.category && (
                        <Badge
                          variant="outline"
                          className={getCategoryColor(commitment.category)}
                        >
                          {commitment.category}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2">
                      {commitment.organization && (
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {commitment.organization}
                        </span>
                      )}
                      {commitment.start_year && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {t("since")} {commitment.start_year}
                        </span>
                      )}
                    </div>

                    {commitment.description && (
                      <p className="text-sm text-muted-foreground">
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

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[96vw] sm:w-full max-w-md mx-auto max-h-[92vh] overflow-y-auto bg-background border border-gold/20 p-0">
          <DialogHeader className="sticky top-0 z-10 bg-background border-b border-gold/10 px-4 py-3 sm:px-6 sm:py-4">
            <DialogTitle className="text-base sm:text-lg md:text-xl font-serif text-gold">
              {t("addCommitment")}
            </DialogTitle>
          </DialogHeader>

          <div className="px-4 py-3 sm:px-6 sm:py-4 space-y-3 sm:space-y-4">
            {/* Titre */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium">{t("title")} *</Label>
              <Input
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-background/50 border-gold/20 focus:border-gold/50 text-sm h-10"
              />
            </div>

            {/* Catégorie */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium">{t("category")}</Label>
              <Input
                value={formData.category || ""}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder={t("philanthropyEducationEnvironment")}
                className="bg-background/50 border-gold/20 focus:border-gold/50 text-sm h-10"
              />
            </div>

            {/* Organisation */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium">{t("organization")}</Label>
              <Input
                value={formData.organization || ""}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="bg-background/50 border-gold/20 focus:border-gold/50 text-sm h-10"
              />
            </div>

            {/* Année */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium">{t("startYear")}</Label>
              <Input
                value={formData.start_year || ""}
                onChange={(e) => setFormData({ ...formData, start_year: e.target.value })}
                placeholder="2020"
                className="bg-background/50 border-gold/20 focus:border-gold/50 text-sm h-10"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <Label className="text-xs sm:text-sm font-medium">{t("description")}</Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      document.getElementById("import-doc-commitments-main")?.click()
                    }
                    disabled={isImporting}
                    className="text-muted-foreground hover:text-foreground h-8 px-2 text-sm disabled:opacity-50"
                  >
                    {isImporting ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <FileUp className="w-4 h-4 mr-1" />
                    )}
                    {t("import")}
                  </Button>
                  <input
                    id="import-doc-commitments-main"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={handleFileImport}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAISuggest}
                    disabled={isGenerating || !formData.title}
                    className="text-gold hover:text-gold/80 h-8 px-2 text-sm"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-1" />
                    )}
                    {t("ai")}
                  </Button>
                </div>
              </div>
              <Textarea
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="bg-background/50 border-gold/20 focus:border-gold/50 min-h-[110px] resize-none text-sm"
                rows={3}
              />
            </div>

            {/* Image */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium">{t("imageUrl")}</Label>
              <Input
                value={formData.image_url || ""}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
                className="bg-background/50 border-gold/20 focus:border-gold/50 text-sm h-10"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-background border-t border-gold/10 px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1 text-sm h-10"
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleAddNew}
                disabled={saving}
                className="flex-1 bg-gold hover:bg-gold/90 text-primary-foreground font-medium text-sm h-10"
              >
                {saving && (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
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
