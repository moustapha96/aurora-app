import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Trophy, Medal, Star, Loader2, Sparkles, FileText } from 'lucide-react';
import { PoloAchievement } from './PoloProfileModule';

interface PoloAchievementsProps {
  userId: string;
  achievements: PoloAchievement[];
  isEditable: boolean;
  onUpdate: () => void;
}

const PoloAchievements: React.FC<PoloAchievementsProps> = ({ userId, achievements, isEditable, onUpdate }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<PoloAchievement | null>(null);
  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImportingDoc, setIsImportingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<PoloAchievement>>({
    achievement_type: 'tournament',
    year: '',
    tournament_name: '',
    result: '',
    role_performance: '',
    description: '',
    has_trophies: false,
    has_medals: false,
    has_qualifications: false,
    has_special_recognition: false,
  });

  const tournaments = achievements.filter(a => a.achievement_type === 'tournament');
  const prides = achievements.filter(a => a.achievement_type === 'pride');

  const openAddDialog = (type: 'tournament' | 'pride') => {
    setEditingAchievement(null);
    setFormData({
      achievement_type: type,
      year: '',
      tournament_name: '',
      result: '',
      role_performance: '',
      description: '',
      has_trophies: false,
      has_medals: false,
      has_qualifications: false,
      has_special_recognition: false,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (achievement: PoloAchievement) => {
    setEditingAchievement(achievement);
    setFormData({
      achievement_type: achievement.achievement_type,
      year: achievement.year,
      tournament_name: achievement.tournament_name,
      result: achievement.result,
      role_performance: achievement.role_performance,
      description: achievement.description,
      has_trophies: achievement.has_trophies,
      has_medals: achievement.has_medals,
      has_qualifications: achievement.has_qualifications,
      has_special_recognition: achievement.has_special_recognition,
    });
    setDialogOpen(true);
  };

  const handleAIGenerate = async () => {
    const context = formData.tournament_name || formData.description || '';
    if (!context) {
      toast.error("Veuillez d'abord saisir un nom de tournoi ou une description");
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('personal-ai-suggest', {
        body: { moduleType: 'sports', context: `Polo achievement: ${context}` }
      });
      if (error) throw error;
      if (data?.suggestion) {
        if (formData.achievement_type === 'pride') {
          setFormData(prev => ({ ...prev, description: data.suggestion }));
        } else {
          setFormData(prev => ({ ...prev, role_performance: data.suggestion }));
        }
        toast.success("Suggestion générée");
      }
    } catch {
      toast.error("Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDocImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Fichier trop volumineux (max 10MB)");
      return;
    }

    setIsImportingDoc(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const fileExt = file.name.split('.').pop();
      const fileName = `polo-achievement-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('personal-content')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;
      toast.success("Document importé avec succès");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'import du document");
    } finally {
      setIsImportingDoc(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  // Auto-save function
  const saveData = useCallback(async (data: Partial<PoloAchievement>) => {
    // Validate required fields
    if (data.achievement_type === 'tournament' && !data.tournament_name?.trim()) return;
    if (data.achievement_type === 'pride' && !data.description?.trim()) return;
    
    setSaving(true);
    try {
      if (editingAchievement?.id) {
        const { error } = await supabase
          .from('polo_achievements')
          .update(data)
          .eq('id', editingAchievement.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('polo_achievements')
          .insert({
            user_id: userId,
            ...data,
            display_order: achievements.length,
          });
        if (error) throw error;
        setDialogOpen(false);
      }
      onUpdate();
    } catch (error) {
      console.error('Error saving achievement:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }, [editingAchievement?.id, userId, achievements.length, onUpdate]);

  // Auto-save with debounce for text inputs
  useEffect(() => {
    if (!dialogOpen) return;
    const hasContent = formData.achievement_type === 'tournament' 
      ? formData.tournament_name?.trim() 
      : formData.description?.trim();
    if (!hasContent) return;
    
    const timer = setTimeout(() => {
      saveData(formData);
    }, 800);
    return () => clearTimeout(timer);
  }, [formData.year, formData.tournament_name, formData.result, formData.role_performance, formData.description]);

  // Immediate save for checkboxes
  const handleCheckboxChange = (field: keyof PoloAchievement, checked: boolean) => {
    const newData = { ...formData, [field]: checked };
    setFormData(newData);
    if (editingAchievement?.id) {
      saveData(newData);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette réussite ?')) return;
    try {
      const { error } = await supabase.from('polo_achievements').delete().eq('id', id);
      if (error) throw error;
      toast.success('Réussite supprimée');
      onUpdate();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Close dialog and save if new entry
  const handleDialogClose = (open: boolean) => {
    if (!open && !editingAchievement?.id) {
      const hasContent = formData.achievement_type === 'tournament' 
        ? formData.tournament_name?.trim() 
        : formData.description?.trim();
      if (hasContent) {
        saveData(formData);
      }
    }
    setDialogOpen(open);
  };

  // Count rewards
  const hasAnyTrophies = achievements.some(a => a.has_trophies);
  const hasAnyMedals = achievements.some(a => a.has_medals);
  const hasAnyQualifications = achievements.some(a => a.has_qualifications);
  const hasAnySpecial = achievements.some(a => a.has_special_recognition);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Trophy className="h-5 w-5 text-amber-500" />
          🏆 MES RÉUSSITES
        </h3>
      </div>

      <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
        {/* Tournaments */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Tournois mémorables</h4>
            {isEditable && (
              <Button variant="ghost" size="sm" onClick={() => openAddDialog('tournament')} className="text-primary">
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            )}
          </div>
          {tournaments.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Aucun tournoi enregistré</p>
          ) : (
            <div className="space-y-2">
              {tournaments.map((t, index) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/10">
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        {t.year && <span className="text-sm text-muted-foreground">{t.year}</span>}
                        <span className="font-medium text-foreground">{t.tournament_name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t.result && <span className="text-primary font-medium">{t.result}</span>}
                        {t.role_performance && <span> - {t.role_performance}</span>}
                      </div>
                    </div>
                  </div>
                  {isEditable && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(t)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id!)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rewards badges */}
        <div className="space-y-2">
          <h4 className="font-medium text-foreground">Récompenses</h4>
          <div className="flex flex-wrap gap-2">
            {hasAnyTrophies && (
              <span className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full text-sm">
                <Trophy className="h-4 w-4" /> Trophées
              </span>
            )}
            {hasAnyMedals && (
              <span className="flex items-center gap-1 px-3 py-1.5 bg-gray-400/20 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                <Medal className="h-4 w-4" /> Médailles
              </span>
            )}
            {hasAnyQualifications && (
              <span className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                <Star className="h-4 w-4" /> Qualifications
              </span>
            )}
            {hasAnySpecial && (
              <span className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 text-purple-700 dark:text-purple-400 rounded-full text-sm">
                <Star className="h-4 w-4" /> Reconnaissances spéciales
              </span>
            )}
            {!hasAnyTrophies && !hasAnyMedals && !hasAnyQualifications && !hasAnySpecial && (
              <span className="text-sm text-muted-foreground italic">Aucune récompense enregistrée</span>
            )}
          </div>
        </div>

        {/* Greatest prides */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Mes plus grandes fiertés</h4>
            {isEditable && (
              <Button variant="ghost" size="sm" onClick={() => openAddDialog('pride')} className="text-primary">
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            )}
          </div>
          {prides.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Aucune fierté enregistrée</p>
          ) : (
            <ul className="space-y-2">
              {prides.map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <div className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span className="text-foreground">{p.description}</span>
                  </div>
                  {isEditable && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(p)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id!)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Hidden document input */}
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleDocImport}
      />

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              {editingAchievement ? 'Modifier la réussite' : formData.achievement_type === 'tournament' ? 'Ajouter un tournoi' : 'Ajouter une fierté'}
              {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </DialogTitle>
            <DialogDescription>
              {formData.achievement_type === 'tournament' 
                ? 'Enregistrez vos performances en tournoi' 
                : 'Partagez vos plus grandes fiertés'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {formData.achievement_type === 'tournament' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Année</Label>
                    <Input
                      id="year"
                      value={formData.year || ''}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      placeholder="2024"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="result">Résultat</Label>
                    <Input
                      id="result"
                      value={formData.result || ''}
                      onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                      placeholder="1ère place"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tournament">Nom du tournoi *</Label>
                  <Input
                    id="tournament"
                    value={formData.tournament_name || ''}
                    onChange={(e) => setFormData({ ...formData, tournament_name: e.target.value })}
                    placeholder="Nom du tournoi"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle/Performance</Label>
                  <Input
                    id="role"
                    value={formData.role_performance || ''}
                    onChange={(e) => setFormData({ ...formData, role_performance: e.target.value })}
                    placeholder="Ex: But victorieux en finale"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Récompenses obtenues</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="trophies"
                        checked={formData.has_trophies}
                        onCheckedChange={(checked) => handleCheckboxChange('has_trophies', !!checked)}
                      />
                      <Label htmlFor="trophies" className="cursor-pointer font-normal">Trophées</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="medals"
                        checked={formData.has_medals}
                        onCheckedChange={(checked) => handleCheckboxChange('has_medals', !!checked)}
                      />
                      <Label htmlFor="medals" className="cursor-pointer font-normal">Médailles</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="qualif"
                        checked={formData.has_qualifications}
                        onCheckedChange={(checked) => handleCheckboxChange('has_qualifications', !!checked)}
                      />
                      <Label htmlFor="qualif" className="cursor-pointer font-normal">Qualifications</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="special"
                        checked={formData.has_special_recognition}
                        onCheckedChange={(checked) => handleCheckboxChange('has_special_recognition', !!checked)}
                      />
                      <Label htmlFor="special" className="cursor-pointer font-normal">Reconnaissances</Label>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="pride-desc">Description de votre fierté *</Label>
                <Textarea
                  id="pride-desc"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Avoir marqué le but victorieux en finale"
                  rows={3}
                />
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
                IA Aurora
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => docInputRef.current?.click()}
                disabled={isImportingDoc}
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                {isImportingDoc ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <FileText className="w-4 h-4 mr-1" />}
                Importer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PoloAchievements;
