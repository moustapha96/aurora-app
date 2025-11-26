import React from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CuratedSportEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sport?: any;
  sportType: string;
  onSave: () => void;
}

export const CuratedSportEditor = ({ 
  open, 
  onOpenChange,
  sport,
  sportType,
  onSave 
}: CuratedSportEditorProps) => {
  const { toast } = useToast();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: sport || {
      title: '',
      subtitle: '',
      badge_text: '',
      description: '',
      image_url: '',
      stat1_label: '',
      stat1_value: '',
      stat2_label: '',
      stat2_value: '',
      stat3_label: '',
      stat3_value: ''
    }
  });

  React.useEffect(() => {
    if (sport) {
      reset(sport);
    } else {
      reset({
        title: '',
        subtitle: '',
        badge_text: '',
        description: '',
        image_url: '',
        stat1_label: '',
        stat1_value: '',
        stat2_label: '',
        stat2_value: '',
        stat3_label: '',
        stat3_value: ''
      });
    }
  }, [sport, reset]);

  const onSubmit = async (data: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ 
          title: "Vous devez être connecté", 
          variant: "destructive" 
        });
        return;
      }

      const sportData = {
        user_id: user.id,
        sport_type: sportType,
        title: data.title,
        subtitle: data.subtitle,
        badge_text: data.badge_text,
        description: data.description,
        image_url: data.image_url,
        stat1_label: data.stat1_label,
        stat1_value: data.stat1_value,
        stat2_label: data.stat2_label,
        stat2_value: data.stat2_value,
        stat3_label: data.stat3_label,
        stat3_value: data.stat3_value
      };

      await supabase
        .from('curated_sports')
        .upsert(sportData, { 
          onConflict: 'user_id,sport_type'
        });

      toast({ title: "Sport modifié avec succès" });
      onSave();
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('Save error:', error);
      toast({ 
        title: "Erreur lors de l'enregistrement", 
        variant: "destructive" 
      });
    }
  };

  const getSportTitle = () => {
    switch(sportType) {
      case 'yachting': return 'Yachting';
      case 'polo': return 'Polo';
      case 'chasse': return 'Chasse à Courre';
      default: return 'Sport';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier {getSportTitle()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Titre</Label>
              <Input {...register('title')} placeholder="Ex: Aurora III" />
            </div>
            <div>
              <Label>Sous-titre</Label>
              <Input {...register('subtitle')} placeholder="Ex: Benetti Custom 65m • 2022" />
            </div>
          </div>
          
          <div>
            <Label>Badge</Label>
            <Input {...register('badge_text')} placeholder="Ex: Propriétaire" />
          </div>

          <div>
            <Label>URL de l'image</Label>
            <Input {...register('image_url')} placeholder="URL de l'image..." />
          </div>
          
          <div>
            <Label>Description</Label>
            <Textarea 
              {...register('description')} 
              placeholder="Décrivez votre passion..."
              rows={6}
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Statistiques</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Statistique 1 - Label</Label>
                <Input {...register('stat1_label')} placeholder="Ex: Clubs" />
              </div>
              <div>
                <Label>Statistique 1 - Valeur</Label>
                <Input {...register('stat1_value')} placeholder="Ex: YC Monaco, NYYC" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Statistique 2 - Label</Label>
                <Input {...register('stat2_label')} placeholder="Ex: Capitainerie" />
              </div>
              <div>
                <Label>Statistique 2 - Valeur</Label>
                <Input {...register('stat2_value')} placeholder="Ex: Port Hercule" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Statistique 3 - Label</Label>
                <Input {...register('stat3_label')} placeholder="Ex: Régates" />
              </div>
              <div>
                <Label>Statistique 3 - Valeur</Label>
                <Input {...register('stat3_value')} placeholder="Ex: 12 saisons" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
