import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface BusinessImageGalleryProps {
  images?: string[] | null;
  editable?: boolean;
  onImagesChange: (images: string[]) => void;
}

const MAX_SIZE_MB = 2;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const MAX_IMAGES = 10;

export const BusinessImageGallery: React.FC<BusinessImageGalleryProps> = ({
  images = [],
  editable = true,
  onImagesChange,
}) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Normaliser les images : s'assurer que c'est un tableau
  const imageList = React.useMemo(() => {
    if (!images) return [];
    if (Array.isArray(images)) return images.filter(img => img && typeof img === 'string');
    // Si c'est un string JSON, le parser
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) ? parsed.filter(img => img && typeof img === 'string') : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [images]);

  // Log pour déboguer
  useEffect(() => {
    console.log('BusinessImageGallery - images reçues:', images);
    console.log('BusinessImageGallery - imageList normalisée:', imageList);
    console.log('BusinessImageGallery - hasImages:', imageList.length > 0);
  }, [images, imageList]);

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) {
        resolve(file);
        return;
      }

      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      img.onload = () => {
        let { width, height } = img;
        const maxDim = 1920;
        
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = (height * maxDim) / width;
            width = maxDim;
          } else {
            width = (width * maxDim) / height;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size <= MAX_SIZE_BYTES) {
              resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
            } else if (blob) {
              // Try with lower quality
              canvas.toBlob(
                (blob2) => {
                  if (blob2) {
                    resolve(new File([blob2], file.name, { type: "image/jpeg", lastModified: Date.now() }));
                  } else {
                    resolve(file);
                  }
                },
                "image/jpeg",
                0.6
              );
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          0.85
        );
      };

      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Vérifier la limite
    if (imageList.length + files.length > MAX_IMAGES) {
      toast({
        title: t("error"),
        description: t("businessMaxImagesReached").replace("{max}", MAX_IMAGES.toString()),
        variant: "destructive",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Valider les fichiers
    const validFiles: File[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: t("error"),
          description: t("businessImageFormatNotAllowed"),
          variant: "destructive",
        });
        continue;
      }

      if (file.size > MAX_SIZE_BYTES) {
        toast({
          title: t("error"),
          description: t("businessImageTooLarge").replace("{size}", MAX_SIZE_MB.toString()),
          variant: "destructive",
        });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthenticated"));

      const uploadedUrls: string[] = [];

      for (const file of validFiles) {
        const compressedFile = await compressImage(file);
        const fileExt = "jpg";
        const filePath = `${user.id}/business/images/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("personal-content")
          .upload(filePath, compressedFile, { upsert: true });

        if (uploadError) throw uploadError;

        // Obtenir l'URL publique de l'image
        const { data: { publicUrl } } = supabase.storage
          .from("personal-content")
          .getPublicUrl(filePath);
        
        // Vérifier que l'URL est valide
        if (!publicUrl) {
          throw new Error('Impossible de générer l\'URL publique de l\'image');
        }
        
        console.log('Image uploadée avec succès:', {
          filePath,
          publicUrl,
          fileSize: compressedFile.size
        });

        uploadedUrls.push(publicUrl);
      }

      // Mettre à jour la base de données
      const newImages = [...imageList, ...uploadedUrls];
      const { error: dbError } = await supabase
        .from("business_content")
        .upsert({
          user_id: user.id,
          company_photos: newImages,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (dbError) throw dbError;

      onImagesChange(newImages);
      toast({ 
        title: t("businessImagesUploaded") || t("businessImageUploaded"),
        description: `${uploadedUrls.length} ${uploadedUrls.length === 1 ? (t("image") || "image") : (t("images") || "images")} ${t("added") || "ajoutée(s)"}`
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: t("error"),
        description: error.message || t("uploadError"),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async (index: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer l'URL de l'image à supprimer
      const imageToRemove = imageList[index];
      console.log('Suppression de l\'image:', imageToRemove);

      // Supprimer le fichier du storage Supabase
      if (imageToRemove) {
        try {
          // Extraire le chemin de l'objet depuis l'URL
          // Format typique: https://.../storage/v1/object/public/personal-content/userId/business/images/filename.jpg
          const url = new URL(imageToRemove);
          const pathParts = url.pathname.split('/personal-content/');
          if (pathParts.length > 1) {
            const objectPath = pathParts[1];
            console.log('Chemin de l\'objet à supprimer:', objectPath);
            
            const { error: storageError } = await supabase.storage
              .from("personal-content")
              .remove([objectPath]);
            
            if (storageError) {
              console.warn('Erreur lors de la suppression du fichier dans le storage:', storageError);
              // On continue malgré l'erreur pour ne pas bloquer la suppression côté base
            } else {
              console.log('Fichier supprimé du storage avec succès');
            }
          }
        } catch (parseError) {
          console.warn('Impossible de parser l\'URL pour la suppression du storage:', parseError);
        }
      }

      const newImages = imageList.filter((_, i) => i !== index);

      const { error } = await supabase
        .from("business_content")
        .upsert({
          user_id: user.id,
          company_photos: newImages,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (error) throw error;

      onImagesChange(newImages);
      toast({ title: t("businessImageRemoved") });
    } catch (error) {
      console.error("Remove error:", error);
      toast({ title: t("error"), variant: "destructive" });
    }
  };

  const hasImages = imageList.length > 0;
  const canAddMore = imageList.length < MAX_IMAGES;

  return (
    <Card className="module-card rounded-xl overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          {hasImages ? (
            <div className="relative">
              {imageList.length === 1 ? (
                <div className="relative aspect-video sm:aspect-[21/9] bg-black/10">
                  <img
                    src={imageList[0]}
                    alt={t("businessMainImage")}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      console.error('Erreur de chargement de l\'image:', imageList[0]);
                      const target = e.target as HTMLImageElement;
                      // Ne pas cacher l'image, mais afficher un placeholder
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.error-placeholder')) {
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'error-placeholder absolute inset-0 flex items-center justify-center bg-gold/10 text-gold/60 text-sm';
                        errorDiv.textContent = t("errorLoadingImage") || 'Erreur de chargement';
                        parent.appendChild(errorDiv);
                      }
                    }}
                    onLoad={() => {
                      console.log('Image chargée avec succès:', imageList[0]);
                    }}
                  />
                  {editable && (
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || !canAddMore}
                        className="bg-black/70 hover:bg-black/90 text-white border-0"
                      >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRemove(0)}
                        className="bg-black/70 hover:bg-red-600 text-white border-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <Carousel className="w-full">
                  <CarouselContent>
                    {imageList.map((imageUrl, index) => (
                      <CarouselItem key={index}>
                        <div className="relative aspect-video sm:aspect-[21/9] bg-black/10">
                          <img
                            src={imageUrl}
                            alt={`${t("businessMainImage")} ${index + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              console.error('Erreur de chargement de l\'image:', imageUrl, 'index:', index);
                              const target = e.target as HTMLImageElement;
                              // Ne pas cacher l'image, mais afficher un placeholder
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.error-placeholder')) {
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'error-placeholder absolute inset-0 flex items-center justify-center bg-gold/10 text-gold/60 text-sm';
                                errorDiv.textContent = t("errorLoadingImage") || 'Erreur de chargement';
                                parent.appendChild(errorDiv);
                              }
                            }}
                            onLoad={() => {
                              console.log('Image chargée avec succès:', imageUrl, 'index:', index);
                            }}
                          />
                          {editable && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleRemove(index)}
                              className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white border-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-2 bg-black/70 hover:bg-black/90 text-white border-0" />
                  <CarouselNext className="right-2 bg-black/70 hover:bg-black/90 text-white border-0" />
                  {editable && canAddMore && (
                    <div className="absolute top-2 left-2 z-10">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="bg-black/70 hover:bg-black/90 text-white border-0"
                      >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      </Button>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full z-10">
                    {imageList.length} / {MAX_IMAGES}
                  </div>
                </Carousel>
              )}
            </div>
          ) : (
            <div className="aspect-video sm:aspect-[21/9] bg-gradient-to-br from-gold/10 to-gold/5 flex flex-col items-center justify-center gap-3 p-6">
              <div className="p-4 rounded-full bg-gold/10 border border-gold/20">
                <Building2 className="w-8 h-8 text-gold/50" />
              </div>
              {editable && (
                <>
                  <p className="text-gold/60 text-sm text-center max-w-xs">
                    {t("businessAddMainImage")}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="border-gold/30 text-gold hover:bg-gold/10"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {t("businessUploadImage")}
                  </Button>
                  <p className="text-gold/40 text-xs">
                    {t("businessMaxSize").replace("{size}", MAX_SIZE_MB.toString())} • {t("maxImages") || "Max images"}: {MAX_IMAGES}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </CardContent>
    </Card>
  );
};
