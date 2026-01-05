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

interface BusinessContent {
  company_name?: string;
  company_description?: string;
  position_title?: string;
  achievements_text?: string;
  portfolio_text?: string;
  vision_text?: string;
  company_logo_url?: string;
  company_photos?: string[];
}

interface BusinessContentEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: BusinessContent;
  onSave: () => void;
}

export const BusinessContentEditor = ({ open, onOpenChange, content, onSave }: BusinessContentEditorProps) => {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<BusinessContent>({
    defaultValues: content
  });
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(content.company_logo_url || null);
  // Séparation des URLs existantes et des nouveaux previews base64
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>(content.company_photos || []);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const [initialContent, setInitialContent] = useState<BusinessContent>(content);
  const [isFirstOpen, setIsFirstOpen] = useState(true);
  
  const formData = watch();

  useEffect(() => {
    // Ne réinitialiser initialContent que lors de la première ouverture
    if (open && isFirstOpen) {
      setInitialContent(content);
      setIsFirstOpen(false);
    }
    
    // Toujours réinitialiser le formulaire et les previews
    reset(content);
    setLogoPreview(content.company_logo_url || null);
    setExistingPhotoUrls(content.company_photos || []);
    setNewPhotoPreviews([]);
    setLogoFile(null);
    setPhotoFiles([]);
  }, [content, reset, open, isFirstOpen]);

  const isFieldModified = (fieldName: keyof BusinessContent): boolean => {
    const currentValue = formData[fieldName];
    const initialValue = initialContent[fieldName];
    
    // Si les deux valeurs sont vides/nulles, ce n'est pas modifié
    if ((!currentValue || currentValue === '') && (!initialValue || initialValue === '')) {
      return false;
    }
    
    // Sinon, vérifier s'ils sont différents
    return currentValue !== initialValue;
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handlePhotosChange triggered');
    console.log('Input files:', e.target.files);
    const files = Array.from(e.target.files || []);
    console.log('Files array:', files.length, files);
    if (files.length > 0) {
      addPhotoFiles(files);
      toast({
        title: t("photosSelected"),
        description: `${files.length} ${t("photosAdded")}`
      });
    } else {
      console.log('No files selected');
    }
  };

  const addPhotoFiles = (files: File[]) => {
    console.log('addPhotoFiles called with', files.length, 'files');
    setPhotoFiles(prev => [...prev, ...files]);
    
    files.forEach((file, index) => {
      console.log(`Reading file ${index}:`, file.name, file.type, file.size);
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log(`File ${index} read complete`);
        setNewPhotoPreviews(prev => [...prev, reader.result as string]);
      };
      reader.onerror = (error) => {
        console.error(`Error reading file ${index}:`, error);
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle paste from clipboard (iOS Photos app, etc.)
  const handlePaste = async (e: React.ClipboardEvent) => {
    console.log('Paste event triggered', e.clipboardData);
    const items = e.clipboardData?.items;
    if (!items) {
      console.log('No clipboard items found');
      return;
    }

    console.log('Clipboard items count:', items.length);
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log('Item type:', item.type, 'kind:', item.kind);
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          console.log('Image file found:', file.name, file.size);
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      addPhotoFiles(imageFiles);
      toast({
        title: t("photosAdded"),
        description: `${imageFiles.length} ${t("photosPastedSuccessfully")}`
      });
    } else {
      console.log('No image files in clipboard');
      toast({
        title: t("noImageDetected"),
        description: t("copyImageFirstThenPaste"),
        variant: "destructive"
      });
    }
  };

  const removeExistingPhoto = (index: number) => {
    setExistingPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Compresser une image avant upload
  const compressImage = async (file: File, maxWidth = 1200, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      // Si ce n'est pas une image, retourner tel quel
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }

      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Calculer les nouvelles dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              console.log(`Compressed: ${file.size} -> ${compressedFile.size} bytes`);
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    // Compresser l'image avant upload
    const compressedFile = await compressImage(file);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('personal-content')
      .upload(path, compressedFile, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('personal-content')
      .getPublicUrl(uploadData.path);

    return publicUrl;
  };

  const onSubmit = async (data: BusinessContent) => {
    setIsLoading(true);
    try {
      // Rafraîchir la session si nécessaire
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        toast({
          title: t("sessionExpired"),
          description: t("pleaseReconnectToSave"),
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: t("sessionExpired"),
          description: t("pleaseReconnectToSave"),
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      let logoUrl = content.company_logo_url;
      // Utiliser les URLs existantes (qui peuvent avoir été modifiées par l'utilisateur)
      let photoUrls = [...existingPhotoUrls];

      if (logoFile) {
        const path = `${user.id}/business/logo-${Date.now()}.${logoFile.name.split('.').pop()}`;
        logoUrl = await uploadFile(logoFile, path);
      }

      // Upload des photos en parallèle pour plus de rapidité
      if (photoFiles.length > 0) {
        const uploadPromises = photoFiles.map((file, index) => {
          const path = `${user.id}/business/photo-${Date.now()}-${index}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
          return uploadFile(file, path);
        });
        const uploadedUrls = await Promise.all(uploadPromises);
        photoUrls.push(...uploadedUrls.filter((url): url is string => url !== null));
      }

      const { error } = await supabase
        .from('business_content')
        .upsert({
          user_id: user.id,
          company_name: data.company_name,
          company_description: data.company_description,
          position_title: data.position_title,
          achievements_text: data.achievements_text,
          portfolio_text: data.portfolio_text,
          vision_text: data.vision_text,
          company_logo_url: logoUrl,
          company_photos: photoUrls
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Mettre à jour les valeurs initiales après sauvegarde
      const newContent = {
        company_name: data.company_name,
        company_description: data.company_description,
        position_title: data.position_title,
        achievements_text: data.achievements_text,
        portfolio_text: data.portfolio_text,
        vision_text: data.vision_text,
        company_logo_url: logoUrl,
        company_photos: photoUrls
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
          <DialogTitle>{t("editMyBusinessContent")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="textes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="textes">{t("texts")}</TabsTrigger>
              <TabsTrigger value="photos">{t("photos")}</TabsTrigger>
            </TabsList>

            <TabsContent value="textes" className="space-y-4">
              <div>
                <Label htmlFor="company_name">{t("companyName")}</Label>
                <Input 
                  id="company_name" 
                  {...register("company_name")}
                  className={isFieldModified('company_name') ? 'field-modified' : ''}
                />
              </div>

              <div>
                <Label htmlFor="company_description">{t("companyDescription")}</Label>
                <Textarea 
                  id="company_description" 
                  {...register("company_description")} 
                  rows={4}
                  className={isFieldModified('company_description') ? 'field-modified' : ''}
                />
              </div>

              <div>
                <Label htmlFor="position_title">{t("positionTitle")}</Label>
                <Input 
                  id="position_title" 
                  {...register("position_title")}
                  className={isFieldModified('position_title') ? 'field-modified' : ''}
                />
              </div>

              <div>
                <Label htmlFor="achievements_text">{t("achievements")}</Label>
                <Textarea 
                  id="achievements_text" 
                  {...register("achievements_text")} 
                  rows={4}
                  className={isFieldModified('achievements_text') ? 'field-modified' : ''}
                />
              </div>

              <div>
                <Label htmlFor="portfolio_text">{t("portfolio")}</Label>
                <Textarea 
                  id="portfolio_text" 
                  {...register("portfolio_text")} 
                  rows={4}
                  className={isFieldModified('portfolio_text') ? 'field-modified' : ''}
                />
              </div>

              <div>
                <Label htmlFor="vision_text">{t("vision")}</Label>
                <Textarea 
                  id="vision_text" 
                  {...register("vision_text")} 
                  rows={4}
                  className={isFieldModified('vision_text') ? 'field-modified' : ''}
                />
              </div>
            </TabsContent>

            <TabsContent value="photos" className="space-y-4" onPaste={handlePaste}>
              <div>
                <Label>{t("companyLogo")}</Label>
                <div className="mt-2 space-y-2">
                  {logoPreview && (
                    <img src={logoPreview} alt="Logo" className="w-32 h-32 object-cover rounded-lg" />
                  )}
                  <Input type="file" accept="image/*" onChange={handleLogoChange} />
                </div>
              </div>

              <div>
                <Label>{t("companyPhotos")}</Label>
                <div className="mt-2 space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    {/* Photos existantes (URLs) */}
                    {existingPhotoUrls.map((url, index) => (
                      <div key={`existing-${index}`} className="relative group">
                        <img src={url} alt={`Photo ${index}`} className="w-full h-24 object-cover rounded-lg" />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeExistingPhoto(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {/* Nouvelles photos (base64 previews) */}
                    {newPhotoPreviews.map((preview, index) => (
                      <div key={`new-${index}`} className="relative group">
                        <img src={preview} alt={`Nouvelle photo ${index}`} className="w-full h-24 object-cover rounded-lg" />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeNewPhoto(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Zone de paste avec textarea cachée pour capturer le paste sur iOS */}
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors focus-within:border-primary/50 relative"
                    onClick={() => document.getElementById('paste-area')?.focus()}
                  >
                    <textarea
                      id="paste-area"
                      className="absolute inset-0 opacity-0 cursor-pointer resize-none"
                      onPaste={handlePaste}
                      placeholder=""
                      readOnly
                    />
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t("clickHereAndPastePhotos")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("orUseButtonBelow")}
                    </p>
                  </div>
                  
                  {/* Input file standard - fonctionne sur tous les appareils */}
                  <div className="flex items-center gap-2">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handlePhotosChange} 
                    />
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
