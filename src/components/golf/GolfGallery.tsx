import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Camera, Plus, Trash2, MapPin, Calendar, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface GolfGalleryPhoto {
  id?: string;
  user_id: string;
  image_url: string | null;
  caption: string | null;
  location: string | null;
  date: string | null;
  display_order: number;
}

interface GolfGalleryProps {
  userId: string;
  photos: GolfGalleryPhoto[];
  isEditable: boolean;
  onUpdate: () => void;
}

const GolfGallery: React.FC<GolfGalleryProps> = ({ userId, photos, isEditable, onUpdate }) => {
  const { t } = useLanguage();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newPhoto, setNewPhoto] = useState({
    caption: '',
    location: '',
    date: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<GolfGalleryPhoto | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const uploadPhoto = async () => {
    if (!selectedFile) {
      toast.error(t('golfGalleryPleaseSelectPhoto'));
      return;
    }

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${userId}/golf/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('personal-content')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('personal-content')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('golf_gallery')
        .insert({
          user_id: userId,
          image_url: publicUrl,
          caption: newPhoto.caption || null,
          location: newPhoto.location || null,
          date: newPhoto.date || null,
          display_order: photos.length,
        });

      if (insertError) throw insertError;

      toast.success(t('golfGalleryPhotoAdded'));
      setIsAddDialogOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setNewPhoto({ caption: '', location: '', date: '' });
      onUpdate();
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error(t('golfGalleryUploadError'));
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photo: GolfGalleryPhoto) => {
    if (!photo.id) return;

    try {
      const { error } = await supabase
        .from('golf_gallery')
        .delete()
        .eq('id', photo.id);

      if (error) throw error;

      toast.success(t('golfGalleryPhotoDeleted'));
      setViewingPhoto(null);
      onUpdate();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error(t('golfGalleryDeleteError'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          {t('golfGalleryTitle')}
        </h3>
        {isEditable && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                {t('add')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('golfGalleryAddMemorableMoment')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <Camera className="h-12 w-12 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      {t('golfGalleryClickToSelectPhoto')}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </label>
                )}

                <Input
                  placeholder={t('golfGalleryCaptionPlaceholder')}
                  value={newPhoto.caption}
                  onChange={(e) => setNewPhoto({ ...newPhoto, caption: e.target.value })}
                />

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder={t('golfCourseLocation')}
                      value={newPhoto.location}
                      onChange={(e) => setNewPhoto({ ...newPhoto, location: e.target.value })}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="date"
                      value={newPhoto.date}
                      onChange={(e) => setNewPhoto({ ...newPhoto, date: e.target.value })}
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={uploadPhoto}
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? t('golfGalleryUploading') : t('golfGalleryAddPhoto')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>{t('golfGalleryNoMoments')}</p>
          {isEditable && (
            <p className="text-sm mt-1">{t('golfGalleryAddMemorablePhotos')}</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group cursor-pointer rounded-lg overflow-hidden aspect-square"
              onClick={() => setViewingPhoto(photo)}
            >
              <img
                src={photo.image_url || ''}
                alt={photo.caption || t('golfGalleryGolfMoment')}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-2 left-2 right-2 text-white text-sm">
                  {photo.caption && (
                    <p className="font-medium truncate">{photo.caption}</p>
                  )}
                  {photo.location && (
                    <p className="text-xs opacity-80 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {photo.location}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo viewer dialog */}
      <Dialog open={!!viewingPhoto} onOpenChange={() => setViewingPhoto(null)}>
        <DialogContent className="max-w-3xl">
          {viewingPhoto && (
            <div className="space-y-4">
              <img
                src={viewingPhoto.image_url || ''}
                alt={viewingPhoto.caption || t('golfGalleryGolfMoment')}
                className="w-full max-h-[60vh] object-contain rounded-lg"
              />
              <div className="flex items-start justify-between">
                <div>
                  {viewingPhoto.caption && (
                    <p className="font-medium text-lg">{viewingPhoto.caption}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    {viewingPhoto.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {viewingPhoto.location}
                      </span>
                    )}
                    {viewingPhoto.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(viewingPhoto.date).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
                {isEditable && (
                    <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(t('golfGalleryDeleteConfirm'))) {
                        deletePhoto(viewingPhoto);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('delete')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GolfGallery;
