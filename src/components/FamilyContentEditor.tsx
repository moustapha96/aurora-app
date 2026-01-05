import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Upload, X, Loader2 } from "lucide-react";

interface FamilyContent {
  bio?: string;
  family_text?: string;
  residences_text?: string;
  philanthropy_text?: string;
  network_text?: string;
  anecdotes_text?: string;
  personal_quote?: string;
  portrait_url?: string;
  gallery_photos?: string[];
}

interface FamilyContentEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: FamilyContent;
  onSave: () => void;
}

export const FamilyContentEditor = ({ open, onOpenChange, content, onSave }: FamilyContentEditorProps) => {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FamilyContent>({
    defaultValues: content
  });
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [newGalleryFiles, setNewGalleryFiles] = useState<{ file: File; preview: string }[]>([]);
  const [portraitPreview, setPortraitPreview] = useState<string | null>(content.portrait_url || null);
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>(content.gallery_photos || []);
  const [initialContent, setInitialContent] = useState<FamilyContent>(content);
  const [isFirstOpen, setIsFirstOpen] = useState(true);
  
  const formData = watch();

  useEffect(() => {
    if (open) {
      // Réinitialiser isLoading à l'ouverture du dialog
      setIsLoading(false);
      
      // Ne réinitialiser initialContent que lors de la première ouverture
      if (isFirstOpen) {
        setInitialContent(content);
        setIsFirstOpen(false);
      }
      
      // Toujours réinitialiser le formulaire et les previews
      reset(content);
      setPortraitPreview(content.portrait_url || null);
      setExistingGalleryUrls(content.gallery_photos || []);
      setPortraitFile(null);
      setNewGalleryFiles([]);
    }
  }, [content, reset, open, isFirstOpen]);

  const isFieldModified = (fieldName: keyof FamilyContent): boolean => {
    const currentValue = formData[fieldName];
    const initialValue = initialContent[fieldName];
    
    // Si les deux valeurs sont vides/nulles, ce n'est pas modifié
    if ((!currentValue || currentValue === '') && (!initialValue || initialValue === '')) {
      return false;
    }
    
    // Sinon, vérifier s'ils sont différents
    return currentValue !== initialValue;
  };

  const handlePortraitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPortraitFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPortraitPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
    // Reset input value to allow re-selection
    e.target.value = '';
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewGalleryFiles(prev => [...prev, { file, preview: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });
    // Reset input value to allow re-selection
    e.target.value = '';
  };

  const removeExistingGalleryImage = (index: number) => {
    setExistingGalleryUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewGalleryImage = (index: number) => {
    setNewGalleryFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('personal-content')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('personal-content')
      .getPublicUrl(uploadData.path);

    return publicUrl;
  };

  const onSubmit = async (data: FamilyContent) => {
    setIsLoading(true);
    try {
      // Rafraîchir la session avant de sauvegarder
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('Session refresh error:', refreshError);
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthenticated"));

      let portraitUrl = portraitPreview?.startsWith('data:') ? null : portraitPreview;
      // Utiliser les URLs existantes (qui n'ont pas été supprimées)
      let galleryUrls = [...existingGalleryUrls];

      // Upload portrait if changed
      if (portraitFile) {
        const path = `${user.id}/family/portrait-${Date.now()}.${portraitFile.name.split('.').pop()}`;
        portraitUrl = await uploadFile(portraitFile, path);
      }

      // Upload new gallery photos in parallel
      if (newGalleryFiles.length > 0) {
        const uploadPromises = newGalleryFiles.map(async ({ file }, index) => {
          const path = `${user.id}/family/gallery-${Date.now()}-${index}-${file.name}`;
          return uploadFile(file, path);
        });
        const uploadedUrls = await Promise.all(uploadPromises);
        galleryUrls.push(...uploadedUrls.filter((url): url is string => url !== null));
      }

      // Save to database
      const { error } = await supabase
        .from('family_content')
        .upsert({
          user_id: user.id,
          bio: data.bio,
          family_text: data.family_text,
          residences_text: data.residences_text,
          philanthropy_text: data.philanthropy_text,
          network_text: data.network_text,
          anecdotes_text: data.anecdotes_text,
          personal_quote: data.personal_quote,
          portrait_url: portraitUrl,
          gallery_photos: galleryUrls
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Mettre à jour les valeurs initiales après sauvegarde
      const newContent = {
        bio: data.bio,
        family_text: data.family_text,
        residences_text: data.residences_text,
        philanthropy_text: data.philanthropy_text,
        network_text: data.network_text,
        anecdotes_text: data.anecdotes_text,
        personal_quote: data.personal_quote,
        portrait_url: portraitUrl,
        gallery_photos: galleryUrls
      };
      setInitialContent(newContent);
      setIsFirstOpen(true);

      toast({
        title: t("contentSaved"),
        description: t("modificationsSavedSuccessfully")
      });

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: t("error"),
        description: t("cannotSaveModifications"),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("editMyContent")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="textes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="textes">{t("texts")}</TabsTrigger>
              <TabsTrigger value="photos">{t("photos")}</TabsTrigger>
            </TabsList>

            <TabsContent value="textes" className="space-y-4">
              <div>
                <Label htmlFor="bio">{t("biography")}</Label>
                <Textarea 
                  id="bio" 
                  {...register("bio")} 
                  rows={4}
                  className={isFieldModified('bio') ? 'field-modified' : ''}
                />
              </div>

              <div>
                <Label htmlFor="family_text">{t("family")}</Label>
                <Textarea 
                  id="family_text" 
                  {...register("family_text")} 
                  rows={4}
                  className={isFieldModified('family_text') ? 'field-modified' : ''}
                />
              </div>

              <div>
                <Label htmlFor="residences_text">{t("residences")}</Label>
                <Textarea 
                  id="residences_text" 
                  {...register("residences_text")} 
                  rows={4}
                  className={isFieldModified('residences_text') ? 'field-modified' : ''}
                />
              </div>

              <div>
                <Label htmlFor="philanthropy_text">{t("philanthropy")}</Label>
                <Textarea 
                  id="philanthropy_text" 
                  {...register("philanthropy_text")} 
                  rows={4}
                  className={isFieldModified('philanthropy_text') ? 'field-modified' : ''}
                />
              </div>

              <div>
                <Label htmlFor="network_text">{t("network")}</Label>
                <Textarea 
                  id="network_text" 
                  {...register("network_text")} 
                  rows={4}
                  className={isFieldModified('network_text') ? 'field-modified' : ''}
                />
              </div>

              <div>
                <Label htmlFor="anecdotes_text">{t("anecdotes")}</Label>
                <Textarea 
                  id="anecdotes_text" 
                  {...register("anecdotes_text")} 
                  rows={4}
                  className={isFieldModified('anecdotes_text') ? 'field-modified' : ''}
                />
              </div>

              <div>
                <Label htmlFor="personal_quote">{t("personalQuote")}</Label>
                <Input 
                  id="personal_quote" 
                  {...register("personal_quote")}
                  className={isFieldModified('personal_quote') ? 'field-modified' : ''}
                />
              </div>
            </TabsContent>

            <TabsContent value="photos" className="space-y-4">
              <div>
                <Label>{t("portraitPhoto")}</Label>
                <div className="mt-2 space-y-2">
                  {portraitPreview && (
                    <div className="relative w-32 h-32">
                      <img src={portraitPreview} alt="Portrait" className="w-full h-full object-cover rounded-lg" />
                      <button
                        type="button"
                        className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 z-20"
                        onClick={() => {
                          setPortraitPreview(null);
                          setPortraitFile(null);
                          setValue('portrait_url', null);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <Input type="file" accept="image/*" onChange={handlePortraitChange} />
                </div>
              </div>

              <div>
                <Label>{t("photoGallery")}</Label>
                <div className="mt-2 space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    {existingGalleryUrls.length === 0 && newGalleryFiles.length === 0 && (
                      <p className="text-muted-foreground text-sm col-span-4">{t("noPhotoInGallery")}</p>
                    )}
                    {/* Photos existantes */}
                    {existingGalleryUrls.map((url, index) => (
                      <div key={`existing-${index}`} className="relative">
                        <img src={url} alt={`Gallery ${index}`} className="w-full h-24 object-cover rounded-lg" />
                        <button
                          type="button"
                          className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 z-20"
                          onClick={() => removeExistingGalleryImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {/* Nouvelles photos */}
                    {newGalleryFiles.map((item, index) => (
                      <div key={`new-${index}`} className="relative">
                        <img src={item.preview} alt={`New ${index}`} className="w-full h-24 object-cover rounded-lg" />
                        <button
                          type="button"
                          className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 z-20"
                          onClick={() => removeNewGalleryImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="file" accept="image/*" multiple onChange={handleGalleryChange} />
                    <Upload className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                t("save")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
