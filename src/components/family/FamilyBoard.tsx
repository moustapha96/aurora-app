// React and UI Components
import React, { useState, useRef } from "react";
import { Building2, Award, Users, Trash2, Plus, Sparkles, Loader2, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Supabase client
import { supabase } from "@/integrations/supabase/client";

// Utilities
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

// Retourne un src utilisable pour <img> : URL (http/https), data URL (base64), ou chemin.
function getBoardImageSrc(url: string | undefined | null): string | null {
  if (url == null || typeof url !== "string") return null;
  const s = String(url).trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("data:")) return s.replace(/\r?\n/g, "");
  if (s.startsWith("/") || s.startsWith("./") || s.startsWith("../")) return s;
  return `/${s.replace(/^\/*/, "")}`;
}

function isExternalUrl(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}

// Affiche l'image (URL, data ou chemin) ou le placeholder ; en cas d'erreur affiche le placeholder.
function BoardImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="w-12 h-12 rounded-lg flex-shrink-0 border border-gold/20 bg-gold/10 flex items-center justify-center">
        <Users className="w-5 h-5 text-gold/60" />
      </div>
    );
  }
  return (
    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-gold/20">
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover object-center"
        loading="lazy"
        decoding="async"
        crossOrigin={isExternalUrl(src) ? "anonymous" : undefined}
        referrerPolicy={isExternalUrl(src) ? "no-referrer" : undefined}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export const FamilyBoard = ({ members, isEditable = false, onUpdate }: FamilyBoardProps) => {
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<BoardMember>>({});
  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const openNewDialog = () => {
    setFormData({ member_name: "", role: "" });
    setImageFile(null);
    setImagePreview(null);
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

  // Convertit le fichier image en data URL base64 pour enregistrement en base
  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(t('imageReadError') || "Impossible de lire l'image"));
      reader.readAsDataURL(file);
    });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t('pleaseSelectImage') || 'Veuillez sélectionner une image (JPG, PNG, etc.)');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const clearImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    imageInputRef.current?.value && (imageInputRef.current.value = '');
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

      let imageUrl: string | null = null;
      if (imageFile) {
        setUploadingImage(true);
        try {
          imageUrl = await fileToDataUrl(imageFile);
        } finally {
          setUploadingImage(false);
        }
      }

      const { error } = await supabase.from("family_board").insert({
        user_id: user.id,
        member_name: formData.member_name,
        role: formData.role,
        organization: formData.organization || null,
        expertise: formData.expertise || null,
        description: formData.description || null,
        image_url: imageUrl,
      });
      if (error) throw error;
      toast.success(t('memberAdded'));
      setDialogOpen(false);
      setFormData({});
      clearImage();
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
      setUploadingImage(false);
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
          {/* {t('noPersonalBoardMemberEntered')} */}
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
                {(() => {
                  const imageSrc = getBoardImageSrc(member.image_url);
                  return imageSrc ? (
                    <BoardImage src={imageSrc} alt={member.member_name} />
                  ) : (
                    <div className="w-12 h-12 rounded-lg flex-shrink-0 border border-gold/20 bg-gold/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-gold/60" />
                    </div>
                  );
                })()}
                
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

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) clearImage(); }}>
        <DialogContent className="max-w-md flex flex-col max-h-[90vh]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{t('addMember')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-1">
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
              <div className="flex items-center justify-between gap-2 mb-1">
                <Label>{t('description')}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAISuggest}
                  disabled={isGenerating || !formData.member_name}
                  className="text-gold hover:text-gold/80 h-8 px-2 shrink-0"
                >
                  {isGenerating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                  {t('ai')}
                </Button>
              </div>
              <Textarea value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div>
              <Label>{t('image')}</Label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleImageChange}
              />
              {imagePreview ? (
                <div className="mt-2 flex items-center gap-3 p-3 rounded-lg border border-gold/20 bg-gold/5">
                  <img src={imagePreview} alt="" className="w-14 h-14 rounded-lg object-cover border border-gold/20" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{imageFile?.name}</p>
                    <p className="text-xs text-muted-foreground">{t('imageSelected') || 'Image sélectionnée'}</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={clearImage} className="shrink-0 text-muted-foreground hover:text-destructive">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2 border-gold/30 text-gold hover:bg-gold/10"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <ImagePlus className="w-4 h-4 mr-2" />
                  {t('chooseImage') || 'Choisir une image'}
                </Button>
              )}
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 gap-2 sm:gap-2 pt-4 border-t border-gold/10">
            <Button variant="outline" onClick={() => { clearImage(); setDialogOpen(false); }}>{t('cancel')}</Button>
            <Button onClick={handleAddNew} disabled={saving || uploadingImage} className="bg-gold hover:bg-gold/90 text-primary-foreground">
              {(saving || uploadingImage) ? (uploadingImage ? (t('uploading') || "...") : "...") : t('add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
