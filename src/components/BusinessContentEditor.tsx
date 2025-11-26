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
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(content.company_logo_url || null);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>(content.company_photos || []);
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
    setPhotoPreviews(content.company_photos || []);
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
    const files = Array.from(e.target.files || []);
    setPhotoFiles(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
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

  const onSubmit = async (data: BusinessContent) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      let logoUrl = content.company_logo_url;
      let photoUrls = [...(content.company_photos || [])];

      if (logoFile) {
        const path = `${user.id}/business/logo-${Date.now()}.${logoFile.name.split('.').pop()}`;
        logoUrl = await uploadFile(logoFile, path);
      }

      for (const file of photoFiles) {
        const path = `${user.id}/business/photo-${Date.now()}-${file.name}`;
        const url = await uploadFile(file, path);
        if (url) photoUrls.push(url);
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
          <DialogTitle>Modifier mon contenu business</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="textes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="textes">Textes</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
            </TabsList>

            <TabsContent value="textes" className="space-y-4">
              <div>
                <Label htmlFor="company_name">Nom de l'entreprise</Label>
                <Input 
                  id="company_name" 
                  {...register("company_name")}
                  className={isFieldModified('company_name') ? 'field-modified' : ''}
                />
              </div>

              <div>
                <Label htmlFor="company_description">Description de l'entreprise</Label>
                <Textarea 
                  id="company_description" 
                  {...register("company_description")} 
                  rows={4}
                  className={isFieldModified('company_description') ? 'field-modified' : ''}
                />
              </div>

              <div>
                <Label htmlFor="position_title">Titre du poste</Label>
                <Input 
                  id="position_title" 
                  {...register("position_title")}
                  className={isFieldModified('position_title') ? 'field-modified' : ''}
                />
              </div>

              <div>
                <Label htmlFor="achievements_text">Réalisations</Label>
                <Textarea 
                  id="achievements_text" 
                  {...register("achievements_text")} 
                  rows={4}
                  className={isFieldModified('achievements_text') ? 'field-modified' : ''}
                />
              </div>

              <div>
                <Label htmlFor="portfolio_text">Portfolio</Label>
                <Textarea 
                  id="portfolio_text" 
                  {...register("portfolio_text")} 
                  rows={4}
                  className={isFieldModified('portfolio_text') ? 'field-modified' : ''}
                />
              </div>

              <div>
                <Label htmlFor="vision_text">Vision</Label>
                <Textarea 
                  id="vision_text" 
                  {...register("vision_text")} 
                  rows={4}
                  className={isFieldModified('vision_text') ? 'field-modified' : ''}
                />
              </div>
            </TabsContent>

            <TabsContent value="photos" className="space-y-4">
              <div>
                <Label>Logo de l'entreprise</Label>
                <div className="mt-2 space-y-2">
                  {logoPreview && (
                    <img src={logoPreview} alt="Logo" className="w-32 h-32 object-cover rounded-lg" />
                  )}
                  <Input type="file" accept="image/*" onChange={handleLogoChange} />
                </div>
              </div>

              <div>
                <Label>Photos de l'entreprise</Label>
                <div className="mt-2 space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img src={preview} alt={`Photo ${index}`} className="w-full h-24 object-cover rounded-lg" />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removePhoto(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="file" accept="image/*" multiple onChange={handlePhotosChange} />
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
