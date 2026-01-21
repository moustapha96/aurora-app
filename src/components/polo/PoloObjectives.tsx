import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Target, Calendar, Compass, Loader2, Check, Sparkles, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PoloObjective } from './PoloProfileModule';

interface PoloObjectivesProps {
  userId: string;
  objectives: PoloObjective[];
  isEditable: boolean;
  onUpdate: () => void;
}

const PoloObjectives: React.FC<PoloObjectivesProps> = ({ userId, objectives, isEditable, onUpdate }) => {
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<PoloObjective | null>(null);
  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImportingDoc, setIsImportingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<PoloObjective>>({
    objective_type: 'season',
    description: '',
    is_completed: false,
  });

  const seasonObjectives = objectives.filter(o => o.objective_type === 'season');
  const longTermObjectives = objectives.filter(o => o.objective_type === 'long_term');

  const openAddDialog = (type: 'season' | 'long_term') => {
    setEditingObjective(null);
    setFormData({
      objective_type: type,
      description: '',
      is_completed: false,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (objective: PoloObjective) => {
    setEditingObjective(objective);
    setFormData({
      objective_type: objective.objective_type,
      description: objective.description,
      is_completed: objective.is_completed,
    });
    setDialogOpen(true);
  };

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('personal-ai-suggest', {
        body: { moduleType: 'sports', context: `Polo objective ${formData.objective_type === 'season' ? 'for this season' : 'long term'}` }
      });
      if (error) throw error;
      if (data?.suggestion) {
        setFormData(prev => ({ ...prev, description: data.suggestion }));
        toast.success(t('poloAchievementSuggestionGenerated'));
      }
    } catch {
      toast.error(t('poloAchievementGenerationError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDocImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(t('poloHorseFileTooLarge'));
      return;
    }

    setIsImportingDoc(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('notAuthenticated'));

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const fileName = `polo-objective-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      // Ensure proper MIME type
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
        'gif': 'image/gif', 'webp': 'image/webp', 'pdf': 'application/pdf',
        'doc': 'application/msword', 'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
      const contentType = mimeTypes[fileExt] || 'application/octet-stream';
      const properFile = new File([file], file.name, { type: contentType, lastModified: Date.now() });

      const { error: uploadError } = await supabase.storage
        .from('personal-content')
        .upload(filePath, properFile, { upsert: true, contentType });

      if (uploadError) throw uploadError;
      toast.success(t('poloHorseDocumentImported'));
    } catch (error) {
      console.error(error);
      toast.error(t('poloHorseImportError'));
    } finally {
      setIsImportingDoc(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  // Auto-save function
  const saveData = useCallback(async (data: Partial<PoloObjective>) => {
    if (!data.description?.trim()) return;

    setSaving(true);
    try {
      if (editingObjective?.id) {
        const { error } = await supabase
          .from('polo_objectives')
          .update(data)
          .eq('id', editingObjective.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('polo_objectives')
          .insert({
            user_id: userId,
            objective_type: data.objective_type,
            description: data.description || '',
            is_completed: data.is_completed,
          });
        if (error) throw error;
        setDialogOpen(false);
      }
      onUpdate();
    } catch (error) {
      console.error('Error saving objective:', error);
      toast.error(t('poloErrorSaving'));
    } finally {
      setSaving(false);
    }
  }, [editingObjective?.id, userId, onUpdate]);

  // Auto-save with debounce for text inputs
  useEffect(() => {
    if (!dialogOpen || !formData.description?.trim()) return;
    const timer = setTimeout(() => {
      saveData(formData);
    }, 800);
    return () => clearTimeout(timer);
  }, [formData.description]);

  const toggleComplete = async (objective: PoloObjective) => {
    try {
      const { error } = await supabase
        .from('polo_objectives')
        .update({ is_completed: !objective.is_completed })
        .eq('id', objective.id);
      if (error) throw error;
      onUpdate();
    } catch (error) {
      toast.error(t('poloObjectiveUpdateError'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('poloObjectiveDeleteConfirm'))) return;
    try {
      const { error } = await supabase.from('polo_objectives').delete().eq('id', id);
      if (error) throw error;
      toast.success(t('poloObjectiveDeleted'));
      onUpdate();
    } catch (error) {
      toast.error(t('poloObjectiveDeleteError'));
    }
  };

  // Close dialog and save if new entry
  const handleDialogClose = (open: boolean) => {
    if (!open && !editingObjective?.id && formData.description?.trim()) {
      saveData(formData);
    }
    setDialogOpen(open);
  };

  const ObjectiveItem = ({ objective }: { objective: PoloObjective }) => (
    <div className={`flex items-center justify-between p-2 rounded-lg transition-colors ${objective.is_completed ? 'bg-primary/10' : 'bg-card/50'}`}>
      <div className="flex items-center gap-3">
        {isEditable && (
          <Checkbox
            checked={objective.is_completed}
            onCheckedChange={() => toggleComplete(objective)}
          />
        )}
        {!isEditable && objective.is_completed && (
          <Check className="h-4 w-4 text-primary" />
        )}
        <span className={`${objective.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {objective.description}
        </span>
      </div>
      {isEditable && (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(objective)}>
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(objective.id!)}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Hidden document input */}
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleDocImport}
      />

      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Target className="h-5 w-5 text-primary" />
          🎯 {t('poloObjectiveMyObjectives')}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Season objectives */}
        <div className="space-y-3 p-4 bg-muted/20 rounded-lg border border-border/10">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-2 font-medium text-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              {t('poloObjectiveThisSeason')}
            </h4>
            {isEditable && (
              <Button variant="ghost" size="sm" onClick={() => openAddDialog('season')} className="text-primary">
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          {seasonObjectives.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">{t('poloObjectiveNoObjectives')}</p>
          ) : (
            <div className="space-y-2">
              {seasonObjectives.map((o) => (
                <ObjectiveItem key={o.id} objective={o} />
              ))}
            </div>
          )}
        </div>

        {/* Long term objectives */}
        <div className="space-y-3 p-4 bg-muted/20 rounded-lg border border-border/10">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-2 font-medium text-foreground">
              <Compass className="h-4 w-4 text-primary" />
              {t('poloObjectiveLongTerm')}
            </h4>
            {isEditable && (
              <Button variant="ghost" size="sm" onClick={() => openAddDialog('long_term')} className="text-primary">
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          {longTermObjectives.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">{t('poloObjectiveNoObjectives')}</p>
          ) : (
            <div className="space-y-2">
              {longTermObjectives.map((o) => (
                <ObjectiveItem key={o.id} objective={o} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              {editingObjective ? t('poloObjectiveEditObjective') : formData.objective_type === 'season' ? t('poloObjectiveSeasonObjective') : t('poloObjectiveLongTermObjective')}
              {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </DialogTitle>
            <DialogDescription>
              {t('poloObjectiveDefineYourObjectives')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="obj-desc">{t('poloObjectiveDescription')} *</Label>
              <Input
                id="obj-desc"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={formData.objective_type === 'season' 
                  ? t('poloObjectiveSeasonPlaceholder')
                  : t('poloObjectiveLongTermPlaceholder')}
              />
            </div>
            {editingObjective && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="completed"
                  checked={formData.is_completed}
                  onCheckedChange={(checked) => {
                    const newData = { ...formData, is_completed: !!checked };
                    setFormData(newData);
                    saveData(newData);
                  }}
                />
                <Label htmlFor="completed" className="cursor-pointer font-normal">{t('poloObjectiveAchieved')}</Label>
              </div>
            )}

            {/* IA Aurora + Import buttons */}
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAIGenerate}
                disabled={isGenerating}
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
                {t('aiAurora')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => docInputRef.current?.click()}
                disabled={isImportingDoc}
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                {isImportingDoc ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <FileText className="w-4 h-4 mr-1" />}
                {t('import')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PoloObjectives;