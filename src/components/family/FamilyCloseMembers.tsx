import React, { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { User, Briefcase, Trash2, Plus, Sparkles, Upload, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InlineEditableField } from "@/components/ui/inline-editable-field";
import { useLanguage } from "@/contexts/LanguageContext";

interface CloseFamilyMember {
  id?: string;
  relation_type: string;
  member_name: string;
  birth_year?: string;
  occupation?: string;
  description?: string;
  image_url?: string;
}

interface FamilyCloseMembersProps {
  members: CloseFamilyMember[];
  isEditable?: boolean;
  onUpdate?: () => void;
}

export const FamilyCloseMembers = ({ members, isEditable = false, onUpdate }: FamilyCloseMembersProps) => {
  const { t } = useLanguage();
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newFormData, setNewFormData] = useState<Partial<CloseFamilyMember>>({});
  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImportingDoc, setIsImportingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  const handleDocImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error(t('fileTooLargeMax10MB'));
      return;
    }

    setIsImportingDoc(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('notAuthenticated'));

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const fileName = `close-doc-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      // Get correct MIME type for documents
      const mimeTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png'
      };
      const contentType = mimeTypes[fileExt] || 'application/octet-stream';
      
      // Create proper File object with correct MIME type
      const properFile = new File([file], file.name, { 
        type: contentType, 
        lastModified: Date.now() 
      });

      const { error: uploadError } = await supabase.storage
        .from('family-documents')
        .upload(filePath, properFile, { upsert: true, contentType });

      if (uploadError) throw uploadError;

      await supabase.from('family_documents').insert({
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        description: `${t('familyDocument')}: ${newFormData.member_name || t('newMember')}`
      });

      toast.success(t('documentImportedSuccess'));
    } catch (error) {
      console.error(error);
      toast.error(t('documentImportError'));
    } finally {
      setIsImportingDoc(false);
    }
  };

  const updateField = async (memberId: string, field: keyof CloseFamilyMember, value: string) => {
    try {
      const { error } = await supabase
        .from("family_close")
        .update({ [field]: value || null })
        .eq("id", memberId);
      if (error) throw error;
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddNew = async () => {
    const memberName = (newFormData.member_name || "").trim();
    const relationType = (newFormData.relation_type || "").trim();
    
    if (!memberName || !relationType) {
      toast.error(t('nameAndRelationTypeRequired'));
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('notAuthenticated'));

      const { error } = await supabase.from("family_close").insert({
        user_id: user.id,
        relation_type: relationType,
        member_name: memberName,
        birth_year: (newFormData.birth_year || "").trim() || null,
        occupation: (newFormData.occupation || "").trim() || null,
        description: (newFormData.description || "").trim() || null,
        image_url: (newFormData.image_url || "").trim() || null,
      });
      if (error) throw error;
      toast.success(t('memberAdded'));
      setNewDialogOpen(false);
      setNewFormData({});
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
      const { error } = await supabase.from("family_close").delete().eq("id", id);
      if (error) throw error;
      toast.success(t('memberDeleted'));
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleOpenDialog = () => {
    console.log('[FamilyCloseMembers] Opening dialog');
    setNewFormData({ relation_type: "", member_name: "" });
    setNewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {isEditable && (
        <Button 
          onClick={handleOpenDialog} 
          variant="outline" 
          size="sm" 
          className="border-gold/30 text-gold hover:bg-gold/10"
          type="button"
        >
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('add')}</span>
        </Button>
      )}

      {(!members || members.length === 0) ? (
        <p className="text-muted-foreground text-sm italic">
          {/* {t('noCloseFamilyMemberEntered')} */}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member, idx) => (
            <div 
              key={member.id || idx}
              className="relative overflow-hidden rounded-lg border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent"
            >
              {isEditable && member.id && (
                <button
                  onClick={(e) => handleDelete(member.id!, e)}
                  className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="aspect-[4/5] relative">
                {member.image_url ? (
                  <div className="absolute inset-0">
                    <img 
                      src={member.image_url} 
                      alt={member.member_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gold/5">
                    <User className="w-16 h-16 text-gold/20" />
                  </div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  {isEditable && member.id ? (
                    <>
                      <Badge variant="outline" className="mb-2 border-gold/40 text-gold bg-background/80 backdrop-blur-sm">
                        <InlineEditableField
                          value={member.relation_type}
                          onSave={(v) => updateField(member.id!, "relation_type", v)}
                          placeholder={t('relation')}
                          className="text-xs"
                        />
                      </Badge>
                      <h4 className="font-semibold text-foreground text-lg">
                        <InlineEditableField
                          value={member.member_name}
                          onSave={(v) => updateField(member.id!, "member_name", v)}
                          placeholder={t('name')}
                        />
                      </h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Briefcase className="w-3 h-3 flex-shrink-0" />
                        <InlineEditableField
                          value={member.occupation || ""}
                          onSave={(v) => updateField(member.id!, "occupation", v)}
                          placeholder={t('occupation')}
                          className="text-sm"
                        />
                      </p>
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
                      <Badge variant="outline" className="mb-2 border-gold/40 text-gold bg-background/80 backdrop-blur-sm">
                        {member.relation_type}
                      </Badge>
                      <h4 className="font-semibold text-foreground text-lg">{member.member_name}</h4>
                      {member.occupation && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Briefcase className="w-3 h-3" />
                          {member.occupation}
                        </p>
                      )}
                      {member.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {member.description}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto bg-background border border-gold/20 p-0" data-scroll>
          <DialogHeader className="sticky top-0 z-10 bg-background border-b border-gold/10 px-4 py-3 sm:px-6 sm:py-4">
            <DialogTitle className="text-base sm:text-lg md:text-xl font-serif text-gold">
              {t('addMember')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="px-4 py-3 sm:px-6 sm:py-4 space-y-3 sm:space-y-4">
            {/* Grille responsive pour les champs principaux */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium text-foreground">{t('name')} *</Label>
                <Input 
                  value={newFormData.member_name || ""} 
                  onChange={(e) => setNewFormData({ ...newFormData, member_name: e.target.value })}
                  placeholder={t('firstNameLastName')}
                  className="bg-background/50 border-gold/20 focus:border-gold/50 text-sm h-9 sm:h-10"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium text-foreground">{t('relation')} *</Label>
                <Input 
                  value={newFormData.relation_type || ""} 
                  onChange={(e) => setNewFormData({ ...newFormData, relation_type: e.target.value })} 
                  placeholder={t('spouseSonDaughter')}
                  className="bg-background/50 border-gold/20 focus:border-gold/50 text-sm h-9 sm:h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium text-foreground">{t('birthYear')}</Label>
                <Input 
                  value={newFormData.birth_year || ""} 
                  onChange={(e) => setNewFormData({ ...newFormData, birth_year: e.target.value })}
                  placeholder="1990"
                  className="bg-background/50 border-gold/20 focus:border-gold/50 text-sm h-9 sm:h-10"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium text-foreground">{t('occupation')}</Label>
                <Input 
                  value={newFormData.occupation || ""} 
                  onChange={(e) => setNewFormData({ ...newFormData, occupation: e.target.value })}
                  placeholder={t('lawyerDoctor')}
                  className="bg-background/50 border-gold/20 focus:border-gold/50 text-sm h-9 sm:h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium text-foreground">{t('description')}</Label>
              <Textarea 
                value={newFormData.description || ""} 
                onChange={(e) => setNewFormData({ ...newFormData, description: e.target.value })}
                placeholder={t('fewWordsAboutThisFamilyMember')}
                className="bg-background/50 border-gold/20 focus:border-gold/50 min-h-[80px] sm:min-h-[100px] resize-none text-sm"
                rows={3}
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium text-foreground">{t('imageUrl')}</Label>
              <Input 
                value={newFormData.image_url || ""} 
                onChange={(e) => setNewFormData({ ...newFormData, image_url: e.target.value })}
                placeholder="https://..."
                className="bg-background/50 border-gold/20 focus:border-gold/50 text-sm h-9 sm:h-10"
              />
            </div>

            {/* Hidden document input */}
            <input
              ref={docInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleDocImport}
            />
          </div>

          {/* Footer sticky avec boutons */}
          <div className="sticky bottom-0 bg-background border-t border-gold/10 px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex flex-col gap-2 sm:gap-3">
              {/* Boutons d'action secondaires */}
              <div className="flex gap-2 w-full">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    setIsGenerating(true);
                    try {
                      const { data, error } = await supabase.functions.invoke('family-ai-suggest', {
                        body: { moduleType: 'close_family', context: newFormData.member_name }
                      });
                      if (error) throw error;
                      if (data?.suggestion) {
                        setNewFormData(prev => ({ ...prev, description: data.suggestion }));
                        toast.success(t('suggestionGenerated'));
                      }
                    } catch {
                      toast.error(t('generationError'));
                    } finally {
                      setIsGenerating(false);
                    }
                  }}
                  disabled={isGenerating || !newFormData.member_name}
                  className="flex-1 border-gold/30 text-gold hover:bg-gold/10 text-xs sm:text-sm h-8 sm:h-9"
                >
                  {isGenerating ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                  <span className="hidden sm:inline">{t('aiAurora')}</span>
                  <span className="sm:hidden">{t('ai')}</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => docInputRef.current?.click()}
                  disabled={isImportingDoc}
                  className="flex-1 border-gold/30 text-gold hover:bg-gold/10 text-xs sm:text-sm h-8 sm:h-9"
                >
                  {isImportingDoc ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mr-1" /> : <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                  <span className="hidden sm:inline">{t('import')}</span>
                  <span className="sm:hidden">{t('doc')}</span>
                </Button>
              </div>
              
              {/* Boutons principaux */}
              <div className="flex gap-2 w-full">
                <Button 
                  variant="outline" 
                  onClick={() => setNewDialogOpen(false)}
                  className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                >
                  {t('cancel')}
                </Button>
                <Button 
                  onClick={handleAddNew} 
                  disabled={saving} 
                  className="flex-1 bg-gold hover:bg-gold/90 text-primary-foreground font-medium text-xs sm:text-sm h-8 sm:h-9"
                >
                  {saving ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mr-1" /> : null}
                  {saving ? t('adding') : t('add')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
