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
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FamilyContent>({
    defaultValues: content
  });
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [portraitPreview, setPortraitPreview] = useState<string | null>(content.portrait_url || null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>(content.gallery_photos || []);
  const [deletedGalleryUrls, setDeletedGalleryUrls] = useState<string[]>([]);
  const [initialContent, setInitialContent] = useState<FamilyContent>(content);
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
    setPortraitPreview(content.portrait_url || null);
    setGalleryPreviews(content.gallery_photos || []);
    setPortraitFile(null);
    setGalleryFiles([]);
    setDeletedGalleryUrls([]);
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
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setGalleryFiles(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGalleryPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryImage = (index: number) => {
    const urlToDelete = galleryPreviews[index];
    // Si c'est une URL existante (pas une preview base64), l'ajouter à la liste de suppression
    if (urlToDelete && !urlToDelete.startsWith('data:')) {
      setDeletedGalleryUrls(prev => [...prev, urlToDelete]);
    }
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      let portraitUrl = content.portrait_url;
      // Filtrer les URLs supprimées de la galerie
      let galleryUrls = (content.gallery_photos || []).filter(
        url => !deletedGalleryUrls.includes(url)
      );

      // Upload portrait if changed
      if (portraitFile) {
        const path = `${user.id}/family/portrait-${Date.now()}.${portraitFile.name.split('.').pop()}`;
        portraitUrl = await uploadFile(portraitFile, path);
      }

      // Upload new gallery photos
      for (const file of galleryFiles) {
        const path = `${user.id}/family/gallery-${Date.now()}-${file.name}`;
        const url = await uploadFile(file, path);
        if (url) galleryUrls.push(url);
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
        title: "Contenu sauvegardé",
        description: "Vos modifications ont été enregistrées avec succès"
      });

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications",
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
          <DialogTitle>Modifier mon contenu</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="textes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="textes">Textes</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
            </TabsList>

            <TabsContent value="textes" className="space-y-4">
              <div>
                <Label htmlFor="bio">Biographie</Label>
                <Textarea 
                  id="bio" 
                  {...register("bio")} 
                  rows={4}
                  className={isFieldModified('bio') ? 'field-modified' : ''}
                />
              </div>

              <div>
                <Label htmlFor="family_text">Famille</Label>
                <Textarea 
                  id="family_text" 
                  {...register("family_text")} 
                  rows={4}
                  className={isFieldModified('family_text') ? 'field-modified' : ''}
                />
              </div>

              <div>
                <Label htmlFor="residences_text">Résidences</Label>
                <Textarea 
                  id="residences_text" 
                  {...register("residences_text")} 
                  rows={4}
                  className={isFieldModified('residences_text') ? 'field-modified' : ''}
                />
              </div>

              <div>
                <Label htmlFor="philanthropy_text">Philanthropie</Label>
                <Textarea 
                  id="philanthropy_text" 
                  {...register("philanthropy_text")} 
                  rows={4}
                  className={isFieldModified('philanthropy_text') ? 'field-modified' : ''}
                />
              </div>

              <div>
                <Label htmlFor="network_text">Réseau</Label>
                <Textarea 
                  id="network_text" 
                  {...register("network_text")} 
                  rows={4}
                  className={isFieldModified('network_text') ? 'field-modified' : ''}
                />
              </div>

              <div>
                <Label htmlFor="anecdotes_text">Anecdotes</Label>
                <Textarea 
                  id="anecdotes_text" 
                  {...register("anecdotes_text")} 
                  rows={4}
                  className={isFieldModified('anecdotes_text') ? 'field-modified' : ''}
                />
              </div>

              <div>
                <Label htmlFor="personal_quote">{t('personalQuote')}</Label>
                <Input 
                  id="personal_quote" 
                  {...register("personal_quote")}
                  className={isFieldModified('personal_quote') ? 'field-modified' : ''}
                />
              </div>
            </TabsContent>

            <TabsContent value="photos" className="space-y-4">
              <div>
                <Label>Photo de portrait</Label>
                <div className="mt-2 space-y-2">
                  {portraitPreview && (
                    <img src={portraitPreview} alt="Portrait" className="w-32 h-32 object-cover rounded-lg" />
                  )}
                  <Input type="file" accept="image/*" onChange={handlePortraitChange} />
                </div>
              </div>

              <div>
                <Label>Galerie photos</Label>
                <div className="mt-2 space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    {galleryPreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img src={preview} alt={`Gallery ${index}`} className="w-full h-24 object-cover rounded-lg" />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeGalleryImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
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
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                "Sauvegarder"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
