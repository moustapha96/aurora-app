import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Camera, Plus, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PoloGalleryItem } from './PoloProfileModule';

interface PoloGalleryProps {
  userId: string;
  gallery: PoloGalleryItem[];
  isEditable: boolean;
  onUpdate: () => void;
}

type SlotType = 'action' | 'horse_portrait' | 'complicity' | 'team' | 'trophy' | 'ambiance' | 'additional';

interface GallerySlot {
  type: SlotType;
}

const GALLERY_SLOTS: GallerySlot[] = [
  { type: 'action' },
  { type: 'horse_portrait' },
  { type: 'complicity' },
  { type: 'team' },
  { type: 'trophy' },
  { type: 'ambiance' },
];

const PoloGallery: React.FC<PoloGalleryProps> = ({ userId, gallery, isEditable, onUpdate }) => {
  const { t } = useLanguage();
  const [uploading, setUploading] = useState<string | null>(null);

  const getSlotTitle = (type: SlotType) => t(`poloGallerySlot_${type}_title`);
  const getSlotDescription = (type: SlotType) => t(`poloGallerySlot_${type}_description`);

  const getImageForSlot = (slotType: SlotType): PoloGalleryItem | undefined => {
    return gallery.find(g => g.slot_type === slotType);
  };

  const handleUpload = async (slotType: SlotType, file: File) => {
    setUploading(slotType);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}/polo/${slotType}-${Date.now()}.${fileExt}`;
      
      // Get correct MIME type
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp'
      };
      const contentType = mimeTypes[fileExt] || 'image/jpeg';
      
      // Create proper File object with correct MIME type
      const properFile = new File([file], file.name, { 
        type: contentType, 
        lastModified: Date.now() 
      });
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, properFile, { contentType });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Check if slot already exists
      const existingItem = getImageForSlot(slotType);
      
      if (existingItem?.id) {
        const { error } = await supabase
          .from('polo_gallery')
          .update({ image_url: publicUrl })
          .eq('id', existingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('polo_gallery')
          .insert({
            user_id: userId,
            slot_type: slotType,
            image_url: publicUrl,
            display_order: GALLERY_SLOTS.findIndex(s => s.type === slotType),
          });
        if (error) throw error;
      }

      toast.success(t('poloGalleryPhotoAdded'));
      onUpdate();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t('poloGalleryUploadError'));
    } finally {
      setUploading(null);
    }
  };

  const handleRemoveImage = async (slotType: SlotType) => {
    const item = getImageForSlot(slotType);
    if (!item?.id) return;

    try {
      const { error } = await supabase
        .from('polo_gallery')
        .update({ image_url: null })
        .eq('id', item.id);
      if (error) throw error;
      toast.success('Photo supprimée');
      onUpdate();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleAddAdditional = async (file: File) => {
    setUploading('additional');
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}/polo/additional-${Date.now()}.${fileExt}`;
      
      // Get correct MIME type
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp'
      };
      const contentType = mimeTypes[fileExt] || 'image/jpeg';
      
      // Create proper File object with correct MIME type
      const properFile = new File([file], file.name, { 
        type: contentType, 
        lastModified: Date.now() 
      });
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, properFile, { contentType });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error } = await supabase
        .from('polo_gallery')
        .insert({
          user_id: userId,
          slot_type: 'additional',
          image_url: publicUrl,
          display_order: gallery.length,
        });
      if (error) throw error;

      toast.success(t('poloGalleryPhotoAdded'));
      onUpdate();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t('poloGalleryUploadError'));
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteAdditional = async (id: string) => {
    if (!confirm(t('poloGalleryDeleteConfirm'))) return;
    try {
      const { error } = await supabase.from('polo_gallery').delete().eq('id', id);
      if (error) throw error;
      toast.success(t('poloGalleryPhotoDeleted'));
      onUpdate();
    } catch (error) {
      toast.error(t('poloGalleryDeleteError'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Camera className="h-5 w-5 text-primary" />
          📸 {t('poloGalleryTitle')}
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {GALLERY_SLOTS.map((slot) => {
          const item = getImageForSlot(slot.type);
          const isUploading = uploading === slot.type;

          return (
            <div
              key={slot.type}
              className="relative group aspect-[4/3] rounded-lg overflow-hidden border-2 border-dashed border-primary/30 bg-muted/20 hover:border-primary/50 transition-colors"
            >
              {item?.image_url ? (
                <>
                  <img
                    src={item.image_url}
                    alt={getSlotTitle(slot.type)}
                    className="w-full h-full object-cover"
                  />
                  {isEditable && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(slot.type, file);
                          }}
                        />
                        <Button size="sm" variant="secondary" asChild>
                          <span><Upload className="h-4 w-4 mr-1" /> {t('poloGalleryReplace')}</span>
                        </Button>
                      </label>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveImage(slot.type)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8 text-primary/50 mb-2" />
                      <p className="text-xs font-medium text-foreground">{getSlotTitle(slot.type)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{getSlotDescription(slot.type)}</p>
                      {isEditable && (
                        <label className="cursor-pointer mt-2">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUpload(slot.type, file);
                            }}
                          />
                          <Button size="sm" variant="outline" className="text-primary border-primary/30" asChild>
                            <span><Upload className="h-3 w-3 mr-1" /> {t('add')}</span>
                          </Button>
                        </label>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Additional photos */}
      {(gallery.filter(g => g.slot_type === 'additional').length > 0 || isEditable) && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">{t('poloGalleryAdditionalPhotos')}</h4>
            {isEditable && (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAddAdditional(file);
                  }}
                />
                <Button size="sm" variant="outline" className="text-primary border-primary/30" asChild>
                  <span>
                    {uploading === 'additional' ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-1" />
                    )}
                    {t('add')}
                  </span>
                </Button>
              </label>
            )}
          </div>
          
          {gallery.filter(g => g.slot_type === 'additional').length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {gallery
                .filter(g => g.slot_type === 'additional')
                .map((photo) => (
                  <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden">
                    <img
                      src={photo.image_url || ''}
                      alt={t('poloGalleryAdditionalPhoto')}
                      className="w-full h-full object-cover"
                    />
                    {isEditable && (
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteAdditional(photo.id!)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PoloGallery;