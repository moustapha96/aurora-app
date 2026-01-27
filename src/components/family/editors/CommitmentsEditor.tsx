import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2, Upload, Image, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface Commitment {
  id?: string;
  title: string;
  category?: string;
  organization?: string;
  start_year?: string;
  description?: string;
  image_url?: string;
}

interface CommitmentsEditorProps {
  commitments: Commitment[];
  onUpdate: () => void;
}

const CATEGORY_KEYS = [
  "categoryPhilanthropy",
  "categoryEducation",
  "categoryHealth",
  "categoryEnvironment",
  "categoryCultureArts",
  "categorySocial",
  "categorySport",
  "categoryOther"
];

export const CommitmentsEditor = ({ commitments, onUpdate }: CommitmentsEditorProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Commitment>({
    title: "",
    category: "",
    organization: "",
    start_year: "",
    description: "",
    image_url: ""
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/commitments/${Date.now()}.${fileExt}`;
      
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
        'gif': 'image/gif', 'webp': 'image/webp'
      };
      const contentType = mimeTypes[fileExt] || 'image/jpeg';
      const typedBlob = new Blob([file], { type: contentType });

      const { error: uploadError } = await supabase.storage
        .from('personal-content')
        .upload(fileName, typedBlob, { upsert: true, contentType });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('personal-content')
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: publicUrl + '?t=' + Date.now() });
      toast({ title: t('imageUploaded') || "Image téléchargée" });
    } catch (error) {
      console.error(error);
      toast({ title: t('uploadError') || "Erreur lors du téléchargement", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const openNewDialog = () => {
    setEditingCommitment(null);
    setFormData({
      title: "",
      category: "",
      organization: "",
      start_year: "",
      description: "",
      image_url: ""
    });
    setIsOpen(true);
  };

  const openEditDialog = (commitment: Commitment) => {
    setEditingCommitment(commitment);
    setFormData({
      title: commitment.title,
      category: commitment.category || "",
      organization: commitment.organization || "",
      start_year: commitment.start_year || "",
      description: commitment.description || "",
      image_url: commitment.image_url || ""
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast({ title: t('titleRequired') || "Veuillez indiquer un titre", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      if (editingCommitment?.id) {
        await supabase
          .from('family_commitments')
          .update({
            title: formData.title,
            category: formData.category || null,
            organization: formData.organization || null,
            start_year: formData.start_year || null,
            description: formData.description || null,
            image_url: formData.image_url || null
          })
          .eq('id', editingCommitment.id);
      } else {
        await supabase
          .from('family_commitments')
          .insert({
            user_id: user.id,
            title: formData.title,
            category: formData.category || null,
            organization: formData.organization || null,
            start_year: formData.start_year || null,
            description: formData.description || null,
            image_url: formData.image_url || null,
            display_order: commitments.length
          });
      }

      toast({ title: editingCommitment ? t('modifiedSuccess') : t('addedSuccess') });
      setIsOpen(false);
      onUpdate();
    } catch (error) {
      console.error(error);
      toast({ title: t('error'), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirmation') || "Supprimer cet engagement ?")) return;
    
    try {
      await supabase.from('family_commitments').delete().eq('id', id);
      toast({ title: t('deleted') });
      onUpdate();
    } catch (error) {
      toast({ title: t('error'), variant: "destructive" });
    }
  };

  const handleAISuggest = async () => {
    if (!formData.title) {
      toast({ title: t('titleRequiredForAI') || "Veuillez d'abord indiquer le titre", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('family-ai-suggest', {
        body: {
          module: 'commitments',
          currentInput: {
            title: formData.title,
            category: formData.category,
            organization: formData.organization
          }
        }
      });
      if (error) throw error;
      if (data?.suggestion) {
        setFormData({ ...formData, description: data.suggestion });
        toast({ title: t('suggestionGenerated') || "Suggestion générée" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: t('generationError') || "Erreur lors de la génération", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-muted-foreground">{t('familyCommitments')}</h4>
        <Button size="sm" onClick={openNewDialog} className="bg-gold text-black hover:bg-gold/90">
          <Plus className="w-4 h-4 sm:mr-1" />
          <span className="hidden sm:inline">{t('add')}</span>
        </Button>
      </div>

      {commitments.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {commitments.map((commitment) => (
            <div key={commitment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{commitment.title}</p>
                <p className="text-xs text-muted-foreground">{commitment.category} {commitment.organization && `• ${commitment.organization}`}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEditDialog(commitment)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(commitment.id!)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[85vh] overflow-y-auto bg-[#1a1a1a] border border-gold/30 p-4 sm:p-6" data-scroll>
          <DialogHeader className="pb-2">
            <DialogTitle className="text-gold text-base sm:text-lg">
              {editingCommitment ? t('editCommitment') : t('addCommitment')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 sm:space-y-4">
            {/* Image upload - simplified & responsive */}
            <div 
              className="relative w-full h-32 sm:h-40 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-border hover:border-gold/60 transition-colors group"
              onClick={() => fileInputRef.current?.click()}
            >
              {formData.image_url ? (
                <>
                  <img src={formData.image_url} alt="Image" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-gold" />
                  ) : (
                    <>
                      <Image className="w-8 h-8" />
                      <span className="text-xs">{t('addImageCommitment')}</span>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <div>
              <Label className="text-sm">{t('commitmentTitleLabel')} *</Label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder={t('commitmentTitlePlaceholder')}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm">{t('category')}</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t('selectCategory')} />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-gold/30">
                  {CATEGORY_KEYS.map((key) => (
                    <SelectItem key={key} value={t(key)}>{t(key)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">{t('organization')}</Label>
                <Input 
                  value={formData.organization} 
                  onChange={(e) => setFormData({...formData, organization: e.target.value})}
                  placeholder={t('organizationPlaceholder')}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">{t('since')}</Label>
                <Input 
                  value={formData.start_year} 
                  onChange={(e) => setFormData({...formData, start_year: e.target.value})}
                  placeholder="2015"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm">{t('description')}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAISuggest}
                  disabled={isGenerating || !formData.title}
                  className="text-gold hover:text-gold/80 h-6 px-2 text-xs"
                >
                  {isGenerating ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 mr-1" />
                  )}
                  {t('ai')}
                </Button>
              </div>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder={t('commitmentDescriptionPlaceholder')}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-3">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="w-full sm:w-auto">
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading || isUploading} 
              className="bg-gold text-black hover:bg-gold/90 w-full sm:w-auto"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('validate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
