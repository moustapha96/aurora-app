import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Retourne un src utilisable pour <img> : URL (http/https), data URL (base64), ou chemin.
function getGalleryImageSrc(url: string | undefined | null): string | null {
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

// Affiche l'image (URL, data ou chemin) ou un placeholder en cas d'erreur.
function GalleryImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = getGalleryImageSrc(src);
  if (failed || !resolvedSrc) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gold/10 text-gold/60 text-sm">
        <Building2 className="w-8 h-8 opacity-50" />
        {failed && <span>Erreur de chargement</span>}
      </div>
    );
  }
  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className="w-full h-full object-cover object-center"
      loading="lazy"
      decoding="async"
      crossOrigin={isExternalUrl(resolvedSrc) ? "anonymous" : undefined}
      referrerPolicy={isExternalUrl(resolvedSrc) ? "no-referrer" : undefined}
      onError={() => setFailed(true)}
    />
  );
}

// Convertit un File en data URL base64 (pour enregistrement en base, pas d'upload).
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Impossible de lire l'image"));
    reader.readAsDataURL(file);
  });
}

interface BusinessImageGalleryProps {
  images?: string[] | null;
  editable?: boolean;
  onImagesChange: (images: string[]) => void | Promise<void>;
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
      const dataUrls: string[] = [];
      for (const file of validFiles) {
        const compressedFile = await compressImage(file);
        const dataUrl = await fileToDataUrl(compressedFile);
        dataUrls.push(dataUrl);
      }

      const newImages = [...imageList, ...dataUrls];
      await Promise.resolve(onImagesChange(newImages));
      toast({
        title: t("businessImagesUploaded") || t("businessImageUploaded"),
        description: `${dataUrls.length} ${dataUrls.length === 1 ? (t("image") || "image") : (t("images") || "images")} ${t("added") || "ajoutée(s)"}`,
      });
    } catch (error: any) {
      console.error("Image add error:", error);
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

  // Supprime une image de la galerie ; la persistance est gérée par le parent via onImagesChange.
  const handleRemove = async (index: number) => {
    const newImages = imageList.filter((_, i) => i !== index);
    try {
      await Promise.resolve(onImagesChange(newImages));
      toast({ title: t("businessImageRemoved") });
    } catch {
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
                <div className="relative aspect-video sm:aspect-[21/9] bg-black/10 overflow-hidden">
                  <GalleryImage src={imageList[0]} alt={t("businessMainImage")} />
                  {editable && (
                    <div className="absolute top-2 right-2 flex gap-2 z-10">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || !canAddMore}
                        className="bg-black/70 hover:bg-black/90 text-white border-0 h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                        aria-label={t("businessUploadImage")}
                      >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRemove(0)}
                        className="bg-black/70 hover:bg-red-600 text-white border-0 h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                        aria-label={t("remove") || "Supprimer"}
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
                        <div className="relative aspect-video sm:aspect-[21/9] bg-black/10 overflow-hidden">
                          <GalleryImage src={imageUrl} alt={`${t("businessMainImage")} ${index + 1}`} />
                          {editable && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleRemove(index)}
                              className="absolute top-2 right-2 z-10 bg-black/70 hover:bg-red-600 text-white border-0 h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                              aria-label={t("remove") || "Supprimer"}
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
