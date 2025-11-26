import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useForm, UseFormRegister, FieldValues } from "react-hook-form";
import { X } from "lucide-react";

interface PersonalContent {
  yachting_title?: string;
  yachting_subtitle?: string;
  yachting_badge?: string;
  yachting_description?: string;
  yachting_image_url?: string;
  yachting_stat1_label?: string;
  yachting_stat1_value?: string;
  yachting_stat2_label?: string;
  yachting_stat2_value?: string;
  yachting_stat3_label?: string;
  yachting_stat3_value?: string;

  polo_title?: string;
  polo_subtitle?: string;
  polo_badge?: string;
  polo_description?: string;
  polo_image_url?: string;
  polo_stat1_label?: string;
  polo_stat1_value?: string;
  polo_stat2_label?: string;
  polo_stat2_value?: string;
  polo_stat3_label?: string;
  polo_stat3_value?: string;

  chasse_title?: string;
  chasse_subtitle?: string;
  chasse_badge?: string;
  chasse_description?: string;
  chasse_image_url?: string;
  chasse_stat1_label?: string;
  chasse_stat1_value?: string;
  chasse_stat2_label?: string;
  chasse_stat2_value?: string;
  chasse_stat3_label?: string;
  chasse_stat3_value?: string;
}

interface PersonalContentEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content?: PersonalContent;
  onSave: () => void;
  sportsHobbies?: any[];
  onEditHobby?: (hobby: any) => void;
  onDeleteHobby?: (id: string) => void;
  onAddHobby?: () => void;
}

