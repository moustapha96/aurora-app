import { useState } from "react";
import { NetworkModule } from "./NetworkModule";
import { ImageIcon, Trash2, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { InlineEditableField } from "@/components/ui/inline-editable-field";

function getPortfolioImageSrc(url: string | undefined | null): string | null {
  if (url == null || typeof url !== "string") return null;
  const s = String(url).trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("data:")) return s.replace(/\r?\n/g, "");
  if (s.startsWith("/") || s.startsWith("./") || s.startsWith("../")) return s;
  return `/${s.replace(/^\/*/, "")}`;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Impossible de lire l'image"));
    reader.readAsDataURL(blob);
  });
}

function PortfolioGridImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = getPortfolioImageSrc(src);
  if (failed || !resolvedSrc) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
        <ImageIcon className="w-10 h-10 text-muted-foreground" />
      </div>
    );
  }
  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className="w-full h-full object-cover transition-transform group-hover:scale-105"
      loading="lazy"
      decoding="async"
      crossOrigin={resolvedSrc.startsWith("http") ? "anonymous" : undefined}
      referrerPolicy={resolvedSrc.startsWith("http") ? "no-referrer" : undefined}
      onError={() => setFailed(true)}
    />
  );
}

function PortfolioViewerImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = getPortfolioImageSrc(src);
  if (failed || !resolvedSrc) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-white/50">
        <ImageIcon className="w-16 h-16" />
      </div>
    );
  }
  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className="w-full h-auto max-h-[80vh] object-contain select-none"
      draggable={false}
      crossOrigin={resolvedSrc.startsWith("http") ? "anonymous" : undefined}
      referrerPolicy={resolvedSrc.startsWith("http") ? "no-referrer" : undefined}
      onError={() => setFailed(true)}
    />
  );
}

interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  display_order?: number;
}

interface NetworkPortfolioProps {
  data: PortfolioItem[];
  isEditable: boolean;
  onUpdate: () => void;
}

