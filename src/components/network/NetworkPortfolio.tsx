import { useState } from "react";
import { NetworkModule } from "./NetworkModule";
import { ImageIcon, Trash2, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const selectedImage = selectedImageIndex !== null ? data[selectedImageIndex]?.image_url : null;
  const selectedItem = selectedImageIndex !== null ? data[selectedImageIndex] : null;

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Compress image before upload
      const compressedBlob = await compressImage(file);
      const fileName = `${user.id}/portfolio/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('personal-content')
        .upload(fileName, compressedBlob, {
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('personal-content')
        .getPublicUrl(fileName);

      // Auto-save after successful upload
      
      // Auto-save after successful upload
      const { error } = await supabase
        .from('network_clubs')
        .insert({
          user_id: user.id,
          title: "Photo Portfolio",
          image_url: urlData.publicUrl,
          club_type: "portfolio"
        });

      if (error) throw error;
      
      toast.success("Photo ajoutée au portfolio");
      setIsDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
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
    <NetworkModule title="Portfolio Lifestyle" icon={ImageIcon} moduleType="portfolio" isEditable={isEditable}>
      <div className="space-y-4">
        {/* Clickable text to add photos - always visible when editable */}
        {isEditable && (
          <button 
            type="button"
            className="text-muted-foreground text-sm cursor-pointer hover:text-gold transition-colors bg-transparent border-none w-full text-left"
            onClick={() => setIsDialogOpen(true)}
          >
            Ajoutez des photos pour illustrer votre style de vie
          </button>
        )}

        {/* Photo Gallery Grid */}
        {data.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.map((item, index) => (
              <div 
                key={item.id} 
                className="relative group aspect-square rounded-lg overflow-hidden cursor-pointer"
                onClick={() => setSelectedImageIndex(index)}
              >
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
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
                  
                  {/* Title and delete at bottom */}
                  <div className="flex items-end">
                    <div className="flex-1">
                      {item.title && (
                        <p className="text-white text-xs font-medium truncate">{item.title}</p>
                      )}
                    </div>
                    {isEditable && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white hover:text-destructive hover:bg-white/20"
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Ajouter une photo</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6">
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:bg-muted/50 hover:border-gold transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {isUploading ? (
                <>
                  <Loader2 className="w-12 h-12 animate-spin text-gold mb-3" />
                  <span className="text-sm text-muted-foreground">Compression et upload...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-12 h-12 text-muted-foreground mb-3" />
                  <span className="text-base text-muted-foreground font-medium">Cliquez pour sélectionner</span>
                  <span className="text-xs text-muted-foreground/70 mt-1">La photo sera ajoutée automatiquement</span>
                </>
              )}
            </label>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Image Viewer with Navigation */}
      <Dialog open={selectedImageIndex !== null} onOpenChange={() => setSelectedImageIndex(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 group">
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

          {/* Image with swipe support */}
          {selectedImage && (
            <div 
              className="relative touch-pan-x"
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
              <img
                src={selectedImage}
                alt="Fullscreen view"
                className="w-full h-auto max-h-[80vh] object-contain select-none"
                draggable={false}
              />
            </div>
          )}

          {/* Image counter */}
          {data.length > 1 && selectedImageIndex !== null && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {selectedImageIndex + 1} / {data.length}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </NetworkModule>
  );
};