// Composant séparé pour éviter les re-rendus
const SportSection = React.memo(({ 
  sport, 
  label, 
  register,
  isFieldModified,
  imageUrl,
  onImageUpload,
  onImageRemove,
  uploading
}: { 
  sport: string; 
  label: string;
  register: UseFormRegister<PersonalContent>;
  isFieldModified: (fieldName: keyof PersonalContent) => boolean;
  imageUrl?: string;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
  onImageRemove: (field: string) => void;
  uploading: boolean;
}) => (
  <div className="space-y-4">
    <h3 className="text-xl font-semibold">{label}</h3>
    
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label>Titre principal {isFieldModified(`${sport}_title` as keyof PersonalContent) && <span className="text-[hsl(30,100%,65%)] ml-1">●</span>}</Label>
        <Input 
          {...register(`${sport}_title` as any)} 
          placeholder="Ex: Aurora III"
        />
      </div>
      <div className="space-y-1">
        <Label>Sous-titre {isFieldModified(`${sport}_subtitle` as keyof PersonalContent) && <span className="text-[hsl(30,100%,65%)] ml-1">●</span>}</Label>
        <Input 
          {...register(`${sport}_subtitle` as any)} 
          placeholder="Ex: Benetti Custom 65m • 2022"
        />
      </div>
    </div>

    <div className="space-y-1">
      <Label>Badge {isFieldModified(`${sport}_badge` as keyof PersonalContent) && <span className="text-[hsl(30,100%,65%)] ml-1">●</span>}</Label>
      <Input 
        {...register(`${sport}_badge` as any)} 
        placeholder="Ex: Propriétaire"
      />
    </div>

    <div className="space-y-1">
      <Label>Description {isFieldModified(`${sport}_description` as keyof PersonalContent) && <span className="text-[hsl(30,100%,65%)] ml-1">●</span>}</Label>
      <Textarea 
        {...register(`${sport}_description` as any)} 
        rows={6}
        placeholder="Décrivez votre passion..."
      />
    </div>

    <div className="space-y-4 pt-4 border-t">
      <h4 className="font-semibold">Image</h4>
      <div className="space-y-2">
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => onImageUpload(e, `${sport}_image_url`)}
          disabled={uploading}
        />
        {imageUrl && (
          <div className="relative">
            <img 
              src={imageUrl} 
              alt="Preview" 
              className="w-full h-48 object-cover rounded-lg"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => onImageRemove(`${sport}_image_url`)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>

    <div className="space-y-4 pt-4 border-t">
      <h4 className="font-semibold">Statistiques (3 colonnes)</h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Label 1 {isFieldModified(`${sport}_stat1_label` as keyof PersonalContent) && <span className="text-[hsl(30,100%,65%)] ml-1">●</span>}</Label>
          <Input 
            {...register(`${sport}_stat1_label` as any)} 
            placeholder="Ex: Clubs"
          />
        </div>
        <div className="space-y-1">
          <Label>Valeur 1 {isFieldModified(`${sport}_stat1_value` as keyof PersonalContent) && <span className="text-[hsl(30,100%,65%)] ml-1">●</span>}</Label>
          <Input 
            {...register(`${sport}_stat1_value` as any)} 
            placeholder="Ex: YC Monaco, NYYC"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Label 2 {isFieldModified(`${sport}_stat2_label` as keyof PersonalContent) && <span className="text-[hsl(30,100%,65%)] ml-1">●</span>}</Label>
          <Input 
            {...register(`${sport}_stat2_label` as any)} 
            placeholder="Ex: Capitainerie"
          />
        </div>
        <div className="space-y-1">
          <Label>Valeur 2 {isFieldModified(`${sport}_stat2_value` as keyof PersonalContent) && <span className="text-[hsl(30,100%,65%)] ml-1">●</span>}</Label>
          <Input 
            {...register(`${sport}_stat2_value` as any)} 
            placeholder="Ex: Port Hercule"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Label 3 {isFieldModified(`${sport}_stat3_label` as keyof PersonalContent) && <span className="text-[hsl(30,100%,65%)] ml-1">●</span>}</Label>
          <Input 
            {...register(`${sport}_stat3_label` as any)} 
            placeholder="Ex: Régates"
          />
        </div>
        <div className="space-y-1">
          <Label>Valeur 3 {isFieldModified(`${sport}_stat3_value` as keyof PersonalContent) && <span className="text-[hsl(30,100%,65%)] ml-1">●</span>}</Label>
          <Input 
            {...register(`${sport}_stat3_value` as any)} 
            placeholder="Ex: 12 saisons"
          />
        </div>
      </div>
    </div>
  </div>
));

SportSection.displayName = 'SportSection';


export const PersonalContentEditor = ({ 
  open, 
  onOpenChange,
  content,
  onSave,
  sportsHobbies = [],
  onEditHobby,
  onDeleteHobby,
  onAddHobby
}: PersonalContentEditorProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [initialContent, setInitialContent] = useState<PersonalContent>({});
  
  const { register, handleSubmit, setValue, watch, reset } = useForm<PersonalContent>({
    defaultValues: {}
  });
  
  const formData = watch();

  useEffect(() => {
    if (open && content) {
      // Réinitialiser le formulaire uniquement à l'ouverture
      reset(content);
      setInitialContent(content);
    }
  }, [open]);

  const isFieldModified = (fieldName: keyof PersonalContent): boolean => {
    const currentValue = formData[fieldName];
    const initialValue = initialContent[fieldName];
    
    // Si les deux valeurs sont vides/nulles, ce n'est pas modifié
    if ((!currentValue || currentValue === '') && (!initialValue || initialValue === '')) {
      return false;
    }
    
    // Sinon, vérifier s'ils sont différents
    return currentValue !== initialValue;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${field}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('personal-content')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('personal-content')
        .getPublicUrl(filePath);

      setValue(field as any, publicUrl);
      toast({ title: "Image téléchargée" });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ 
        title: "Erreur lors du téléchargement", 
        variant: "destructive" 
      });
    } finally {
      setUploadingField(null);
    }
  };

  const onSubmit = async (data: PersonalContent) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const sports = ['yachting', 'polo', 'chasse'];
      for (const sport of sports) {
        const sportData = {
          user_id: user.id,
          sport_type: sport,
          title: data[`${sport}_title` as keyof PersonalContent] || '',
          subtitle: data[`${sport}_subtitle` as keyof PersonalContent] || '',
          badge_text: data[`${sport}_badge` as keyof PersonalContent] || '',
          description: data[`${sport}_description` as keyof PersonalContent] || '',
          image_url: data[`${sport}_image_url` as keyof PersonalContent] || '',
          stat1_label: data[`${sport}_stat1_label` as keyof PersonalContent] || '',
          stat1_value: data[`${sport}_stat1_value` as keyof PersonalContent] || '',
          stat2_label: data[`${sport}_stat2_label` as keyof PersonalContent] || '',
          stat2_value: data[`${sport}_stat2_value` as keyof PersonalContent] || '',
          stat3_label: data[`${sport}_stat3_label` as keyof PersonalContent] || '',
          stat3_value: data[`${sport}_stat3_value` as keyof PersonalContent] || '',
        };

        await supabase
          .from('curated_sports')
          .upsert(sportData, { 
            onConflict: 'user_id,sport_type'
          });
      }

      toast({ title: "Contenu enregistré" });
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Save error:', error);
      toast({ 
        title: "Erreur lors de l'enregistrement", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const ImageUploadField = ({ field, label }: { field: string; label: string }) => {
    const imageUrl = watch(field as any);
    
    return (
      <div>
        <Label>{label}</Label>
        <div className="space-y-2">
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, field)}
            disabled={uploadingField === field}
          />
          {imageUrl && (
            <div className="relative">
              <img 
                src={imageUrl} 
                alt="Preview" 
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => setValue(field as any, '')}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le contenu Personal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="yachting" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="yachting">Yachting</TabsTrigger>
              <TabsTrigger value="polo">Polo</TabsTrigger>
              <TabsTrigger value="chasse">Chasse à Courre</TabsTrigger>
              <TabsTrigger value="autres">Autres Passions</TabsTrigger>
            </TabsList>

            <TabsContent value="yachting" className="space-y-4 mt-4">
              <SportSection 
                sport="yachting" 
                label="Yachting" 
                register={register} 
                isFieldModified={isFieldModified}
                imageUrl={watch('yachting_image_url')}
                onImageUpload={handleImageUpload}
                onImageRemove={(field) => setValue(field as any, '')}
                uploading={uploadingField === 'yachting_image_url'}
              />
            </TabsContent>

            <TabsContent value="polo" className="space-y-4 mt-4">
              <SportSection 
                sport="polo" 
                label="Polo" 
                register={register} 
                isFieldModified={isFieldModified}
                imageUrl={watch('polo_image_url')}
                onImageUpload={handleImageUpload}
                onImageRemove={(field) => setValue(field as any, '')}
                uploading={uploadingField === 'polo_image_url'}
              />
            </TabsContent>

            <TabsContent value="chasse" className="space-y-4 mt-4">
              <SportSection 
                sport="chasse" 
                label="Chasse à Courre" 
                register={register} 
                isFieldModified={isFieldModified}
                imageUrl={watch('chasse_image_url')}
                onImageUpload={handleImageUpload}
                onImageRemove={(field) => setValue(field as any, '')}
                uploading={uploadingField === 'chasse_image_url'}
              />
            </TabsContent>

            <TabsContent value="autres" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Autres Passions / Sports</h3>
                  {onAddHobby && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onAddHobby}
                    >
                      Ajouter une passion
                    </Button>
                  )}
                </div>
                
                {sportsHobbies.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune passion ajoutée pour le moment.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sportsHobbies.map((hobby) => (
                      <div 
                        key={hobby.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold">{hobby.title}</h4>
                          {hobby.badge_text && (
                            <p className="text-sm text-muted-foreground">{hobby.badge_text}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {onEditHobby && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => onEditHobby(hobby)}
                            >
                              Modifier
                            </Button>
                          )}
                          {onDeleteHobby && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => onDeleteHobby(hobby.id)}
                            >
                              Supprimer
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
