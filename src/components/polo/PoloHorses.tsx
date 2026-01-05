import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Heart, Star, Loader2, Sparkles, FileText } from 'lucide-react';
import { PoloHorse } from './PoloProfileModule';

interface PoloHorsesProps {
  userId: string;
  horses: PoloHorse[];
  isEditable: boolean;
  onUpdate: () => void;
}

const PoloHorses: React.FC<PoloHorsesProps> = ({ userId, horses, isEditable, onUpdate }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHorse, setEditingHorse] = useState<PoloHorse | null>(null);
  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImportingDoc, setIsImportingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<PoloHorse>>({
    name: '',
    age: null,
    breed: '',
    together_since: '',
    is_primary: false,
    is_own_horse: false,
    exclusive_rider: false,
    tournament_wins: false,
    in_training: false,
  });

  const openAddDialog = () => {
    setEditingHorse(null);
    setFormData({
      name: '',
      age: null,
      breed: '',
      together_since: '',
      is_primary: horses.length === 0,
      is_own_horse: false,
      exclusive_rider: false,
      tournament_wins: false,
      in_training: false,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (horse: PoloHorse) => {
    setEditingHorse(horse);
    setFormData({
      name: horse.name,
      age: horse.age,
      breed: horse.breed,
      together_since: horse.together_since,
      is_primary: horse.is_primary,
      is_own_horse: horse.is_own_horse,
      exclusive_rider: horse.exclusive_rider,
      tournament_wins: horse.tournament_wins,
      in_training: horse.in_training,
    });
    setDialogOpen(true);
  };

  const handleAIGenerate = async () => {
    if (!formData.name) {
      toast.error("Veuillez d'abord saisir un nom de cheval");
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('personal-ai-suggest', {
        body: { moduleType: 'sports', context: `Polo horse: ${formData.name} ${formData.breed || ''}` }
      });
      if (error) throw error;
      if (data?.suggestion) {
        toast.success("Suggestion générée - utilisez-la pour enrichir les détails");
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
      const fileName = `polo-horse-${user.id}-${Date.now()}.${fileExt}`;
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
  const saveData = useCallback(async (data: Partial<PoloHorse>) => {
    if (!data.name?.trim()) return; // Don't save without a name
    
    setSaving(true);
    try {
      if (editingHorse?.id) {
        const { error } = await supabase
          .from('polo_horses')
          .update(data)
          .eq('id', editingHorse.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('polo_horses')
          .insert({
            user_id: userId,
            name: data.name || '',
            age: data.age,
            breed: data.breed,
            together_since: data.together_since,
            is_primary: data.is_primary,
            is_own_horse: data.is_own_horse,
            exclusive_rider: data.exclusive_rider,
            tournament_wins: data.tournament_wins,
            in_training: data.in_training,
          });
        if (error) throw error;
        setDialogOpen(false);
      }
      onUpdate();
    } catch (error) {
      console.error('Error saving horse:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }, [editingHorse?.id, userId, onUpdate]);

  // Auto-save with debounce for text inputs
  useEffect(() => {
    if (!dialogOpen || !formData.name?.trim()) return;
    const timer = setTimeout(() => {
      saveData(formData);
    }, 800);
    return () => clearTimeout(timer);
  }, [formData.name, formData.age, formData.breed, formData.together_since]);

  // Immediate save for checkboxes
  const handleCheckboxChange = (field: keyof PoloHorse, checked: boolean) => {
    const newData = { ...formData, [field]: checked };
    setFormData(newData);
    if (editingHorse?.id && formData.name?.trim()) {
      saveData(newData);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce cheval ?')) return;
    try {
      const { error } = await supabase.from('polo_horses').delete().eq('id', id);
      if (error) throw error;
      toast.success('Cheval supprimé');
      onUpdate();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Close dialog and save if new entry
  const handleDialogClose = (open: boolean) => {
    if (!open && !editingHorse?.id && formData.name?.trim()) {
      saveData(formData);
    }
    setDialogOpen(open);
  };

  const primaryHorse = horses.find(h => h.is_primary);
  const otherHorses = horses.filter(h => !h.is_primary);

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
          <Heart className="h-5 w-5 text-primary" />
          🤝 MES PARTENAIRES ÉQUINS
        </h3>
        {isEditable && (
          <Button variant="outline" size="sm" onClick={openAddDialog} className="border-primary/30 text-primary">
            <Plus className="h-4 w-4 mr-1" />
            Ajouter un cheval
          </Button>
        )}
      </div>

      {horses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
          <p>Aucun partenaire équin enregistré</p>
          {isEditable && (
            <Button variant="link" onClick={openAddDialog} className="text-primary">
              Ajouter votre premier cheval
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {primaryHorse && (
            <div className="p-4 bg-gradient-to-r from-primary/10 to-muted/10 rounded-lg border border-primary/20">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-medium text-primary">Mon cheval principal</span>
                  </div>
                  <h4 className="text-xl font-serif text-foreground">{primaryHorse.name}</h4>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    {primaryHorse.age && <p><span className="text-muted-foreground">Âge :</span> {primaryHorse.age} ans</p>}
                    {primaryHorse.breed && <p><span className="text-muted-foreground">Race :</span> {primaryHorse.breed}</p>}
                    {primaryHorse.together_since && <p><span className="text-muted-foreground">Ensemble depuis :</span> {primaryHorse.together_since}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {primaryHorse.is_own_horse && <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">Mon propre cheval</span>}
                    {primaryHorse.exclusive_rider && <span className="text-xs px-2 py-1 bg-muted/40 text-foreground rounded-full">Je le monte exclusivement</span>}
                    {primaryHorse.tournament_wins && <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-700 rounded-full">Victoires en tournoi</span>}
                    {primaryHorse.in_training && <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-700 rounded-full">En formation</span>}
                  </div>
                </div>
                {isEditable && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(primaryHorse)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(primaryHorse.id!)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {otherHorses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {otherHorses.map((horse) => (
                <div key={horse.id} className="p-3 bg-muted/20 rounded-lg border border-border/10">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">{horse.name}</h4>
                      <div className="text-sm text-muted-foreground mt-1">
                        {horse.breed && <span>{horse.breed}</span>}
                        {horse.age && <span> • {horse.age} ans</span>}
                      </div>
                    </div>
                    {isEditable && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(horse)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(horse.id!)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              {editingHorse ? 'Modifier le cheval' : 'Ajouter un cheval'}
              {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations de votre partenaire équin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="horse-name">Nom *</Label>
              <Input
                id="horse-name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nom du cheval"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="horse-age">Âge</Label>
                <Input
                  id="horse-age"
                  type="number"
                  value={formData.age || ''}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || null })}
                  placeholder="Âge en années"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horse-breed">Race</Label>
                <Input
                  id="horse-breed"
                  value={formData.breed || ''}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  placeholder="Race du cheval"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="horse-since">Ensemble depuis</Label>
              <Input
                id="horse-since"
                value={formData.together_since || ''}
                onChange={(e) => setFormData({ ...formData, together_since: e.target.value })}
                placeholder="Ex: 2 ans, 6 mois"
              />
            </div>
            <div className="space-y-3">
              <Label>Relation particulière</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_primary"
                    checked={formData.is_primary}
                    onCheckedChange={(checked) => handleCheckboxChange('is_primary', !!checked)}
                  />
                  <Label htmlFor="is_primary" className="cursor-pointer font-normal">Cheval principal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_own"
                    checked={formData.is_own_horse}
                    onCheckedChange={(checked) => handleCheckboxChange('is_own_horse', !!checked)}
                  />
                  <Label htmlFor="is_own" className="cursor-pointer font-normal">C'est mon propre cheval</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="exclusive"
                    checked={formData.exclusive_rider}
                    onCheckedChange={(checked) => handleCheckboxChange('exclusive_rider', !!checked)}
                  />
                  <Label htmlFor="exclusive" className="cursor-pointer font-normal">Je le monte exclusivement</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="wins"
                    checked={formData.tournament_wins}
                    onCheckedChange={(checked) => handleCheckboxChange('tournament_wins', !!checked)}
                  />
                  <Label htmlFor="wins" className="cursor-pointer font-normal">Nous avons gagné des tournois ensemble</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="training"
                    checked={formData.in_training}
                    onCheckedChange={(checked) => handleCheckboxChange('in_training', !!checked)}
                  />
                  <Label htmlFor="training" className="cursor-pointer font-normal">Nous sommes en formation</Label>
                </div>
              </div>
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

export default PoloHorses;
