import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Maximize2, Upload, X, Image as ImageIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface BusinessModuleProps {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  content?: string;
  isEmpty?: boolean;
  editable?: boolean;
  moduleType: "bio" | "achievements" | "vision" | "timeline" | "press" | "projects";
  onEdit?: (newContent: string) => void;
  onDelete?: () => void;
  aiContext?: any;
  thumbnailUrl?: string;
  onThumbnailChange?: (url: string | null) => void;
  images?: string[];
  onImagesChange?: (urls: string[]) => void;
}

export const BusinessModule: React.FC<BusinessModuleProps> = ({
  icon: Icon,
  title,
  subtitle,
  content,
  isEmpty = false,
  editable = true,
  moduleType,
  onEdit,
  onDelete,
  aiContext,
  thumbnailUrl,
  onThumbnailChange,
  images = [],
  onImagesChange,
}) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [editValue, setEditValue] = useState(content || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  // Sync editValue with content prop changes
  useEffect(() => {
    setEditValue(content || "");
  }, [content]);

  const handleChange = (value: string) => {
    setEditValue(value);
    onEdit?.(value);
  };

  const handleAISuggest = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("business-ai-suggest", {
        body: {
          type: moduleType,
          context: aiContext || {},
        },
      });

      if (error) throw error;
      setEditValue(data.suggestion);
      onEdit?.(data.suggestion);
      toast({
        title: t("suggestionGenerated"),
        description: t("textAppliedAutomatically"),
      });
    } catch (error) {
      console.error("AI suggestion error:", error);
      toast({
        title: t("error"),
        description: t("cannotGenerateSuggestion"),
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation du type de fichier
    if (!file.type.startsWith('image/')) {
      toast({
        title: t("error") || "Erreur",
        description: t("unsupportedFormat") || "Format de fichier non supporté",
        variant: "destructive",
      });
      return;
    }

    // Validation de la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t("error") || "Erreur",
        description: t("fileTooLarge") || "Le fichier est trop volumineux (max 5MB)",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingThumbnail(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthenticated") || "Non authentifié");

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${user.id}/business/${moduleType}-thumbnail-${Date.now()}.${fileExt}`;
      
      // Ensure proper MIME type
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
        'gif': 'image/gif', 'webp': 'image/webp'
      };
      const contentType = mimeTypes[fileExt] || 'image/jpeg';
      const properFile = new File([file], file.name, { type: contentType, lastModified: Date.now() });

      const { error: uploadError } = await supabase.storage
        .from('personal-content')
        .upload(filePath, properFile, { upsert: true, contentType });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('personal-content')
        .getPublicUrl(filePath);

      onThumbnailChange?.(publicUrl);
      toast({
        title: t("imageUploaded") || "Image téléchargée",
        description: t("thumbnailUpdated") || "Vignette mise à jour",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: t("error") || "Erreur",
        description: error.message || t("uploadError") || "Erreur lors du téléchargement",
        variant: "destructive",
      });
    } finally {
      setIsUploadingThumbnail(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveThumbnail = () => {
    onThumbnailChange?.(null);
    toast({
      title: t("thumbnailRemoved") || "Vignette supprimée",
    });
  };

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !onImagesChange) return;

    // Vérifier le nombre d'images
    const currentCount = images.length;
    const remainingSlots = 10 - currentCount;
    
    if (files.length > remainingSlots) {
      const errorMsg = t("maxImagesReached")
        ?.replace("{max}", "10")
        ?.replace("{remaining}", remainingSlots.toString()) || `Maximum 10 images autorisées. Vous pouvez ajouter ${remainingSlots} image(s) supplémentaire(s).`;
      toast({
        title: t("error") || "Erreur",
        description: errorMsg,
        variant: "destructive",
      });
      if (imagesInputRef.current) imagesInputRef.current.value = '';
      return;
    }

    // Validation des fichiers
    const validFiles: File[] = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: t("error") || "Erreur",
          description: t("unsupportedFormat") || "Format de fichier non supporté",
          variant: "destructive",
        });
        continue;
      }

      // Validation de la taille (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: t("error") || "Erreur",
          description: t("imageTooLarge")?.replace("{size}", "2") || "L'image est trop volumineuse (max 2MB)",
          variant: "destructive",
        });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      if (imagesInputRef.current) imagesInputRef.current.value = '';
      return;
    }

    setIsUploadingImages(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthenticated") || "Non authentifié");

      const uploadedUrls: string[] = [];

      for (const file of validFiles) {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const filePath = `${user.id}/business/${moduleType}-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        
        // Ensure proper MIME type
        const mimeTypes: Record<string, string> = {
          'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
          'gif': 'image/gif', 'webp': 'image/webp'
        };
        const contentType = mimeTypes[fileExt] || 'image/jpeg';
        const properFile = new File([file], file.name, { type: contentType, lastModified: Date.now() });

        const { error: uploadError } = await supabase.storage
          .from('personal-content')
          .upload(filePath, properFile, { upsert: true, contentType });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('personal-content')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl + '?t=' + Date.now());
      }

      const newImages = [...images, ...uploadedUrls];
      onImagesChange(newImages);
      
      toast({
        title: t("imagesUploaded") || "Images téléchargées",
        description: `${uploadedUrls.length} image(s) ajoutée(s)`,
      });
    } catch (error: any) {
      console.error("Images upload error:", error);
      toast({
        title: t("error") || "Erreur",
        description: error.message || t("uploadError") || "Erreur lors du téléchargement",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImages(false);
      if (imagesInputRef.current) {
        imagesInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    if (!onImagesChange) return;
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    toast({
      title: t("imageRemoved") || "Image supprimée",
    });
  };

  return (
    <>
      <Card className={`module-card rounded-xl ${isEmpty && !editValue ? "border-dashed border-gold/10" : ""}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {thumbnailUrl ? (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gold/20 flex-shrink-0">
                <img 
                  src={thumbnailUrl} 
                  alt={title}
                  className="w-full h-full object-cover"
                />
                {editable && onThumbnailChange && (
                  <button
                    onClick={handleRemoveThumbnail}
                    className="absolute top-0 right-0 p-1 bg-black/80 text-white hover:bg-black rounded-bl-lg"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex-shrink-0">
                <Icon className="w-5 h-5 text-gold" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-serif text-gold truncate">{title}</CardTitle>
              {subtitle && <p className="text-sm text-gold/60 truncate">{subtitle}</p>}
            </div>
          </div>

          {editable && (
            <div className="flex gap-2 flex-shrink-0">
              {onThumbnailChange && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleThumbnailUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingThumbnail}
                    className="border-gold/30 text-gold hover:bg-gold/10"
                    title={t("uploadThumbnail") || "Ajouter une vignette"}
                  >
                    {isUploadingThumbnail ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(true)}
                className="border-gold/30 text-gold hover:bg-gold/10"
                title={t("fullscreen") || "Plein écran"}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAISuggest}
                disabled={isGenerating}
                className="border-gold/30 text-gold hover:bg-gold/10"
                title={t("aiAurora")}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 sm:mr-2" />
                )}
                {/* <span className="hidden sm:inline">{t("aiAurora")}</span> */}
                <span className="hidden sm:inline">{t("ai")} </span>
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {editable ? (
            <Textarea
              value={editValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={t("describeYourContent")}
              className="min-h-[120px] bg-black/80 text-white border-gold/20 placeholder:text-white/50 text-sm resize-none focus:ring-1 focus:ring-gold/30"
            />
          ) : (
            <p className="text-gold/70 whitespace-pre-line">{content}</p>
          )}

          {/* Section Images */}
          {editable && onImagesChange && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gold/80">
                  {t("images") || "Images"} ({images.length}/10)
                </Label>
                {images.length < 10 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => imagesInputRef.current?.click()}
                    disabled={isUploadingImages}
                    className="border-gold/30 text-gold hover:bg-gold/10 h-8 text-xs"
                  >
                    {isUploadingImages ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Upload className="w-3 h-3 mr-1" />
                    )}
                    {t("addImages") || "Ajouter"}
                  </Button>
                )}
              </div>
              
              <input
                ref={imagesInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImagesUpload}
                disabled={isUploadingImages || images.length >= 10}
              />

              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {images.map((url, index) => (
                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gold/20">
                      <img
                        src={url}
                        alt={`${title} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 p-1 bg-black/80 text-white hover:bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title={t("remove") || "Supprimer"}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {images.length === 0 && (
                <div
                  onClick={() => imagesInputRef.current?.click()}
                  className="border-2 border-dashed border-gold/30 rounded-lg p-6 text-center cursor-pointer hover:border-gold/50 transition-colors"
                >
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gold/40" />
                  <p className="text-sm text-muted-foreground">
                    {t("clickToUploadImages") || "Cliquez pour ajouter des images (max 10, 2MB chacune)"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Affichage des images en mode lecture */}
          {!editable && images.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gold/80">
                {t("images") || "Images"}
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {images.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gold/20">
                    <img
                      src={url}
                      alt={`${title} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog plein écran */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full flex flex-col p-0 bg-background border-gold/20">
          <DialogHeader className="px-6 py-4 border-b border-gold/10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-serif text-gold flex items-center gap-3">
                {thumbnailUrl && (
                  <img 
                    src={thumbnailUrl} 
                    alt={title}
                    className="w-10 h-10 rounded-lg object-cover border border-gold/20"
                  />
                )}
                {!thumbnailUrl && (
                  <div className="p-2 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20">
                    <Icon className="w-5 h-5 text-gold" />
                  </div>
                )}
                <div>
                  <div>{title}</div>
                  {subtitle && <p className="text-sm text-gold/60 font-normal">{subtitle}</p>}
                </div>
              </DialogTitle>
              <div className="flex gap-2">
                {editable && onThumbnailChange && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleThumbnailUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingThumbnail}
                      className="border-gold/30 text-gold hover:bg-gold/10"
                    >
                      {isUploadingThumbnail ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ImageIcon className="w-4 h-4 mr-2" />
                      )}
                      {t("uploadThumbnail") || "Vignette"}
                    </Button>
                  </>
                )}
                {editable && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAISuggest}
                    disabled={isGenerating}
                    className="border-gold/30 text-gold hover:bg-gold/10"
                    title={t("aiAurora")}
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 sm:mr-2" />
                    )}
                    <span className="hidden sm:inline">{t("aiAurora")}</span>
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-6 space-y-6">
            {editable ? (
              <>
                <Textarea
                  value={editValue}
                  onChange={(e) => handleChange(e.target.value)}
                  placeholder={t("describeYourContent")}
                  className="w-full min-h-[40vh] bg-black/80 text-white border-gold/20 placeholder:text-white/50 text-sm resize-none focus:ring-1 focus:ring-gold/30"
                />

                {/* Section Images dans le Dialog */}
                {onImagesChange && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gold/80">
                        {t("images") || "Images"} ({images.length}/10)
                      </Label>
                      {images.length < 10 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => imagesInputRef.current?.click()}
                          disabled={isUploadingImages}
                          className="border-gold/30 text-gold hover:bg-gold/10 h-8 text-xs"
                        >
                          {isUploadingImages ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Upload className="w-3 h-3 mr-1" />
                          )}
                          {t("addImages") || "Ajouter"}
                        </Button>
                      )}
                    </div>

                    {images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {images.map((url, index) => (
                          <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gold/20">
                            <img
                              src={url}
                              alt={`${title} - Image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 p-1 bg-black/80 text-white hover:bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              title={t("remove") || "Supprimer"}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {images.length === 0 && (
                      <div
                        onClick={() => imagesInputRef.current?.click()}
                        className="border-2 border-dashed border-gold/30 rounded-lg p-8 text-center cursor-pointer hover:border-gold/50 transition-colors"
                      >
                        <ImageIcon className="w-10 h-10 mx-auto mb-2 text-gold/40" />
                        <p className="text-sm text-muted-foreground">
                          {t("clickToUploadImages") || "Cliquez pour ajouter des images (max 10, 2MB chacune)"}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-gold/70 whitespace-pre-line text-base leading-relaxed">{content}</p>
                
                {/* Affichage des images en mode lecture */}
                {images.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gold/80">
                      {t("images") || "Images"}
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {images.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gold/20">
                          <img
                            src={url}
                            alt={`${title} - Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
