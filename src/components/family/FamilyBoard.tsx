import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Building2, Award, Users, Trash2, Plus, Sparkles, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InlineEditableField } from "@/components/ui/inline-editable-field";
import { useLanguage } from "@/contexts/LanguageContext";

interface BoardMember {
  id?: string;
  member_name: string;
  role: string;
  organization?: string;
  expertise?: string;
  description?: string;
  image_url?: string;
}

interface FamilyBoardProps {
  members: BoardMember[];
  isEditable?: boolean;
  onUpdate?: () => void;
}

export const FamilyBoard = ({ members, isEditable = false, onUpdate }: FamilyBoardProps) => {
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<BoardMember>>({});
  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const openNewDialog = () => {
    setFormData({ member_name: "", role: "" });
    setDialogOpen(true);
  };

  const updateField = async (memberId: string, field: keyof BoardMember, value: string) => {
    try {
      const { error } = await supabase
        .from("family_board")
        .update({ [field]: value || null })
        .eq("id", memberId);
      if (error) throw error;
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddNew = async () => {
    if (!formData.member_name || !formData.role) {
      toast.error(t('nameAndRoleRequired'));
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('notAuthenticated'));

      const { error } = await supabase.from("family_board").insert({
        user_id: user.id,
        member_name: formData.member_name,
        role: formData.role,
        organization: formData.organization || null,
        expertise: formData.expertise || null,
        description: formData.description || null,
        image_url: formData.image_url || null,
      });
      if (error) throw error;
      toast.success(t('memberAdded'));
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
    if (!confirm(t('deleteThisMember'))) return;
    try {
      const { error } = await supabase.from("family_board").delete().eq("id", id);
      if (error) throw error;
      toast.success(t('memberDeleted'));
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAISuggest = async () => {
    if (!formData.member_name) {
      toast.error(t('pleaseEnterNameFirst'));
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('family-ai-suggest', {
        body: {
          module: 'board',
          currentInput: {
            name: formData.member_name,
            role: formData.role,
            organization: formData.organization,
            expertise: formData.expertise
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

      {(!members || members.length === 0) ? (
        <p className="text-muted-foreground text-sm italic">
          {t('noPersonalBoardMemberEntered')}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((member, idx) => (
            <div 
              key={member.id || idx}
              className="relative p-4 border border-gold/20 rounded-lg bg-gradient-to-br from-background to-gold/5 hover:border-gold/30 transition-colors"
            >
              {isEditable && member.id && (
                <button
                  onClick={(e) => handleDelete(member.id!, e)}
                  className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="flex items-start gap-3">
                {member.image_url ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-gold/20">
                    <img src={member.image_url} alt={member.member_name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg flex-shrink-0 border border-gold/20 bg-gold/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-gold/60" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  {isEditable && member.id ? (
                    <>
                      <h4 className="font-semibold text-foreground">
                        <InlineEditableField
                          value={member.member_name}
                          onSave={(v) => updateField(member.id!, "member_name", v)}
                          placeholder={t('name')}
                        />
                      </h4>
                      <p className="text-sm text-gold">
                        <InlineEditableField
                          value={member.role}
                          onSave={(v) => updateField(member.id!, "role", v)}
                          placeholder={t('role')}
                          className="text-sm"
                        />
                      </p>
                    </> 
                  ) : (
                    <>
                      <h4 className="font-semibold text-foreground">{member.member_name}</h4>
                      <p className="text-sm text-gold">{member.role}</p>
                    </>
                  )}
                </div>
              </div>
              
              <div className="mt-3 space-y-2">
                {isEditable && member.id ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="w-4 h-4 flex-shrink-0" />
                      <InlineEditableField
                        value={member.organization || ""}
                        onSave={(v) => updateField(member.id!, "organization", v)}
                        placeholder={t('organization')}
                        className="text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Award className="w-4 h-4 flex-shrink-0" />
                      <InlineEditableField
                        value={member.expertise || ""}
                        onSave={(v) => updateField(member.id!, "expertise", v)}
                        placeholder={t('expertise')}
                        className="text-sm"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      <InlineEditableField
                        value={member.description || ""}
                        onSave={(v) => updateField(member.id!, "description", v)}
                        placeholder={t('description')}
                        className="text-xs"
                        multiline
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {member.organization && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="w-4 h-4" />
                        <span>{member.organization}</span>
                      </div>
                    )}
                    {member.expertise && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Award className="w-4 h-4" />
                        <span>{member.expertise}</span>
                      </div>
                    )}
                    {member.description && (
                      <p className="text-xs text-muted-foreground mt-2">{member.description}</p>
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
            <DialogTitle>{t('addMember')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('name')} *</Label>
              <Input value={formData.member_name || ""} onChange={(e) => setFormData({ ...formData, member_name: e.target.value })} />
            </div>
            <div>
              <Label>{t('role')} *</Label>
              <Input value={formData.role || ""} onChange={(e) => setFormData({ ...formData, role: e.target.value })} placeholder={t('advisorLawyerCoach')} />
            </div>
            <div>
              <Label>{t('organization')}</Label>
              <Input value={formData.organization || ""} onChange={(e) => setFormData({ ...formData, organization: e.target.value })} />
            </div>
            <div>
              <Label>{t('expertise')}</Label>
              <Input value={formData.expertise || ""} onChange={(e) => setFormData({ ...formData, expertise: e.target.value })} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>{t('description')}</Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => document.getElementById('import-doc-board-main')?.click()}
                    className="text-muted-foreground hover:text-foreground h-6 px-2"
                  >
                    <FileUp className="w-3 h-3 mr-1" />
                    {t('import')}
                  </Button>
                  <input
                    id="import-doc-board-main"
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
                    disabled={isGenerating || !formData.member_name}
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
