// import React, { useState } from "react";
// import { Badge } from "@/components/ui/badge";
// import { Star, Quote, Trash2, Plus, Sparkles, FileUp, Loader2 } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { supabase } from "@/integrations/supabase/client";
// import { toast } from "sonner";
// import { InlineEditableField } from "@/components/ui/inline-editable-field";
// import { useLanguage } from "@/contexts/LanguageContext";

// interface InfluentialPerson {
//   id?: string;
//   person_name: string;
//   relationship?: string;
//   context?: string;
//   description?: string;
//   image_url?: string;
// }

// interface FamilyInfluentialProps {
//   people: InfluentialPerson[];
//   isEditable?: boolean;
//   onUpdate?: () => void;
// }

// export const FamilyInfluential = ({ people, isEditable = false, onUpdate }: FamilyInfluentialProps) => {
//   const { t } = useLanguage();
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [formData, setFormData] = useState<Partial<InfluentialPerson>>({});
//   const [saving, setSaving] = useState(false);
//   const [isGenerating, setIsGenerating] = useState(false);

//   const openNewDialog = () => {
//     setFormData({ person_name: "" });
//     setDialogOpen(true);
//   };

//   const updateField = async (personId: string, field: keyof InfluentialPerson, value: string) => {
//     try {
//       const { error } = await supabase
//         .from("family_influential")
//         .update({ [field]: value || null })
//         .eq("id", personId);
//       if (error) throw error;
//       onUpdate?.();
//     } catch (error: any) {
//       toast.error(error.message);
//     }
//   };

//   const handleAddNew = async () => {
//     if (!formData.person_name) {
//       toast.error(t('nameRequired'));
//       return;
//     }
//     setSaving(true);
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) throw new Error(t('notAuthenticated'));

