import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface BusinessMainImageProps {
  imageUrl?: string | null;
  editable?: boolean;
  onImageChange: (url: string | null) => void;
}

const MAX_SIZE_MB = 2;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export const BusinessMainImage: React.FC<BusinessMainImageProps> = ({
  imageUrl,
  editable = true,
  onImageChange,
}) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: t("error"),
        description: t("unsupportedFormat"),
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      toast({
        title: t("error"),
        description: t("businessImageTooLarge").replace("{size}", MAX_SIZE_MB.toString()),
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthenticated"));

      const compressedFile = await compressImage(file);
      const fileExt = "jpg";
      const filePath = `${user.id}/business/main-image-${Date.now()}.${fileExt}`;

      // Create proper File object with correct MIME type
      const properFile = new File([compressedFile], `main-image.${fileExt}`, { 
        type: 'image/jpeg', 
        lastModified: Date.now() 
      });

      const { error: uploadError } = await supabase.storage
        .from("personal-content")
        .upload(filePath, properFile, { 
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("personal-content")
        .getPublicUrl(filePath);

      // Save to database
      const { error: dbError } = await supabase
        .from("business_content")
        .upsert({
          user_id: user.id,
          main_image_url: publicUrl,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (dbError) throw dbError;

      onImageChange(publicUrl);
      toast({ title: t("businessImageUploaded") });
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

  const handleRemove = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("business_content")
        .upsert({
          user_id: user.id,
          main_image_url: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (error) throw error;

      onImageChange(null);
      toast({ title: t("businessImageRemoved") });
    } catch (error) {
      console.error("Remove error:", error);
      toast({ title: t("error"), variant: "destructive" });
    }
  };

  return (
    <Card className="module-card rounded-xl overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          {imageUrl ? (
            <div className="relative aspect-video sm:aspect-[21/9]">
              <img
                src={imageUrl}
                alt={t("businessMainImage")}
                className="w-full h-full object-cover"
              />
              {editable && (
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-black/70 hover:bg-black/90 text-white border-0"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRemove}
                    className="bg-black/70 hover:bg-red-600 text-white border-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
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
                    {t("businessMaxSize").replace("{size}", MAX_SIZE_MB.toString())}
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
          className="hidden"
          onChange={handleFileSelect}
        />
      </CardContent>
    </Card>
  );
};
