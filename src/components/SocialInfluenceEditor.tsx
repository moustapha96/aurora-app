import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface SocialInfluenceEditorProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  influence?: any;
  onSave: () => void;
}

export function SocialInfluenceEditor({ open, onOpenChange, influence, onSave }: SocialInfluenceEditorProps) {
  const { t } = useLanguage();
  const [platform, setPlatform] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (influence) {
      setPlatform(influence.platform || "");
      setValue(influence.value || "");
      setDescription(influence.description || "");
      setImageUrl(influence.image_url || "");
    } else {
      setPlatform("");
      setValue("");
      setDescription("");
      setImageUrl("");
    }
  }, [influence, open]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('notAuthenticated'));

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
      
      // Get correct MIME type
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
      };
      const contentType = mimeTypes[fileExt] || 'image/jpeg';
      
      // Create proper File object with correct MIME type
      const properFile = new File([file], file.name, { 
        type: contentType, 
        lastModified: Date.now() 
      });

      const { error: uploadError } = await supabase.storage
        .from('personal-content')
        .upload(filePath, properFile, { contentType });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('personal-content')
        .getPublicUrl(filePath);

      setImageUrl(data.publicUrl);
      toast({ title: t('imageUploaded') });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: t('uploadError'), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: t('pleaseConnect'), variant: "destructive" });
        return;
      }

      const influenceData = {
        user_id: user.id,
        platform,
        value,
        description,
        image_url: imageUrl,
      };

      if (influence?.id) {
        const { error } = await supabase
          .from('social_influence')
          .update(influenceData)
          .eq('id', influence.id);

        if (error) throw error;
        toast({ title: t('influenceUpdated') });
      } else {
        const { error } = await supabase
          .from('social_influence')
          .insert([influenceData]);

        if (error) throw error;
        toast({ title: t('influenceAdded') });
      }

      onSave();
      if (onOpenChange) onOpenChange(false);
    } catch (error) {
      console.error('Error saving influence:', error);
      toast({ title: t('saveError'), variant: "destructive" });
    }
  };

  const content = (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      {/* Plateforme & valeur */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="platform" className="text-xs sm:text-sm font-medium">
            {t('platformEvent')}
          </Label>
          <Input
            id="platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            placeholder={t('platformEventPlaceholder')}
            required
            className="bg-background/40 border-gold/20 focus:border-gold/50 text-sm h-9 sm:h-10"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="value" className="text-xs sm:text-sm font-medium">
            {t('value')}
          </Label>
          <Input
            id="value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t('valuePlaceholder')}
            required
            className="bg-background/40 border-gold/20 focus:border-gold/50 text-sm h-9 sm:h-10"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-xs sm:text-sm font-medium">
          {t('description')}
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('describeYourImpact')}
          rows={4}
          className="bg-background/40 border-gold/20 focus:border-gold/50 text-sm min-h-[90px] sm:min-h-[110px] resize-none"
        />
      </div>

      {/* Image */}
      <div className="space-y-1.5">
        <Label htmlFor="image" className="text-xs sm:text-sm font-medium">
          {t('image')}
        </Label>
        <div className="flex gap-2 items-center">
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="flex-1 bg-background/40 border-gold/20 text-xs sm:text-sm h-9 sm:h-10"
          />
          {uploading && (
            <span className="text-xs sm:text-sm text-muted-foreground">
              {t('uploading')}
            </span>
          )}
        </div>
        {imageUrl && (
          <img
            src={imageUrl}
            alt={t('preview')}
            className="mt-2 h-32 w-full object-cover rounded"
          />
        )}
      </div>

      <Button type="submit" className="w-full text-sm sm:text-base">
        {influence ? t('edit') : t('add')}
      </Button>
    </form>
  );

  if (open !== undefined && onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border border-gold/30 p-4 sm:p-6" data-scroll>
          <DialogHeader>
            <DialogTitle>
              {influence ? t('editInfluence') : t('addInfluence')}
            </DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border border-gold/30 p-4 sm:p-6" data-scroll>
        <DialogHeader>
          <DialogTitle>{t('addInfluence')}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
