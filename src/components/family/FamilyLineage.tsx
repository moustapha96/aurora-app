// React and UI Components
import React, { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Trash2, Loader2, Upload, User, Sparkles, FileText, Crown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Supabase client
import { supabase } from "@/integrations/supabase/client";

// Utilities
import { useToast } from "@/hooks/use-toast";
import { InlineEditableField } from "@/components/ui/inline-editable-field";
import { toast as sonnerToast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

// Storage utilities - centralized upload functions with correct RLS path patterns
import { uploadFamilyImage, uploadFamilyDocument } from "@/lib/storageUploadUtils";

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

interface FamilyLineageProps {
  entries: LineageEntry[];
  isEditable?: boolean;
  onUpdate?: () => void;
}

export const FamilyLineage = ({ entries, isEditable = false, onUpdate }: FamilyLineageProps) => {
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
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImportingDoc, setIsImportingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<LineageEntry>({
    generation: "",
    member_name: "",
    title: "",
    origin_location: "",
    birth_year: "",
    description: "",
    image_url: ""
  });

  // Group by generation
  const groupedByGeneration = entries.reduce((acc, entry) => {
    const gen = entry.generation || t('other');
    if (!acc[gen]) acc[gen] = [];
    acc[gen].push(entry);
    return acc;
  }, {} as Record<string, LineageEntry[]>);

  const updateField = async (entryId: string, field: keyof LineageEntry, value: string) => {
    try {
      const { error } = await supabase
        .from("family_lineage")
        .update({ [field]: value || null })
        .eq("id", entryId);
      if (error) throw error;
      onUpdate?.();
    } catch (error: any) {
      toast({ title: error.message, variant: "destructive" });
    }
  };

  // Handle image upload using centralized utility - ensures correct RLS path: {userId}/lineage/{timestamp}.{ext}
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

      // Upload using centralized utility - path: {userId}/lineage/{timestamp}.{ext}
      const result = await uploadFamilyImage(file, user.id, 'lineage');
      
      if (!result.success || !result.publicUrl) {
        throw new Error(result.error || t('importError'));
      }

      setFormData({ ...formData, image_url: result.publicUrl });
      toast({ title: t('photoImportedSuccess') });
    } catch (error) {
      console.error(error);
      toast({ title: t('importError'), variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!formData.member_name) {
      sonnerToast.error(t('pleaseEnterNameFirst'));
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('family-ai-suggest', {
        body: { moduleType: 'lineage', context: `${formData.member_name} ${formData.title || ''} ${formData.generation || ''}` }
      });
      if (error) throw error;
      if (data?.suggestion) {
        setFormData(prev => ({ ...prev, description: data.suggestion }));
        sonnerToast.success(t('suggestionGenerated'));
      }
    } catch {
      sonnerToast.error(t('generationError'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle document import using centralized utility - ensures correct RLS path: {userId}/documents/{timestamp}.{ext}
  const handleDocImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      sonnerToast.error(t('fileTooLargeMax10MB'));
      return;
    }

    setIsImportingDoc(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('notAuthenticated'));

      // Upload using centralized utility - path: {userId}/documents/{timestamp}.{ext}
      const result = await uploadFamilyDocument(file, user.id, 'documents');
      
      if (!result.success || !result.storagePath) {
        throw new Error(result.error || t('documentImportError'));
      }

      // Save document reference
      await supabase.from('family_documents').insert({
        user_id: user.id,
        file_name: file.name,
        file_path: result.storagePath,
        file_size: file.size,
        file_type: file.type,
        description: `${t('lineageDocument')}: ${formData.member_name || t('newMember')}`
      });

      sonnerToast.success(t('documentImportedSuccess'));
    } catch (error) {
      console.error(error);
      sonnerToast.error(t('documentImportError'));
    } finally {
      setIsImportingDoc(false);
    }
  };

  const openNewDialog = () => {
    console.log("=== openNewDialog called ===");
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
    console.log("=== Dialog should be open now ===");
  };

  const handleSave = async () => {
    console.log("=== handleSave called ===", { formData });
    
    if (!formData.member_name || !formData.generation) {
      console.log("Validation failed: missing required fields");
      toast({ title: t('fillAllRequiredFields'), variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log("Auth result:", { user: user?.id, authError });
      
      if (authError) throw authError;
      if (!user) throw new Error(t('notAuthenticated'));

      const insertData = {
        user_id: user.id,
        generation: formData.generation,
        member_name: formData.member_name,
        title: formData.title || null,
        origin_location: formData.origin_location || null,
        birth_year: formData.birth_year || null,
        description: formData.description || null,
        image_url: formData.image_url || null,
        display_order: entries.length
      };
      console.log("Inserting data:", insertData);

      const { data, error } = await supabase
        .from('family_lineage')
        .insert(insertData)
        .select();
      
      console.log("Insert result:", { data, error });
      
      if (error) throw error;

      toast({ title: t('addedSuccessfully') });
      setIsOpen(false);
      onUpdate?.();
    } catch (error: any) {
      console.error("FamilyLineage insert error:", error);
      toast({ title: error?.message || t('addError'), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm(t('deleteThisEntry'))) return;
    
    try {
      await supabase.from('family_lineage').delete().eq('id', id);
      toast({ title: t('deleted') });
      onUpdate?.();
    } catch (error) {
      toast({ title: t('error'), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {isEditable && (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={openNewDialog}
            className="bg-gold/20 text-gold border border-gold/30 hover:bg-gold/30 text-xs sm:text-sm h-8 sm:h-9"
          >
            <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            {t('addMember')}
          </Button>
        </div>
      )}
      
      {(!entries || entries.length === 0) ? (
        <p className="text-muted-foreground text-sm italic text-center py-4">
          {t('noLineageEntered')}
        </p>
      ) : (
        Object.entries(groupedByGeneration).map(([generation, members]) => (
          <div key={generation} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gold/20" />
              <Badge variant="outline" className="border-gold/30 text-gold text-xs">
                {generation}
              </Badge>
              <div className="h-px flex-1 bg-gold/20" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {members.map((member, idx) => (
                <div 
                  key={member.id || idx} 
                  className="relative p-3 bg-gold/5 rounded-lg border border-gold/10 flex gap-3 hover:border-gold/20 transition-colors"
                >
                  {isEditable && member.id && (
                    <button
                      onClick={(e) => handleDelete(e, member.id!)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                      title={t('delete')}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                  
                  {member.image_url && (
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-gold/20">
                      <img 
                        src={member.image_url} 
                        alt={member.member_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 pr-6">
                    {isEditable && member.id ? (
                      <>
                        <p className="font-medium text-foreground">
                          <InlineEditableField
                            value={member.member_name}
                            onSave={(v) => updateField(member.id!, "member_name", v)}
                            placeholder={t('name')}
                          />
                        </p>
                        <p className="text-sm text-gold/80">
                          <InlineEditableField
                            value={member.title || ""}
                            onSave={(v) => updateField(member.id!, "title", v)}
                            placeholder={t('titleFunction')}
                            className="text-sm"
                          />
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <InlineEditableField
                              value={member.origin_location || ""}
                              onSave={(v) => updateField(member.id!, "origin_location", v)}
                              placeholder={t('origin')}
                              className="text-xs"
                            />
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <InlineEditableField
                              value={member.birth_year || ""}
                              onSave={(v) => updateField(member.id!, "birth_year", v)}
                              placeholder={t('year')}
                              className="text-xs"
                            />
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-foreground truncate">{member.member_name}</p>
                        {member.title && (
                          <p className="text-sm text-gold/80">{member.title}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {member.origin_location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {member.origin_location}
                            </span>
                          )}
                          {member.birth_year && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {member.birth_year}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto p-4 sm:p-6" data-scroll>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gold text-base sm:text-lg">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              {t('addMember')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2 sm:space-y-3">
            {/* Photo upload - compact */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div 
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-gold/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-gold/50 transition-colors flex-shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.image_url ? (
                  <img src={formData.image_url} alt={t('photo')} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
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
                className="border-gold/30 text-gold hover:bg-gold/10 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
              >
                {isUploading ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Upload className="w-3 h-3 sm:mr-1" />
                )}
                <span className="hidden sm:inline">{formData.image_url ? t('change') : t('photo')}</span>
              </Button>
            </div>

            {/* Generation + Name - stacked on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div>
                <Label className="text-[10px] sm:text-xs">{t('generation')} *</Label>
                <Select value={formData.generation} onValueChange={(v) => setFormData({...formData, generation: v})}>
                  <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue placeholder={t('select')} />
                  </SelectTrigger>
                  <SelectContent>
                    {GENERATIONS.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] sm:text-xs">{t('fullName')} *</Label>
                <Input 
                  value={formData.member_name} 
                  onChange={(e) => setFormData({...formData, member_name: e.target.value})}
                  placeholder={t('firstNameLastName')}
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>
            </div>
            
            {/* Title */}
            <div>
              <Label className="text-[10px] sm:text-xs">{t('titleFunction')}</Label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder={t('exFounderOf')}
                className="h-8 sm:h-9 text-xs sm:text-sm"
              />
            </div>
            
            {/* Origin + Birth year */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <Label className="text-[10px] sm:text-xs">{t('origin')}</Label>
                <Input 
                  value={formData.origin_location} 
                  onChange={(e) => setFormData({...formData, origin_location: e.target.value})}
                  placeholder={t('cityCountry')}
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>
              <div>
                <Label className="text-[10px] sm:text-xs">{t('birthYear')}</Label>
                <Input 
                  value={formData.birth_year} 
                  onChange={(e) => setFormData({...formData, birth_year: e.target.value})}
                  placeholder="1950"
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className="text-[10px] sm:text-xs">{t('description')}</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder={t('pathAnecdotes')}
                rows={2}
                className="resize-none text-xs sm:text-sm min-h-[50px] sm:min-h-[60px]"
              />
            </div>

            {/* Hidden document input */}
            <input
              ref={docInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleDocImport}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0 pt-2 sm:pt-3 border-t border-gold/20">
            <div className="flex gap-1 sm:gap-2 justify-center sm:justify-start">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleAIGenerate}
                disabled={isGenerating}
                className="border-gold/30 text-gold hover:bg-gold/10 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
              >
                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                {t('aiAurora')}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => docInputRef.current?.click()}
                disabled={isImportingDoc}
                className="border-gold/30 text-gold hover:bg-gold/10 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
              >
                {isImportingDoc ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <FileText className="w-3 h-3 mr-1" />}
                {t('import')}
              </Button>
            </div>
            <div className="flex gap-1 sm:gap-2 justify-center sm:justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsOpen(false)} className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3">{t('cancel')}</Button>
              <Button size="sm" onClick={handleSave} disabled={isLoading || isUploading} className="bg-gold text-black hover:bg-gold/90 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3">
                {isLoading && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                {t('create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
