// React and UI Components
import React, { useState, useRef } from "react";
import { Users, Trash2, Plus, Sparkles, Loader2, ImagePlus, X, Quote, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Supabase client
import { supabase } from "@/integrations/supabase/client";

// Utilities
import { toast } from "sonner";
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

// Avatar rond (style Influential) : image ou placeholder Users ; en cas d'erreur affiche le placeholder.
function BoardImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex-shrink-0 border-2 border-gold/30 bg-gold/10 flex items-center justify-center">
        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-gold/60" />
      </div>
    );
  }
  return (
    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-gold/30">
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
  const [editingMember, setEditingMember] = useState<BoardMember | null>(null);
  const [formData, setFormData] = useState<Partial<BoardMember>>({});
  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const openNewDialog = () => {
    setEditingMember(null);
    setFormData({ member_name: "", role: "" });
    setImageFile(null);
    setImagePreview(null);
    setDialogOpen(true);
  };

  const openEditDialog = (member: BoardMember) => {
    setEditingMember(member);
    setFormData({
      member_name: member.member_name,
      role: member.role,
      organization: member.organization ?? "",
      expertise: member.expertise ?? "",
      description: member.description ?? "",
    });
    setImageFile(null);
    const src = getBoardImageSrc(member.image_url);
    setImagePreview(src || null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingMember(null);
    setFormData({});
    clearImage();
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

  const handleSave = async () => {
    if (!formData.member_name || !formData.role) {
      toast.error(t('nameAndRoleRequired'));
      return;
    }
    setSaving(true);
    try {
      let imageUrl: string | null = editingMember?.image_url ?? null;
      if (imageFile) {
        setUploadingImage(true);
        try {
          imageUrl = await fileToDataUrl(imageFile);
        } finally {
          setUploadingImage(false);
        }
      } else if (editingMember && !imagePreview) {
        imageUrl = null;
      }

      const payload = {
        member_name: formData.member_name,
        role: formData.role,
        organization: formData.organization || null,
        expertise: formData.expertise || null,
        description: formData.description || null,
        image_url: imageUrl,
      };

      if (editingMember?.id) {
        const { error } = await supabase
          .from("family_board")
          .update(payload)
          .eq("id", editingMember.id);
        if (error) throw error;
        toast.success(t('memberModified') || t('saved'));
        closeDialog();
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error(t('notAuthenticated'));
        const { error } = await supabase.from("family_board").insert({
          user_id: user.id,
          ...payload,
        });
        if (error) throw error;
        toast.success(t('memberAdded'));
        closeDialog();
      }
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
        <div className="space-y-3 sm:space-y-4">
          {members.map((member, idx) => (
            <div
              key={member.id || idx}
              className="relative flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 bg-gold/5 rounded-lg border border-gold/10 hover:border-gold/20 transition-colors"
            >
              {isEditable && member.id && (
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 flex items-center gap-1">
                  <button
                    onClick={() => openEditDialog(member)}
                    className="p-2 sm:p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-gold/30 text-gold hover:bg-gold/10 transition-colors"
                    title={t('edit')}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(member.id!, e)}
                    className="p-2 sm:p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    title={t('delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Avatar */}
              {(() => {
                const imageSrc = getBoardImageSrc(member.image_url);
                return imageSrc ? (
                  <BoardImage src={imageSrc} alt={member.member_name} />
                ) : (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex-shrink-0 border-2 border-gold/30 bg-gold/10 flex items-center justify-center">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-gold/60" />
                  </div>
                );
              })()}

              {/* Contenu (affichage seul ; modification via le dialog avec grands champs) */}
              <div className="flex-1 min-w-0 pr-0 sm:pr-20">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-wrap">
                  <h4 className="font-semibold text-foreground">{member.member_name}</h4>
                  {member.role && (
                    <Badge variant="outline" className="border-gold/30 text-gold text-xs w-fit">
                      {member.role}
                    </Badge>
                  )}
                  {member.organization && (
                    <Badge variant="secondary" className="text-xs w-fit">
                      {member.organization}
                    </Badge>
                  )}
                  {member.expertise && (
                    <Badge variant="secondary" className="text-xs w-fit">
                      {member.expertise}
                    </Badge>
                  )}
                </div>
                {(member.description && member.description.trim()) ? (
                  <div className="mt-2 flex gap-2">
                    <Quote className="w-4 h-4 text-gold/40 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">
                      {member.description}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="w-[95vw] sm:w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0 px-1">
            <DialogTitle className="text-base sm:text-lg">
              {editingMember ? t('editMember') || t('edit') : t('addMember')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-1">
            <div>
              <Label className="text-sm font-medium">{t('name')} *</Label>
              <Input
                className="mt-2 h-11 sm:h-12 text-base px-3"
                value={formData.member_name || ""}
                onChange={(e) => setFormData({ ...formData, member_name: e.target.value })}
                placeholder={t('firstNameLastName')}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{t('role')} *</Label>
              <Input
                className="mt-2 h-11 sm:h-12 text-base px-3"
                value={formData.role || ""}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder={t('advisorLawyerCoach')}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{t('organization')}</Label>
              <Input
                className="mt-2 h-11 sm:h-12 text-base px-3"
                value={formData.organization || ""}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                placeholder={t('organization')}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{t('expertise')}</Label>
              <Input
                className="mt-2 h-11 sm:h-12 text-base px-3"
                value={formData.expertise || ""}
                onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                placeholder={t('expertise')}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{t('description')}</Label>
              <Textarea
                className="mt-2 min-h-[140px] sm:min-h-[160px] text-base px-3 py-3 resize-none"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('description')}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{t('image')}</Label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleImageChange}
              />
              {imagePreview ? (
                <div className="mt-2 flex flex-wrap items-center gap-3 p-3 rounded-lg border border-gold/20 bg-gold/5">
                  <img src={imagePreview} alt="" className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover border border-gold/20" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{imageFile?.name || t('imageSelected')}</p>
                    <p className="text-xs text-muted-foreground">{t('changePhoto') || t('image')}</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={clearImage} className="shrink-0 text-muted-foreground hover:text-destructive">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2 h-11 border-gold/30 text-gold hover:bg-gold/10 text-sm"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <ImagePlus className="w-4 h-4 mr-2" />
                  {t('chooseImage') || 'Choisir une image'}
                </Button>
              )}
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 gap-2 flex-wrap sm:flex-nowrap pt-4 border-t border-gold/10">
            <Button variant="outline" onClick={closeDialog} className="flex-1 sm:flex-initial">{t('cancel')}</Button>
            <Button onClick={handleSave} disabled={saving || uploadingImage} className="flex-1 sm:flex-initial bg-gold hover:bg-gold/90 text-primary-foreground">
              {(saving || uploadingImage) ? (uploadingImage ? (t('uploading') || "...") : "...") : (editingMember ? t('save') : t('add'))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
