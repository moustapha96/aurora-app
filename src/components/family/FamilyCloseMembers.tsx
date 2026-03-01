// React and UI Components
import React, { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { User, Briefcase, Trash2, Plus, Sparkles, Loader2, FileText, ImagePlus, X, Maximize2, Image as ImageIcon, Quote, Calendar } from "lucide-react";
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

// Storage utilities - centralized upload functions with correct RLS path patterns
import { uploadFamilyDocument } from "@/lib/storageUploadUtils";

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

// Retourne un src utilisable pour <img> : URL (http/https, ex. Supabase Storage), data URL (base64), ou chemin relatif (/).
// Les data URLs sont nettoyées (retours à la ligne supprimés) pour afficher correctement.
function getMemberImageSrc(url: string | undefined | null): string | null {
  if (url == null || typeof url !== "string") return null;
  const s = String(url).trim();
  if (!s) return null;
  // URLs absolues : Supabase Storage (https://xxx.supabase.co/storage/...), CDN, etc.
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("data:")) {
    return s.replace(/\r?\n/g, "");
  }
  if (s.startsWith("/") || s.startsWith("./") || s.startsWith("../")) return s;
  // Chemin sans préfixe : considérer comme chemin public (ex. "logo.png" -> "/logo.png")
  return `/${s.replace(/^\/*/, "")}`;
}

function isExternalUrl(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}

// Affiche l'image membre (URL, data ou chemin) ou le placeholder ; en cas d'erreur de chargement, affiche le placeholder.
function MemberImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gold/5">
        <User className="w-16 h-16 text-gold/20" />
      </div>
    );
  }
  return (
    <>
      <div className="absolute inset-0">
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover object-center"
          loading="lazy"
          decoding="async"
          crossOrigin={isExternalUrl(src) ? "anonymous" : undefined}
          referrerPolicy={isExternalUrl(src) ? "no-referrer" : undefined}
          onError={() => setFailed(true)}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none" />
    </>
  );
}