export const NetworkPortfolio = ({ data, isEditable, onUpdate }: NetworkPortfolioProps) => {
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [descriptionPopup, setDescriptionPopup] = useState<{ title: string; content: string } | null>(null);

  const DESCRIPTION_TRUNCATE_LENGTH = 30;

  const selectedImage = selectedImageIndex !== null ? data[selectedImageIndex]?.image_url : null;
  const selectedItem = selectedImageIndex !== null ? data[selectedImageIndex] : null;

  const updateField = async (itemId: string, field: "title" | "description", value: string | null) => {
    try {
      const { error } = await supabase
        .from("network_clubs")
        .update({ [field]: value ?? null })
        .eq("id", itemId);
      if (error) throw error;
      onUpdate();
    } catch {
      toast.error(t("error") || "Erreur");
    }
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === null) return;
    const newIndex = direction === 'prev' ? selectedImageIndex - 1 : selectedImageIndex + 1;
    if (newIndex >= 0 && newIndex < data.length) {
      setSelectedImageIndex(newIndex);
    }
  };

  const handleDeleteFromViewer = async () => {
    if (!selectedItem) return;
    await handleDelete(selectedItem.id);
    setSelectedImageIndex(null);
  };

  // Compress image before upload
  const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.7): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down if larger than maxWidth
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Could not compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("businessImageFormatNotAllowed") || "Format non supporté");
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthenticated") || "Non authentifié");

      const compressedBlob = await compressImage(file);
      const dataUrl = await blobToDataUrl(compressedBlob);

      const { error } = await supabase
        .from('network_clubs')
        .insert({
          user_id: user.id,
          title: (addTitle || "").trim() || t("portfolioPhoto") || "Photo Portfolio",
          description: (addDescription || "").trim() || null,
          image_url: dataUrl,
          club_type: "portfolio"
        });

      if (error) throw error;

      toast.success(t("photoAddedToPortfolio") || "Photo ajoutée au portfolio");
      setIsDialogOpen(false);
      setAddTitle("");
      setAddDescription("");
      onUpdate();
    } catch (error) {
      console.error('Add portfolio image error:', error);
      toast.error(t("uploadError") || "Erreur lors de l'ajout");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('network_clubs').delete().eq('id', id);
      if (error) throw error;
      toast.success("Photo supprimée");
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleMove = async (index: number, direction: 'left' | 'right') => {
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= data.length) return;

    const item1 = data[index];
    const item2 = data[newIndex];

    try {
      const order1 = item1.display_order ?? index;
      const order2 = item2.display_order ?? newIndex;

      await Promise.all([
        supabase.from('network_clubs').update({ display_order: order2 }).eq('id', item1.id),
        supabase.from('network_clubs').update({ display_order: order1 }).eq('id', item2.id)
      ]);

      onUpdate();
    } catch (error) {
      toast.error("Erreur lors du déplacement");
    }
  };

  return (
    <NetworkModule title={t('portfolioLifestyle')} icon={ImageIcon} moduleType="portfolio" isEditable={isEditable}>
      <div className="space-y-4">
        {/* Clickable text to add photos - always visible when editable */}
        {isEditable && (
          <button 
            type="button"
            className="text-muted-foreground text-sm cursor-pointer hover:text-gold transition-colors bg-transparent border-none w-full text-left"
            onClick={() => setIsDialogOpen(true)}
          >
            {t('addPhotosLifestyle')}
          </button>
        )}

        {/* Photo Gallery Grid */}
        {data.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.map((item, index) => (
              <div 
                key={item.id} 
                className="relative group aspect-square rounded-lg overflow-hidden cursor-pointer bg-muted/30"
                onClick={() => setSelectedImageIndex(index)}
              >
                {item.image_url && getPortfolioImageSrc(item.image_url) ? (
                  <PortfolioGridImage src={item.image_url} alt={item.title} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
                {/* Overlay - always visible in edit mode, hover only otherwise */}
                <div className={`absolute inset-0 bg-black/40 transition-opacity flex flex-col justify-between p-2 ${
                  isEditable ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  {/* Move buttons at top */}
                  {isEditable && (
                    <div className="flex justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-white hover:bg-white/20 disabled:opacity-30"
                        disabled={index === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(index, 'left');
                        }}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-white hover:bg-white/20 disabled:opacity-30"
                        disabled={index === data.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(index, 'right');
                        }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Title, description and delete at bottom */}
                  <div className="flex flex-col gap-0.5 min-w-0" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-start gap-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        {isEditable ? (
                          <InlineEditableField
                            value={item.title || ""}
                            onSave={(v) => updateField(item.id, "title", v)}
                            placeholder={t("title") || "Titre"}
                            className="text-white text-xs font-medium bg-transparent border-none p-0 min-h-0 placeholder:text-white/60"
                          />
                        ) : (
                          item.title && <p className="text-white text-xs font-medium truncate">{item.title}</p>
                        )}
                        {(item.description || isEditable) && (
                          <div className="mt-0.5">
                            {isEditable ? (
                              <InlineEditableField
                                value={item.description || ""}
                                onSave={(v) => updateField(item.id, "description", v)}
                                placeholder={t("description") || "Description"}
                                className="text-white/90 text-[10px] sm:text-xs bg-transparent border-none p-0 min-h-0 line-clamp-2 placeholder:text-white/50"
                                multiline
                              />
                            ) : item.description ? (
                              <>
                                <p className="text-white/90 text-[10px] sm:text-xs break-words">
                                  {item.description.length > DESCRIPTION_TRUNCATE_LENGTH
                                    ? `${item.description.slice(0, DESCRIPTION_TRUNCATE_LENGTH)}…`
                                    : item.description}
                                </p>
                                {item.description.length > DESCRIPTION_TRUNCATE_LENGTH && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDescriptionPopup({ title: item.title || t("description"), content: item.description! });
                                    }}
                                    className="text-white/90 text-[10px] sm:text-xs underline mt-0.5 focus:outline-none"
                                  >
                                    {t("seeMore") || "Voir plus"}
                                  </button>
                                )}
                              </>
                            ) : null}
                          </div>
                        )}
                      </div>
                      {isEditable && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 flex-shrink-0 text-white hover:text-destructive hover:bg-white/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state icon only when no photos */}
        {data.length === 0 && !isEditable && (
          <div className="text-center py-6">
            <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Add Photo Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setAddTitle(""); setAddDescription(""); } }}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-base sm:text-lg">{t("addPhoto") || "Ajouter une photo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">{t("title") || "Titre"}</Label>
              <Input
                className="mt-1 text-sm"
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
                placeholder={t("portfolioPhoto") || "Photo portfolio"}
              />
            </div>
            <div>
              <Label className="text-sm">{t("description") || "Description"}</Label>
              <Textarea
                className="mt-1 text-sm min-h-[72px] resize-none"
                value={addDescription}
                onChange={(e) => setAddDescription(e.target.value)}
                placeholder={t("optionalDescription") || "Optionnel"}
              />
            </div>
            <div>
              <Label className="text-sm">{t("image") || "Image"}</Label>
              <label className="mt-1 flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:bg-muted/50 hover:border-gold transition-colors">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                {isUploading ? (
                  <>
                    <Loader2 className="w-10 h-10 animate-spin text-gold mb-2" />
                    <span className="text-xs text-muted-foreground">{t("uploading") || "Envoi..."}</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground font-medium">{t("chooseImage") || "Choisir une image"}</span>
                  </>
                )}
              </label>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Image Viewer with Navigation */}
      <Dialog open={selectedImageIndex !== null} onOpenChange={() => setSelectedImageIndex(null)}>
        <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden bg-black/95 group flex flex-col">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
            onClick={() => setSelectedImageIndex(null)}
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Delete button - visible on hover */}
          {isEditable && selectedItem && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 left-2 z-10 text-white hover:text-destructive hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleDeleteFromViewer}
            >
              <Trash2 className="w-6 h-6" />
            </Button>
          )}

          {/* Previous button */}
          {selectedImageIndex !== null && selectedImageIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => navigateImage('prev')}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
          )}

          {/* Next button */}
          {selectedImageIndex !== null && selectedImageIndex < data.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => navigateImage('next')}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          )}

          {/* Image with swipe support - scrollable if needed */}
          {selectedImage && (
            <div 
              className="flex-1 min-h-0 overflow-auto flex items-start justify-center touch-pan-x"
              onTouchStart={(e) => {
                const touch = e.touches[0];
                (e.currentTarget as any).startX = touch.clientX;
              }}
              onTouchEnd={(e) => {
                const startX = (e.currentTarget as any).startX;
                const endX = e.changedTouches[0].clientX;
                const diff = startX - endX;
                if (Math.abs(diff) > 50) {
                  navigateImage(diff > 0 ? 'next' : 'prev');
                }
              }}
            >
              <PortfolioViewerImage src={selectedImage} alt={selectedItem?.title || "Fullscreen view"} />
            </div>
          )}

          {/* Title and description always visible below the image */}
          {selectedItem && (
            <div className={`flex-shrink-0 px-4 py-3 border-t border-white/10 bg-black/60 ${data.length > 1 ? "pb-10" : ""}`}>
              {isEditable ? (
                <div className="space-y-2">
                  <InlineEditableField
                    value={selectedItem.title || ""}
                    onSave={(v) => updateField(selectedItem.id, "title", v)}
                    placeholder={t("title") || "Titre"}
                    className="text-white font-medium text-sm sm:text-base bg-transparent border-none p-0 min-h-0 placeholder:text-white/50"
                  />
                  <InlineEditableField
                    value={selectedItem.description || ""}
                    onSave={(v) => updateField(selectedItem.id, "description", v)}
                    placeholder={t("description") || "Description"}
                    className="text-white/80 text-xs sm:text-sm bg-transparent border-none p-0 min-h-0 whitespace-pre-wrap placeholder:text-white/40 block"
                    multiline
                  />
                </div>
              ) : (
                <>
                  {selectedItem.title && <p className="text-white font-medium text-sm sm:text-base">{selectedItem.title}</p>}
                  {selectedItem.description && (
                    <p className="text-white/90 text-xs sm:text-sm mt-1 sm:mt-2 whitespace-pre-wrap break-words leading-relaxed">
                      {selectedItem.description}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Image counter */}
          {data.length > 1 && selectedImageIndex !== null && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm pointer-events-none">
              {selectedImageIndex + 1} / {data.length}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Popup description complète (si > 30 caractères) */}
      <Dialog open={!!descriptionPopup} onOpenChange={(open) => !open && setDescriptionPopup(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-serif text-gold">
              {descriptionPopup?.title}
            </DialogTitle>
          </DialogHeader>
          {descriptionPopup && (
            <p className="text-sm text-foreground whitespace-pre-wrap break-words py-2">
              {descriptionPopup.content}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </NetworkModule>
  );
};