//       const { error } = await supabase.from("family_influential").insert({
//         user_id: user.id,
//         person_name: formData.person_name,
//         relationship: formData.relationship || null,
//         context: formData.context || null,
//         description: formData.description || null,
//         image_url: formData.image_url || null,
//       });
//       if (error) throw error;
//       toast.success(t('personAdded'));
//       setDialogOpen(false);
//       setFormData({});
//       onUpdate?.();
//     } catch (error: any) {
//       toast.error(error.message);
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDelete = async (id: string, e: React.MouseEvent) => {
//     e.stopPropagation();
//     if (!confirm(t('deleteThisPerson'))) return;
//     try {
//       const { error } = await supabase.from("family_influential").delete().eq("id", id);
//       if (error) throw error;
//       toast.success(t('personDeleted'));
//       onUpdate?.();
//     } catch (error: any) {
//       toast.error(error.message);
//     }
//   };

//   const handleAISuggest = async () => {
//     if (!formData.person_name) {
//       toast.error(t('pleaseEnterNameFirst'));
//       return;
//     }
//     setIsGenerating(true);
//     try {
//       const { data, error } = await supabase.functions.invoke('family-ai-suggest', {
//         body: {
//           module: 'influential',
//           currentInput: {
//             name: formData.person_name,
//             relationship: formData.relationship,
//             context: formData.context
//           }
//         }
//       });
//       if (error) throw error;
//       if (data?.suggestion) {
//         setFormData({ ...formData, description: data.suggestion });
//         toast.success(t('suggestionGenerated'));
//       }
//     } catch (error: any) {
//       toast.error(t('generationError'));
//     } finally {
//       setIsGenerating(false);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {isEditable && (
//         <Button onClick={openNewDialog} variant="outline" size="sm" className="border-gold/30 text-gold hover:bg-gold/10">
//           <Plus className="w-4 h-4 mr-2" />
//           {t('add')}
//         </Button>
//       )}

//       {(!people || people.length === 0) ? (
//         <p className="text-muted-foreground text-sm italic">
//           {t('noInfluentialPersonEntered')}
//         </p>
//       ) : (
//         <div className="space-y-4">
//           {people.map((person, idx) => (
//             <div 
//               key={person.id || idx}
//               className="relative flex gap-4 p-4 bg-gold/5 rounded-lg border border-gold/10 hover:border-gold/20 transition-colors"
//             >
//               {isEditable && person.id && (
//                 <button
//                   onClick={(e) => handleDelete(person.id!, e)}
//                   className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
//                 >
//                   <Trash2 className="w-3.5 h-3.5" />
//                 </button>
//               )}
//               {person.image_url ? (
//                 <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-gold/30">
//                   <img src={person.image_url} alt={person.person_name} className="w-full h-full object-cover" />
//                 </div>
//               ) : (
//                 <div className="w-16 h-16 rounded-full flex-shrink-0 border-2 border-gold/30 bg-gold/10 flex items-center justify-center">
//                   <Star className="w-6 h-6 text-gold/60" />
//                 </div>
//               )}
              
//               <div className="flex-1 min-w-0 pr-8">
//                 {isEditable && person.id ? (
//                   <>
//                     <div className="flex items-center gap-2 flex-wrap">
//                       <h4 className="font-semibold text-foreground">
//                         <InlineEditableField
//                           value={person.person_name}
//                           onSave={(v) => updateField(person.id!, "person_name", v)}
//                           placeholder={t('name')}
//                         />
//                       </h4>
//                       <Badge variant="outline" className="border-gold/30 text-gold text-xs">
//                         <InlineEditableField
//                           value={person.relationship || ""}
//                           onSave={(v) => updateField(person.id!, "relationship", v)}
//                           placeholder={t('relation')}
//                           className="text-xs"
//                         />
//                       </Badge>
//                       <Badge variant="secondary" className="text-xs">
//                         <InlineEditableField
//                           value={person.context || ""}
//                           onSave={(v) => updateField(person.id!, "context", v)}
//                           placeholder={t('context')}
//                           className="text-xs"
//                         />
//                       </Badge>
//                     </div>
//                     <div className="mt-2 flex gap-2">
//                       <Quote className="w-4 h-4 text-gold/40 flex-shrink-0 mt-0.5" />
//                       <div className="text-sm text-muted-foreground italic">
//                         <InlineEditableField
//                           value={person.description || ""}
//                           onSave={(v) => updateField(person.id!, "description", v)}
//                           placeholder={t('descriptionCitation')}
//                           className="text-sm"
//                           multiline
//                         />
//                       </div>
//                     </div>
//                   </>
//                 ) : (
//                   <>
//                     <div className="flex items-center gap-2 flex-wrap">
//                       <h4 className="font-semibold text-foreground">{person.person_name}</h4>
//                       {person.relationship && (
//                         <Badge variant="outline" className="border-gold/30 text-gold text-xs">{person.relationship}</Badge>
//                       )}
//                       {person.context && (
//                         <Badge variant="secondary" className="text-xs">{person.context}</Badge>
//                       )}
//                     </div>
//                     {person.description && (
//                       <div className="mt-2 flex gap-2">
//                         <Quote className="w-4 h-4 text-gold/40 flex-shrink-0 mt-0.5" />
//                         <p className="text-sm text-muted-foreground italic">{person.description}</p>
//                       </div>
//                     )}
//                   </>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
//         <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto" data-scroll>
//           <DialogHeader>
//             <DialogTitle className="text-base sm:text-lg">{t('addPerson')}</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-3 sm:space-y-4">
//             <div>
//               <Label className="text-sm font-medium">{t('name')} *</Label>
//               <Input 
//                 value={formData.person_name || ""} 
//                 onChange={(e) => setFormData({ ...formData, person_name: e.target.value })} 
//                 className="mt-1"
//               />
//             </div>
//             <div>
//               <Label className="text-sm font-medium">{t('relation')}</Label>
//               <Input 
//                 value={formData.relationship || ""} 
//                 onChange={(e) => setFormData({ ...formData, relationship: e.target.value })} 
//                 placeholder={t('mentorFriendSponsor')}
//                 className="mt-1"
//               />
//             </div>
//             <div>
//               <Label className="text-sm font-medium">{t('context')}</Label>
//               <Input 
//                 value={formData.context || ""} 
//                 onChange={(e) => setFormData({ ...formData, context: e.target.value })} 
//                 placeholder={t('businessArtPolitics')}
//                 className="mt-1"
//               />
//             </div>
//             <div>
//               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
//                 <Label className="text-sm font-medium">{t('descriptionCitation')}</Label>
//                 <div className="flex gap-1">
//                   <Button
//                     type="button"
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => document.getElementById('import-doc-influential-main')?.click()}
//                     className="text-muted-foreground hover:text-foreground h-7 sm:h-8 px-2 text-xs sm:text-sm"
//                   >
//                     <FileUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
//                     <span className="hidden sm:inline">{t('import')}</span>
//                     <span className="sm:hidden">{t('import')}</span>
//                   </Button>
//                   <input
//                     id="import-doc-influential-main"
//                     type="file"
//                     accept=".pdf,.doc,.docx,.txt"
//                     className="hidden"
//                     onChange={() => toast.success(t('documentImportedAnalysisInProgress'))}
//                   />
//                   <Button
//                     type="button"
//                     variant="ghost"
//                     size="sm"
//                     onClick={handleAISuggest}
//                     disabled={isGenerating || !formData.person_name}
//                     className="text-gold hover:text-gold/80 h-7 sm:h-8 px-2 text-xs sm:text-sm"
//                   >
//                     {isGenerating ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
//                     {t('ai')}
//                   </Button>
//                 </div>
//               </div>
//               <Textarea 
//                 value={formData.description || ""} 
//                 onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
//                 className="mt-1 min-h-[100px] sm:min-h-[120px]"
//               />
//             </div>
//             <div>
//               <Label className="text-sm font-medium">{t('imageUrl')}</Label>
//               <Input 
//                 value={formData.image_url || ""} 
//                 onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} 
//                 className="mt-1"
//               />
//             </div>
//             <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-2">
//               <Button 
//                 variant="outline" 
//                 onClick={() => setDialogOpen(false)}
//                 className="w-full sm:w-auto"
//               >
//                 {t('cancel')}
//               </Button>
//               <Button 
//                 onClick={handleAddNew} 
//                 disabled={saving} 
//                 className="bg-gold hover:bg-gold/90 text-primary-foreground w-full sm:w-auto"
//               >
//                 {saving ? "..." : t('add')}
//               </Button>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// React and UI Components
import React, { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Star, Quote, Trash2, Plus, Sparkles, Loader2, ImagePlus, X, FileUp } from "lucide-react";
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