// Avatar rond pour la liste style Influential : image ou placeholder User, avec fallback erreur.
function CloseMemberAvatar({
  src,
  alt,
  isEditable,
  onPhotoClick,
  onRemovePhoto,
  isUploading,
}: {
  src: string | null;
  alt: string;
  isEditable?: boolean;
  onPhotoClick?: () => void;
  onRemovePhoto?: (e: React.MouseEvent) => void;
  isUploading?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;
  const wrapperClass = "w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-gold/20 bg-gold/10 flex items-center justify-center";
  const clickable = isEditable && (onPhotoClick || onRemovePhoto);

  if (showImage) {
    return (
      <div className={`relative ${wrapperClass} ${clickable ? "cursor-pointer group" : ""}`} onClick={isEditable ? onPhotoClick : undefined} role={isEditable ? "button" : undefined}>
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
        {isEditable && (
          <>
            {isUploading ? (
              <span className="absolute inset-0 flex items-center justify-center bg-background/60">
                <Loader2 className="w-6 h-6 animate-spin text-gold" />
              </span>
            ) : (
              <>
                <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                {onRemovePhoto && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemovePhoto(e); }}
                    className="absolute top-0.5 right-0.5 p-1 rounded-full bg-destructive/90 hover:bg-destructive text-destructive-foreground transition-colors"
                    title="Retirer la photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>
    );
  }
  return (
    <div
      className={`${wrapperClass} ${clickable ? "cursor-pointer hover:bg-gold/20 transition-colors" : ""}`}
      onClick={isEditable ? onPhotoClick : undefined}
      role={isEditable ? "button" : undefined}
      title={isEditable ? "Ajouter une photo" : undefined}
    >
      {isUploading ? (
        <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-gold animate-spin" />
      ) : (
        <User className="w-5 h-5 sm:w-6 sm:h-6 text-gold/60" />
      )}
    </div>
  );
}

export const FamilyCloseMembers = ({ members, isEditable = false, onUpdate }: FamilyCloseMembersProps) => {
  console.log("members", members);
  const { t } = useLanguage();
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newFormData, setNewFormData] = useState<Partial<CloseFamilyMember>>({});
  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImportingDoc, setIsImportingDoc] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [textPopup, setTextPopup] = useState<{ title: string; content: string } | null>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const memberPhotoInputRef = useRef<HTMLInputElement>(null);
  const memberIdForPhotoRef = useRef<string | null>(null);
  const [memberPhotoUploadingId, setMemberPhotoUploadingId] = useState<string | null>(null);

  const TRUNCATE_LENGTH = 100;

  const handleExistingMemberPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const memberId = memberIdForPhotoRef.current;
    e.target.value = "";
    memberIdForPhotoRef.current = null;
    if (!file || !memberId) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("pleaseSelectImage") || "Veuillez sélectionner une image (JPG, PNG, etc.)");
      return;
    }
    setMemberPhotoUploadingId(memberId);
    try {
      const dataUrl = await fileToDataUrl(file);
      await updateField(memberId, "image_url", dataUrl);
      toast.success(t("photoAdded") || "Photo ajoutée");
      onUpdate?.();
    } catch (err) {
      toast.error(t("imageReadError") || "Impossible de lire l'image");
    } finally {
      setMemberPhotoUploadingId(null);
    }
  };

  const triggerMemberPhotoInput = (memberId: string) => {
    memberIdForPhotoRef.current = memberId;
    memberPhotoInputRef.current?.click();
  };

  const openTextPopup = (title: string, content: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTextPopup({ title, content });
  };

  const renderClickableField = (content: string, title: string, className = "") => {
    if (!content.trim()) return <span className={className}>—</span>;
    const isLong = content.length > TRUNCATE_LENGTH;
    const displayText = isLong ? `${content.slice(0, TRUNCATE_LENGTH)}…` : content;
    return (
      <button
        type="button"
        onClick={(e) => openTextPopup(title, content, e)}
        className={`text-left cursor-pointer hover:text-gold focus:outline-none focus:ring-0 focus:underline inline-flex items-center gap-1.5 group min-h-0 py-0 px-0 bg-transparent border-0 font-inherit ${className}`}
        title={t('viewFullText') || 'Voir le texte complet'}
      >
        <span className="min-w-0 truncate">{displayText}</span>
        <Maximize2 className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 text-gold flex-shrink-0" aria-hidden />
      </button>
    );
  };

  const InfoRow = ({ label, value, popupTitle }: { label: string; value: string | undefined; popupTitle: string }) => {
    if (value == null || value.trim() === "") return null;
    return (
      <div className="flex flex-col gap-0.5 py-1.5 border-b border-gold/10 last:border-0">
        <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-gold/80">{label}</span>
        {renderClickableField(value, popupTitle, "text-sm text-foreground")}
      </div>
    );
  };

  // Handle document import using centralized utility - ensures correct RLS path: {userId}/documents/{timestamp}.{ext}
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

      // Upload using centralized utility - path: {userId}/documents/{timestamp}.{ext}
      const result = await uploadFamilyDocument(file, user.id, 'documents');
      
      if (!result.success || !result.storagePath) {
        throw new Error(result.error || t('documentImportError'));
      }

      // Save document reference in database
      await supabase.from('family_documents').insert({
        user_id: user.id,
        file_name: file.name,
        file_path: result.storagePath,
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

  const updateField = async (memberId: string, field: keyof CloseFamilyMember, value: string | null) => {
    try {
      const { error } = await supabase
        .from("family_close")
        .update({ [field]: value ?? null })
        .eq("id", memberId);
      if (error) throw error;
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRemoveMemberPhoto = async (memberId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t('removePhotoConfirm') || "Retirer la photo de ce membre ?")) return;
    try {
      await updateField(memberId, "image_url", null);
      toast.success(t('photoRemoved') || "Photo retirée");
    } catch {
      // error already shown in updateField
    }
  };

  // Convertit un fichier image en data URL base64 (data:image/jpeg;base64,...) pour enregistrement en base
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

      let imageUrl: string | null = null;
      if (imageFile) {
        setUploadingImage(true);
        try {
          imageUrl = await fileToDataUrl(imageFile);
        } finally {
          setUploadingImage(false);
        }
      }

      const { error } = await supabase.from("family_close").insert({
        user_id: user.id,
        relation_type: relationType,
        member_name: memberName,
        birth_year: (newFormData.birth_year || "").trim() || null,
        occupation: (newFormData.occupation || "").trim() || null,
        description: (newFormData.description || "").trim() || null,
        image_url: imageUrl,
      });
      if (error) throw error;
      toast.success(t('memberAdded'));
      setNewDialogOpen(false);
      setNewFormData({});
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
      const { error } = await supabase.from("family_close").delete().eq("id", id);
      if (error) throw error;
      toast.success(t('memberDeleted'));
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleOpenDialog = () => {
    setNewFormData({ relation_type: "", member_name: "" });
    clearImage();
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
        <div className="space-y-3 sm:space-y-4">
          {members.map((member, idx) => {
            const imageSrc = getMemberImageSrc(member.image_url);
            return (
              <div
                key={member.id || idx}
                className="relative flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 bg-gold/5 rounded-lg border border-gold/10 hover:border-gold/20 transition-colors"
              >
                {isEditable && member.id && (
                  <button
                    onClick={(e) => handleDelete(member.id!, e)}
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-2 sm:p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <CloseMemberAvatar
                  src={imageSrc}
                  alt={member.member_name}
                  isEditable={isEditable && !!member.id}
                  onPhotoClick={member.id ? () => triggerMemberPhotoInput(member.id!) : undefined}
                  onRemovePhoto={member.id && imageSrc ? (e) => handleRemoveMemberPhoto(member.id!, e) : undefined}
                  isUploading={memberPhotoUploadingId === member.id}
                />

                <div className="flex-1 min-w-0 pr-0 sm:pr-8">
                  {isEditable && member.id ? (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-wrap">
                        <h4 className="font-semibold text-foreground">
                          <InlineEditableField
                            value={member.member_name}
                            onSave={(v) => updateField(member.id!, "member_name", v)}
                            placeholder={t("name")}
                          />
                        </h4>
                        <Badge variant="outline" className="border-gold/30 text-gold text-xs w-fit">
                          <InlineEditableField
                            value={member.relation_type}
                            onSave={(v) => updateField(member.id!, "relation_type", v)}
                            placeholder={t("relation")}
                            className="text-xs"
                          />
                        </Badge>
                        <Badge variant="secondary" className="text-xs w-fit">
                          <InlineEditableField
                            value={member.occupation || ""}
                            onSave={(v) => updateField(member.id!, "occupation", v)}
                            placeholder={t("occupation")}
                            className="text-xs"
                          />
                        </Badge>
                      </div>
                      {(member.birth_year != null && member.birth_year !== "") && (
                        <p className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <InlineEditableField
                            value={member.birth_year}
                            onSave={(v) => updateField(member.id!, "birth_year", v)}
                            placeholder={t("birthYear")}
                            className="text-xs"
                          />
                        </p>
                      )}
                      <div className="mt-2 flex gap-2">
                        <Quote className="w-4 h-4 text-gold/40 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-muted-foreground italic min-w-0">
                          <InlineEditableField
                            value={member.description || ""}
                            onSave={(v) => updateField(member.id!, "description", v)}
                            placeholder={t("description")}
                            className="text-sm whitespace-pre-wrap block w-full"
                            multiline
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-wrap">
                        <h4 className="font-semibold text-foreground">{member.member_name}</h4>
                        {member.relation_type && (
                          <Badge variant="outline" className="border-gold/30 text-gold text-xs w-fit">
                            {member.relation_type}
                          </Badge>
                        )}
                        {member.occupation && (
                          <Badge variant="secondary" className="text-xs w-fit">
                            {member.occupation}
                          </Badge>
                        )}
                      </div>
                      {member.birth_year && (
                        <p className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          {member.birth_year}
                        </p>
                      )}
                      {(member.description && member.description.trim()) ? (
                        <div className="mt-2 flex gap-2">
                          <Quote className="w-4 h-4 text-gold/40 flex-shrink-0 mt-0.5" />
                          {member.description.length > TRUNCATE_LENGTH ? (
                            <button
                              type="button"
                              onClick={(e) => openTextPopup(`${t("description")} — ${member.member_name}`, member.description!, e)}
                              className="text-left text-sm text-muted-foreground italic hover:text-foreground transition-colors inline-flex items-start gap-1.5 group"
                              title={t("viewFullText") || "Voir le texte complet"}
                            >
                              <span className="line-clamp-2">
                                {member.description.slice(0, TRUNCATE_LENGTH)}…
                              </span>
                              <Maximize2 className="w-3.5 h-3.5 text-gold/70 group-hover:text-gold flex-shrink-0 mt-0.5" aria-hidden />
                            </button>
                          ) : (
                            <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">
                              {member.description}
                            </p>
                          )}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <input
        ref={memberPhotoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleExistingMemberPhotoChange}
      />

      <Dialog open={newDialogOpen} onOpenChange={(open) => { setNewDialogOpen(open); if (!open) clearImage(); }}>
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
              <Label className="text-xs sm:text-sm font-medium text-foreground">{t('image')}</Label>
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
                {/* IA Aurora - commenté pour désactivation temporaire
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
                */}
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
                  onClick={() => { clearImage(); setNewDialogOpen(false); }}
                  className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                >
                  {t('cancel')}
                </Button>
                <Button 
                  onClick={handleAddNew} 
                  disabled={saving || uploadingImage} 
                  className="flex-1 bg-gold hover:bg-gold/90 text-primary-foreground font-medium text-xs sm:text-sm h-8 sm:h-9"
                >
                  {(saving || uploadingImage) ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mr-1" /> : null}
                  {(saving || uploadingImage) ? (uploadingImage ? (t('uploading') || "...") : t('adding')) : t('add')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Popup pour afficher le texte complet de n'importe quel champ */}
      <Dialog open={!!textPopup} onOpenChange={(open) => !open && setTextPopup(null)}>
        <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[85vh] overflow-y-auto bg-background border border-gold/20 shadow-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-gold pr-8 text-base sm:text-lg">
              {textPopup?.title}
            </DialogTitle>
          </DialogHeader>
          {textPopup && (
            <div className="rounded-xl bg-muted/20 border border-gold/10 p-5 sm:p-6">
              <p className="text-sm sm:text-base text-foreground whitespace-pre-wrap break-words leading-relaxed">
                {textPopup.content.trim() || "—"}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
