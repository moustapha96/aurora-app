import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Trophy, Loader2, Sparkles, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { GolfAchievement } from './GolfProfileModule';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GolfAchievementsProps {
  userId: string;
  achievements: GolfAchievement[];
  isEditable: boolean;
  onUpdate: () => void;
}

const GolfAchievements: React.FC<GolfAchievementsProps> = ({ 
  userId, 
  achievements, 
  isEditable, 
  onUpdate 
}) => {
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);

  const ACHIEVEMENT_TYPES = [
    { value: 'tournament', label: t('golfAchievementType_tournament') },
    { value: 'personal', label: t('golfAchievementType_personal') },
    { value: 'hole_in_one', label: t('golfAchievementType_hole_in_one') },
    { value: 'albatross', label: t('golfAchievementType_albatross') },
    { value: 'eagle', label: t('golfAchievementType_eagle') },
    { value: 'handicap', label: t('golfAchievementType_handicap') },
    { value: 'other', label: t('other') },
  ];
  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImportingDoc, setIsImportingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [editingAchievement, setEditingAchievement] = useState<GolfAchievement | null>(null);
  const [formData, setFormData] = useState<Partial<GolfAchievement>>({
    achievement_type: 'tournament',
    year: '',
    tournament_name: '',
    result: '',
    description: '',
  });

  const resetForm = () => {
    setFormData({
      achievement_type: 'tournament',
      year: '',
      tournament_name: '',
      result: '',
      description: '',
    });
    setEditingAchievement(null);
  };

  const openEditDialog = (achievement: GolfAchievement) => {
    setEditingAchievement(achievement);
    setFormData({
      achievement_type: achievement.achievement_type,
      year: achievement.year,
      tournament_name: achievement.tournament_name,
      result: achievement.result,
      description: achievement.description,
    });
    setDialogOpen(true);
  };

  const handleAIGenerate = async () => {
    const context = formData.tournament_name || formData.description || '';
    if (!context) {
      toast.error(t('golfAchievementPleaseEnterEventOrDescription'));
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('personal-ai-suggest', {
        body: { moduleType: 'sports', context: `Golf achievement: ${context}` }
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
      const fileName = `golf-achievement-${user.id}-${Date.now()}.${fileExt}`;
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

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (editingAchievement?.id) {
        const { error } = await supabase
          .from('golf_achievements')
          .update(formData)
          .eq('id', editingAchievement.id);
        if (error) throw error;
        toast.success(t('golfAchievementUpdated'));
      } else {
        const { error } = await supabase
          .from('golf_achievements')
          .insert({
            user_id: userId,
            ...formData,
            display_order: achievements.length,
          });
        if (error) throw error;
        toast.success(t('golfAchievementAdded'));
      }
      onUpdate();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving achievement:', error);
      toast.error(t('poloErrorSaving'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('golfAchievementDeleteConfirm'))) return;
    
    try {
      const { error } = await supabase
        .from('golf_achievements')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success(t('golfAchievementDeleted'));
      onUpdate();
    } catch (error) {
      console.error('Error deleting achievement:', error);
      toast.error(t('golfAchievementDeleteError'));
    }
  };

  const getTypeLabel = (type: string | null) => {
    return ACHIEVEMENT_TYPES.find(t => t.value === type)?.label || type || t('other');
  };

  const getTypeIcon = (type: string | null) => {
    switch (type) {
      case 'hole_in_one':
        return '🎯';
      case 'albatross':
        return '🦅';
      case 'eagle':
        return '🦅';
      case 'tournament':
        return '🏆';
      case 'handicap':
        return '📉';
      default:
        return '⭐';
    }
  };

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
          <Trophy className="h-5 w-5" />
          🏆 {t('golfAchievementMyAchievements')}
        </h3>
        {isEditable && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                {t('add')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingAchievement ? t('golfAchievementEditAchievement') : t('golfAchievementAddAchievement')}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{t('golfAchievementType')}</Label>
                  <Select
                    value={formData.achievement_type || 'tournament'}
                    onValueChange={(value) => setFormData({ ...formData, achievement_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACHIEVEMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="achievement-year">{t('poloAchievementYear')}</Label>
                    <Input
                      id="achievement-year"
                      placeholder="2024"
                      value={formData.year || ''}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="achievement-result">{t('poloAchievementResult')}</Label>
                    <Input
                      id="achievement-result"
                      placeholder={t('golfAchievementResultPlaceholder')}
                      value={formData.result || ''}
                      onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="achievement-name">{t('golfAchievementEventName')}</Label>
                  <Input
                    id="achievement-name"
                    placeholder={t('golfAchievementEventNamePlaceholder')}
                    value={formData.tournament_name || ''}
                    onChange={(e) => setFormData({ ...formData, tournament_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="achievement-description">{t('description')}</Label>
                  <Textarea
                    id="achievement-description"
                    placeholder={t('golfAchievementDescriptionPlaceholder')}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

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

                <Button 
                  onClick={handleSubmit} 
                  disabled={saving} 
                  className="w-full"
                >
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingAchievement ? t('update') : t('add')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {achievements.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t('golfAchievementNoAchievements')}</p>
          {isEditable && (
            <p className="text-sm mt-2">
              {t('golfAchievementAddTrophies')}
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {achievements.map((achievement) => (
            <Card key={achievement.id} className="border-border/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getTypeIcon(achievement.achievement_type)}</span>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {getTypeLabel(achievement.achievement_type)}
                          {achievement.year && ` • ${achievement.year}`}
                        </p>
                        {achievement.tournament_name && (
                          <h4 className="font-semibold text-foreground">
                            {achievement.tournament_name}
                          </h4>
                        )}
                        {achievement.result && (
                          <p className="text-primary font-medium">{achievement.result}</p>
                        )}
                      </div>
                    </div>
                    {achievement.description && (
                      <p className="text-sm text-muted-foreground mt-2 ml-8">
                        {achievement.description}
                      </p>
                    )}
                  </div>
                  {isEditable && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(achievement)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(achievement.id!)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GolfAchievements;