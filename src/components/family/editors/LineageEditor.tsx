import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Loader2, Upload, User, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface LineageEntry {
  id?: string;
  generation: string;
  member_name: string;
  title?: string;
  origin_location?: string;
  birth_year?: string;
  description?: string;
  image_url?: string;
}

interface LineageEditorProps {
  entries: LineageEntry[];
  onUpdate: () => void;
}

export const LineageEditor = ({ entries, onUpdate }: LineageEditorProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const GENERATIONS = [
    t('greatGrandparents'),
    t('grandparents'),
    t('parents'),
    t('currentGeneration'),
    t('children'),
    t('grandchildren')
  ];
  const [isOpen, setIsOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LineageEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<LineageEntry>({
    generation: "",
    member_name: "",
    title: "",
    origin_location: "",
    birth_year: "",
    description: "",
    image_url: ""
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: t('pleaseSelectImage'), variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('notAuthenticated'));

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `lineage-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
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
        .upload(filePath, properFile, { upsert: true, contentType });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('personal-content')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      toast({ title: t('photoImportedSuccess') });
    } catch (error) {
      console.error(error);
      toast({ title: t('importError'), variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const openNewDialog = () => {
    setEditingEntry(null);
    setFormData({
      generation: "",
      member_name: "",
      title: "",
      origin_location: "",
      birth_year: "",
      description: "",
      image_url: ""
    });
    setIsOpen(true);
  };

  const openEditDialog = (entry: LineageEntry) => {
    setEditingEntry(entry);
    setFormData({
      generation: entry.generation,
      member_name: entry.member_name,
      title: entry.title || "",
      origin_location: entry.origin_location || "",
      birth_year: entry.birth_year || "",
      description: entry.description || "",
      image_url: entry.image_url || ""
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!formData.member_name || !formData.generation) {
      toast({ title: t('fillAllRequiredFields'), variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('notAuthenticated'));

      if (editingEntry?.id) {
        await supabase
          .from('family_lineage')
          .update({
            generation: formData.generation,
            member_name: formData.member_name,
            title: formData.title || null,
            origin_location: formData.origin_location || null,
            birth_year: formData.birth_year || null,
            description: formData.description || null,
            image_url: formData.image_url || null
          })
          .eq('id', editingEntry.id);
      } else {
        await supabase
          .from('family_lineage')
          .insert({
            user_id: user.id,
            generation: formData.generation,
            member_name: formData.member_name,
            title: formData.title || null,
            origin_location: formData.origin_location || null,
            birth_year: formData.birth_year || null,
            description: formData.description || null,
            image_url: formData.image_url || null,
            display_order: entries.length
          });
      }

      toast({ title: editingEntry ? t('updatedSuccessfully') : t('addedSuccessfully') });
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
    if (!confirm(t('deleteThisEntry'))) return;
    
    try {
      await supabase.from('family_lineage').delete().eq('id', id);
      toast({ title: t('deleted') });
      onUpdate();
    } catch (error) {
      toast({ title: t('error'), variant: "destructive" });
    }
  };

  const handleAISuggest = async () => {
    if (!formData.member_name) {
      toast({ title: t('pleaseEnterNameFirst'), variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('family-ai-suggest', {
        body: {
          module: 'lineage',
          currentInput: {
            name: formData.member_name,
            generation: formData.generation,
            title: formData.title,
            origin: formData.origin_location
          }
        }
      });
      if (error) throw error;
      if (data?.suggestion) {
        setFormData({ ...formData, description: data.suggestion });
        toast({ title: t('suggestionGenerated') });
      }
    } catch (error) {
      console.error(error);
      toast({ title: t('generationError'), variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4 relative z-10">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-muted-foreground">{t('manageLineage')}</h4>
      </div>

      {entries.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{entry.member_name}</p>
                <p className="text-xs text-muted-foreground">{entry.generation}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEditDialog(entry)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(entry.id!)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border border-gold/30 p-4 sm:p-6" data-scroll>
          <DialogHeader className="pb-2">
            <DialogTitle className="text-gold text-lg font-medium flex items-center gap-2">
              <User className="w-5 h-5" />
              {editingEntry ? t('edit') : t('add')} {t('aMember')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Photo Upload */}
            <div className="flex flex-col items-center gap-3">
              <div 
                className="w-20 h-20 rounded-full border border-gold/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-gold/50 transition-colors bg-[#252525]"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.image_url ? (
                  <img src={formData.image_url} alt={t('photo')} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="border-gold/30 text-gold hover:bg-gold/10 hover:border-gold/50 bg-transparent"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">{formData.image_url ? t('change') : t('addPhoto')}</span>
              </Button>
            </div>

            <div>
              <Label className="text-foreground/90 text-sm">{t('generation')} *</Label>
              <Select value={formData.generation} onValueChange={(v) => setFormData({...formData, generation: v})}>
                <SelectTrigger className="bg-[#252525] border-gold/20 focus:border-gold/50 mt-1">
                  <SelectValue placeholder={t('select')} />
                </SelectTrigger>
                <SelectContent className="bg-[#252525] border-gold/20">
                  {GENERATIONS.map((g) => (
                    <SelectItem key={g} value={g} className="hover:bg-gold/10 focus:bg-gold/10">{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-foreground/90 text-sm">{t('fullName')} *</Label>
              <Input 
                value={formData.member_name} 
                onChange={(e) => setFormData({...formData, member_name: e.target.value})}
                placeholder={t('firstNameLastName')}
                className="bg-[#252525] border-gold/20 focus:border-gold/50 mt-1"
              />
            </div>
            
            <div>
              <Label className="text-foreground/90 text-sm">{t('titleFunction')}</Label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder={t('exFounderOf')}
                className="bg-[#252525] border-gold/20 focus:border-gold/50 mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground/90 text-sm">{t('origin')}</Label>
                <Input 
                  value={formData.origin_location} 
                  onChange={(e) => setFormData({...formData, origin_location: e.target.value})}
                  placeholder={t('cityCountry')}
                  className="bg-[#252525] border-gold/20 focus:border-gold/50 mt-1"
                />
              </div>
              <div>
                <Label className="text-foreground/90 text-sm">{t('birthYear')}</Label>
                <Input 
                  value={formData.birth_year} 
                  onChange={(e) => setFormData({...formData, birth_year: e.target.value})}
                  placeholder="1950"
                  className="bg-[#252525] border-gold/20 focus:border-gold/50 mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-foreground/90 text-sm">{t('description')}</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder={t('pathAnecdotes')}
                rows={3}
                className="bg-[#252525] border-gold/20 focus:border-gold/50 mt-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gold/10 mt-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAISuggest}
                disabled={isGenerating || !formData.member_name}
                className="border-gold/30 text-gold hover:bg-gold/10 hover:border-gold/50 bg-transparent"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {t('aiAurora')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="border-gold/30 text-gold hover:bg-gold/10 hover:border-gold/50 bg-transparent"
              >
                <Upload className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('import')}</span>
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                className="border-gold/30 text-foreground hover:bg-gold/10 hover:border-gold/50 bg-transparent uppercase tracking-wide text-sm"
              >
                {t('cancel')}
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isLoading || isUploading} 
                className="bg-gold text-black hover:bg-gold/90 uppercase tracking-wide text-sm font-medium"
              >
                {isLoading && <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />}
                {editingEntry ? t('edit') : t('create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
