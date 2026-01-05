import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Star, Quote, Trash2, Plus, Sparkles, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InlineEditableField } from "@/components/ui/inline-editable-field";
import { useLanguage } from "@/contexts/LanguageContext";

interface InfluentialPerson {
  id?: string;
  person_name: string;
  relationship?: string;
  context?: string;
  description?: string;
  image_url?: string;
}

interface FamilyInfluentialProps {
  people: InfluentialPerson[];
  isEditable?: boolean;
  onUpdate?: () => void;
}

export const FamilyInfluential = ({ people, isEditable = false, onUpdate }: FamilyInfluentialProps) => {
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<InfluentialPerson>>({});
  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const openNewDialog = () => {
    setFormData({ person_name: "" });
    setDialogOpen(true);
  };

  const updateField = async (personId: string, field: keyof InfluentialPerson, value: string) => {
    try {
      const { error } = await supabase
        .from("family_influential")
        .update({ [field]: value || null })
        .eq("id", personId);
      if (error) throw error;
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddNew = async () => {
    if (!formData.person_name) {
      toast.error(t('nameRequired'));
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('notAuthenticated'));

      const { error } = await supabase.from("family_influential").insert({
        user_id: user.id,
        person_name: formData.person_name,
        relationship: formData.relationship || null,
        context: formData.context || null,
        description: formData.description || null,
        image_url: formData.image_url || null,
      });
      if (error) throw error;
      toast.success(t('personAdded'));
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
    if (!confirm(t('deleteThisPerson'))) return;
    try {
      const { error } = await supabase.from("family_influential").delete().eq("id", id);
      if (error) throw error;
      toast.success(t('personDeleted'));
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAISuggest = async () => {
    if (!formData.person_name) {
      toast.error(t('pleaseEnterNameFirst'));
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('family-ai-suggest', {
        body: {
          module: 'influential',
          currentInput: {
            name: formData.person_name,
            relationship: formData.relationship,
            context: formData.context
          }
        }
      });
      if (error) throw error;
      if (data?.suggestion) {
        setFormData({ ...formData, description: data.suggestion });
        toast.success(t('suggestionGenerated'));
      }
    } catch (error: any) {
      toast.error(t('generationError'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {isEditable && (
        <Button onClick={openNewDialog} variant="outline" size="sm" className="border-gold/30 text-gold hover:bg-gold/10">
          <Plus className="w-4 h-4 mr-2" />
          {t('add')}
        </Button>
      )}

      {(!people || people.length === 0) ? (
        <p className="text-muted-foreground text-sm italic">
          {t('noInfluentialPersonEntered')}
        </p>
      ) : (
        <div className="space-y-4">
          {people.map((person, idx) => (
            <div 
              key={person.id || idx}
              className="relative flex gap-4 p-4 bg-gold/5 rounded-lg border border-gold/10 hover:border-gold/20 transition-colors"
            >
              {isEditable && person.id && (
                <button
                  onClick={(e) => handleDelete(person.id!, e)}
                  className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              {person.image_url ? (
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-gold/30">
                  <img src={person.image_url} alt={person.person_name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full flex-shrink-0 border-2 border-gold/30 bg-gold/10 flex items-center justify-center">
                  <Star className="w-6 h-6 text-gold/60" />
                </div>
              )}
              
              <div className="flex-1 min-w-0 pr-8">
                {isEditable && person.id ? (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-foreground">
                        <InlineEditableField
                          value={person.person_name}
                          onSave={(v) => updateField(person.id!, "person_name", v)}
                          placeholder={t('name')}
                        />
                      </h4>
                      <Badge variant="outline" className="border-gold/30 text-gold text-xs">
                        <InlineEditableField
                          value={person.relationship || ""}
                          onSave={(v) => updateField(person.id!, "relationship", v)}
                          placeholder={t('relation')}
                          className="text-xs"
                        />
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <InlineEditableField
                          value={person.context || ""}
                          onSave={(v) => updateField(person.id!, "context", v)}
                          placeholder={t('context')}
                          className="text-xs"
                        />
                      </Badge>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Quote className="w-4 h-4 text-gold/40 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-muted-foreground italic">
                        <InlineEditableField
                          value={person.description || ""}
                          onSave={(v) => updateField(person.id!, "description", v)}
                          placeholder={t('descriptionCitation')}
                          className="text-sm"
                          multiline
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-foreground">{person.person_name}</h4>
                      {person.relationship && (
                        <Badge variant="outline" className="border-gold/30 text-gold text-xs">{person.relationship}</Badge>
                      )}
                      {person.context && (
                        <Badge variant="secondary" className="text-xs">{person.context}</Badge>
                      )}
                    </div>
                    {person.description && (
                      <div className="mt-2 flex gap-2">
                        <Quote className="w-4 h-4 text-gold/40 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground italic">{person.description}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('addPerson')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('name')} *</Label>
              <Input value={formData.person_name || ""} onChange={(e) => setFormData({ ...formData, person_name: e.target.value })} />
            </div>
            <div>
              <Label>{t('relation')}</Label>
              <Input value={formData.relationship || ""} onChange={(e) => setFormData({ ...formData, relationship: e.target.value })} placeholder={t('mentorFriendSponsor')} />
            </div>
            <div>
              <Label>{t('context')}</Label>
              <Input value={formData.context || ""} onChange={(e) => setFormData({ ...formData, context: e.target.value })} placeholder={t('businessArtPolitics')} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>{t('descriptionCitation')}</Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => document.getElementById('import-doc-influential-main')?.click()}
                    className="text-muted-foreground hover:text-foreground h-6 px-2"
                  >
                    <FileUp className="w-3 h-3 mr-1" />
                    {t('import')}
                  </Button>
                  <input
                    id="import-doc-influential-main"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={() => toast.success(t('documentImportedAnalysisInProgress'))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAISuggest}
                    disabled={isGenerating || !formData.person_name}
                    className="text-gold hover:text-gold/80 h-6 px-2"
                  >
                    {isGenerating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                    {t('ai')}
                  </Button>
                </div>
              </div>
              <Textarea value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div>
              <Label>{t('imageUrl')}</Label>
              <Input value={formData.image_url || ""} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
              <Button onClick={handleAddNew} disabled={saving} className="bg-gold hover:bg-gold/90 text-primary-foreground">
                {saving ? "..." : t('add')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
