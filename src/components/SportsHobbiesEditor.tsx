import React from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, Info } from "lucide-react";

interface SportsHobbiesEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hobby?: any;
  sportType?: string;
  onSave: () => void;
}

const SPORT_TYPE_LABELS: Record<string, string> = {
  yachting: 'Yachting',
  polo: 'Polo',
  chasse: 'Chasse à Courre'
};

export const SportsHobbiesEditor = ({ 
  open, 
  onOpenChange,
  hobby,
  sportType,
  onSave 
}: SportsHobbiesEditorProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: hobby || {
      title: '',
      subtitle: '',
      description: '',
      badge_text: '',
      image_url: ''
    }
  });

  React.useEffect(() => {
    if (open) {
      setUploading(false);
      setSubmitting(false);
      if (hobby) {
        reset(hobby);
      } else {
        reset({
          title: sportType ? SPORT_TYPE_LABELS[sportType] || '' : '',
          subtitle: '',
          description: '',
          badge_text: '',
          image_url: ''
        });
      }
    }
  }, [hobby, reset, open, sportType]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Non authentifié");
      
      const user = session.user;

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/hobby-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('personal-content')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('personal-content')
        .getPublicUrl(filePath);

      setValue('image_url', publicUrl);
      toast({ title: "Image téléchargée" });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ 
        title: "Erreur lors du téléchargement", 
        variant: "destructive" 
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: any) => {
    if (submitting) return;
    
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({ 
          title: "Vous devez être connecté", 
          variant: "destructive" 
        });
        setSubmitting(false);
        return;
      }
      
      const user = session.user;

      const payload = {
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        badge_text: data.badge_text,
        image_url: data.image_url,
        sport_type: sportType || hobby?.sport_type || null
      };

      if (hobby?.id) {
        const { error: updateError } = await supabase
          .from('sports_hobbies')
          .update(payload)
          .eq('id', hobby.id);
        
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('sports_hobbies')
          .insert({
            ...payload,
            user_id: user.id,
            display_order: sportType ? -1 : 0
          });
        
        if (insertError) throw insertError;
      }

      toast({ title: hobby?.id ? "Passion modifiée" : "Passion ajoutée" });
      onSave();
      onOpenChange(false);
      reset();
    } catch (error: any) {
      console.error('Save error:', error);
      toast({ 
        title: "Erreur lors de l'enregistrement",
        description: error.message || "Une erreur est survenue",
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getDialogTitle = () => {
    if (sportType) {
      return hobby?.id 
        ? `Modifier ${SPORT_TYPE_LABELS[sportType]}`
        : `Ajouter ${SPORT_TYPE_LABELS[sportType]}`;
    }
    return hobby?.id ? "Modifier la passion" : "Ajouter une passion";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 overflow-y-auto flex-1 pr-2">
          {/* Section Identité */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground border-b pb-2">
              <Info className="w-4 h-4" />
              <span>Identité de la passion</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Titre *</Label>
                <Input 
                  {...register('title', { required: true })} 
                  placeholder="Ex: Golf, Équitation, Art..." 
                />
              </div>
              <div>
                <Label>Sous-titre</Label>
                <Input 
                  {...register('subtitle')} 
                  placeholder="Ex: Club de Deauville, Méditerranée..." 
                />
              </div>
            </div>
            <div>
              <Label>Badge / Niveau</Label>
              <Input 
                {...register('badge_text')} 
                placeholder="Ex: Expert, Membre depuis 2015, Handicap 12..." 
              />
            </div>
          </div>

          {/* Section Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground border-b pb-2">
              <Info className="w-4 h-4" />
              <span>Votre histoire</span>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea 
                {...register('description')} 
                placeholder="Décrivez votre passion, votre parcours, ce qui vous anime..."
                rows={4}
              />
            </div>
          </div>

          {/* Section Image */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground border-b pb-2">
              <Info className="w-4 h-4" />
              <span>Photo représentative</span>
            </div>
            <div>
              <Label htmlFor="hobby-image">Image (optionnelle)</Label>
              <div className="space-y-2">
                <input
                  id="hobby-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {watch('image_url') && (
                  <div className="relative">
                    <img 
                      src={watch('image_url')} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setValue('image_url', '')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={uploading || submitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={uploading || submitting}>
              {submitting ? "Enregistrement..." : uploading ? "Téléchargement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};