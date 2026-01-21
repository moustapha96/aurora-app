import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
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
  const [metric, setMetric] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (influence) {
      setPlatform(influence.platform || "");
      setMetric(influence.metric || "");
      setValue(influence.value || "");
      setDescription(influence.description || "");
      setImageUrl(influence.image_url || "");
    } else {
      setPlatform("");
      setMetric("");
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
        metric,
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="platform">{t('platformEvent')}</Label>
        <Input
          id="platform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          placeholder={t('platformEventPlaceholder')}
          required
        />
      </div>

      <div>
        <Label htmlFor="metric">{t('metric')}</Label>
        <Input
          id="metric"
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          placeholder={t('metricPlaceholder')}
          required
        />
      </div>

      <div>
        <Label htmlFor="value">{t('value')}</Label>
        <Input
          id="value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t('valuePlaceholder')}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">{t('description')}</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('describeYourImpact')}
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="image">{t('image')}</Label>
        <div className="flex gap-2">
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
          />
          {uploading && <span className="text-sm text-muted-foreground">{t('uploading')}</span>}
        </div>
        {imageUrl && (
          <img src={imageUrl} alt={t('preview')} className="mt-2 h-32 w-full object-cover rounded" />
        )}
      </div>

      <Button type="submit" className="w-full">
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