// Retourne un src utilisable pour <img> : URL (http/https), data URL (base64), ou chemin.
function getInfluentialImageSrc(url: string | undefined | null): string | null {
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
function InfluentialImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`rounded-full overflow-hidden flex-shrink-0 border-2 border-gold/30 bg-gold/10 flex items-center justify-center ${className || "w-12 h-12 sm:w-16 sm:h-16"}`}>
        <Star className="w-5 h-5 sm:w-6 sm:h-6 text-gold/60" />
      </div>
    );
  }
  return (
    <div className={`rounded-full overflow-hidden flex-shrink-0 border-2 border-gold/30 ${className || "w-12 h-12 sm:w-16 sm:h-16"}`}>
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

export const FamilyInfluential = ({ people, isEditable = false, onUpdate }: FamilyInfluentialProps) => {
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<InfluentialPerson>>({});
  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const openNewDialog = () => {
    setFormData({ person_name: "" });
    clearImage();
    setDialogOpen(true);
  };

  // Convertit le fichier image en data URL base64 pour enregistrement en base
  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(t("imageReadError") || "Impossible de lire l'image"));
      reader.readAsDataURL(file);
    });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t("pleaseSelectImage") || "Veuillez sélectionner une image (JPG, PNG, etc.)");
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
      toast.error(t("nameRequired"));
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthenticated"));

      let imageUrl: string | null = null;
      if (imageFile) {
        setUploadingImage(true);
        try {
          imageUrl = await fileToDataUrl(imageFile);
        } finally {
          setUploadingImage(false);
        }
      }

      const { error } = await supabase.from("family_influential").insert({
        user_id: user.id,
        person_name: formData.person_name,
        relationship: formData.relationship || null,
        context: formData.context || null,
        description: formData.description || null,
        image_url: imageUrl,
      });

      if (error) throw error;

      toast.success(t("personAdded"));
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
    if (!confirm(t("deleteThisPerson"))) return;
    try {
      const { error } = await supabase.from("family_influential").delete().eq("id", id);
      if (error) throw error;
      toast.success(t("personDeleted"));
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAISuggest = async () => {
    if (!formData.person_name) {
      toast.error(t("pleaseEnterNameFirst"));
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("family-ai-suggest", {
        body: {
          module: "influential",
          currentInput: {
            name: formData.person_name,
            relationship: formData.relationship,
            context: formData.context,
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

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Bouton Ajouter */}
      {isEditable && (
        <Button
          onClick={openNewDialog}
          variant="outline"
          size="sm"
          className="border-gold/30 text-gold hover:bg-gold/10"
        >
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t("add")}</span>
        </Button>
      )}

      {/* Liste */}
      {!people || people.length === 0 ? (
        <p className="text-muted-foreground text-sm italic">
          {/* {t("noInfluentialPersonEntered")} */}
        </p>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {people.map((person, idx) => (
            <div
              key={person.id || idx}
              className="relative flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 bg-gold/5 rounded-lg border border-gold/10 hover:border-gold/20 transition-colors"
            >
              {/* Supprimer */}
              {isEditable && person.id && (
                <button
                  onClick={(e) => handleDelete(person.id!, e)}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-2 sm:p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Avatar */}
              {(() => {
                const imageSrc = getInfluentialImageSrc(person.image_url);
                return imageSrc ? (
                  <InfluentialImage src={imageSrc} alt={person.person_name} />
                ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex-shrink-0 border-2 border-gold/30 bg-gold/10 flex items-center justify-center">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-gold/60" />
                </div>
              );
              })()}

              {/* Contenu */}
              <div className="flex-1 min-w-0 pr-0 sm:pr-8">
                {isEditable && person.id ? (
                  <>
                    {/* Nom + Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-wrap">
                      <h4 className="font-semibold text-foreground">
                        <InlineEditableField
                          value={person.person_name}
                          onSave={(v) => updateField(person.id!, "person_name", v)}
                          placeholder={t("name")}
                        />
                      </h4>
                      <Badge variant="outline" className="border-gold/30 text-gold text-xs">
                        <InlineEditableField
                          value={person.relationship || ""}
                          onSave={(v) => updateField(person.id!, "relationship", v)}
                          placeholder={t("relation")}
                          className="text-xs"
                        />
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <InlineEditableField
                          value={person.context || ""}
                          onSave={(v) => updateField(person.id!, "context", v)}
                          placeholder={t("context")}
                          className="text-xs"
                        />
                      </Badge>
                    </div>

                    {/* Citation */}
                    <div className="mt-2 flex gap-2">
                      <Quote className="w-4 h-4 text-gold/40 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-muted-foreground italic">
                        <InlineEditableField
                          value={person.description || ""}
                          onSave={(v) => updateField(person.id!, "description", v)}
                          placeholder={t("descriptionCitation")}
                          className="text-sm"
                          multiline
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-wrap">
                      <h4 className="font-semibold text-foreground">{person.person_name}</h4>
                      {person.relationship && (
                        <Badge variant="outline" className="border-gold/30 text-gold text-xs">
                          {person.relationship}
                        </Badge>
                      )}
                      {person.context && (
                        <Badge variant="secondary" className="text-xs">
                          {person.context}
                        </Badge>
                      )}
                    </div>

                    {person.description && (
                      <div className="mt-2 flex gap-2">
                        <Quote className="w-4 h-4 text-gold/40 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground italic">
                          {person.description}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) clearImage(); }}>
        <DialogContent className="w-[96vw] sm:w-full max-w-md mx-auto max-h-[92vh] overflow-y-auto bg-background border border-gold/20 p-0">
          <DialogHeader className="sticky top-0 z-10 bg-background border-b border-gold/10 px-4 py-3 sm:px-6 sm:py-4">
            <DialogTitle className="text-base sm:text-lg md:text-xl font-serif text-gold">
              {t("addPerson")}
            </DialogTitle>
          </DialogHeader>

          <div className="px-4 py-3 sm:px-6 sm:py-4 space-y-3 sm:space-y-4">
            {/* Nom */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium">{t("name")} *</Label>
              <Input
                value={formData.person_name || ""}
                onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                className="bg-background/50 border-gold/20 focus:border-gold/50 text-sm h-10"
              />
            </div>

            {/* Relation */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium">{t("relation")}</Label>
              <Input
                value={formData.relationship || ""}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                placeholder={t("mentorFriendSponsor")}
                className="bg-background/50 border-gold/20 focus:border-gold/50 text-sm h-10"
              />
            </div>

            {/* Contexte */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium">{t("context")}</Label>
              <Input
                value={formData.context || ""}
                onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                placeholder={t("businessArtPolitics")}
                className="bg-background/50 border-gold/20 focus:border-gold/50 text-sm h-10"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <Label className="text-xs sm:text-sm font-medium">{t("descriptionCitation")}</Label>
                <div className="flex gap-1">
                  {/* <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      document.getElementById("import-doc-influential-main")?.click()
                    }
                    className="text-muted-foreground hover:text-foreground h-8 px-2 text-sm"
                  >
                    <FileUp className="w-4 h-4 mr-1" />
                    {t("import")}
                  </Button>
                  <input
                    id="import-doc-influential-main"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={() =>
                      toast.success(t("documentImportedAnalysisInProgress"))
                    }
                  /> */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAISuggest}
                    disabled={isGenerating || !formData.person_name}
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
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-background/50 border-gold/20 focus:border-gold/50 min-h-[110px] resize-none text-sm"
                rows={3}
              />
            </div>

            {/* Image */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium">{t("image")}</Label>
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
                    <p className="text-xs text-muted-foreground">{t("imageSelected") || "Image sélectionnée"}</p>
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
                  {t("chooseImage") || "Choisir une image"}
                </Button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-background border-t border-gold/10 px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => { clearImage(); setDialogOpen(false); }}
                className="flex-1 text-sm h-10"
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleAddNew}
                disabled={saving || uploadingImage}
                className="flex-1 bg-gold hover:bg-gold/90 text-primary-foreground font-medium text-sm h-10"
              >
                {(saving || uploadingImage) && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                {(saving || uploadingImage) ? (uploadingImage ? (t("uploading") || "...") : t("adding")) : t("add")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
