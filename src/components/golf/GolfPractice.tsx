import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Activity, Loader2 } from 'lucide-react';
import { GolfProfile } from './GolfProfileModule';

interface GolfPracticeProps {
  userId: string;
  profile: GolfProfile | null;
  isEditable: boolean;
  onUpdate: () => void;
}

const LEVELS = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
  { value: 'professionnel', label: 'Professionnel' },
];

const FREQUENCIES = [
  { value: 'occasionnelle', label: 'Occasionnelle (1-2x/mois)' },
  { value: 'reguliere', label: 'Régulière (1x/semaine)' },
  { value: 'intensive', label: 'Intensive (2-3x/semaine)' },
  { value: 'competition', label: 'Compétition' },
];

const GolfPractice: React.FC<GolfPracticeProps> = ({ userId, profile, isEditable, onUpdate }) => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<GolfProfile>>({
    level: profile?.level || null,
    handicap: profile?.handicap || null,
    frequency: profile?.frequency || null,
    years_experience: profile?.years_experience || null,
    club_name: profile?.club_name || null,
    club_city: profile?.club_city || null,
  });

  useEffect(() => {
    setFormData({
      level: profile?.level || null,
      handicap: profile?.handicap || null,
      frequency: profile?.frequency || null,
      years_experience: profile?.years_experience || null,
      club_name: profile?.club_name || null,
      club_city: profile?.club_city || null,
    });
  }, [profile]);

  const saveData = useCallback(async (data: Partial<GolfProfile>) => {
    setSaving(true);
    try {
      if (profile?.id) {
        const { error } = await supabase
          .from('golf_profiles')
          .update(data)
          .eq('id', profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('golf_profiles')
          .insert({ user_id: userId, ...data });
        if (error) throw error;
      }
      onUpdate();
    } catch (error) {
      console.error('Error saving practice:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }, [profile?.id, userId, onUpdate]);

  useEffect(() => {
    if (!isEditable) return;
    const timer = setTimeout(() => {
      if (formData.handicap !== profile?.handicap || 
          formData.years_experience !== profile?.years_experience ||
          formData.club_name !== profile?.club_name ||
          formData.club_city !== profile?.club_city) {
        saveData(formData);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [formData.handicap, formData.years_experience, formData.club_name, formData.club_city]);

  const handleRadioChange = (field: keyof GolfProfile, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    saveData(newData);
  };

  const getLevelLabel = (value: string | null) => LEVELS.find(l => l.value === value)?.label || 'Non défini';
  const getFrequencyLabel = (value: string | null) => FREQUENCIES.find(f => f.value === value)?.label || 'Non définie';

  if (!isEditable) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Activity className="h-5 w-5" />
            📊 MA PRATIQUE
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg">
          <div>
            <span className="text-xs text-muted-foreground">Niveau</span>
            <p className="font-medium text-foreground">{getLevelLabel(profile?.level || null)}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Handicap</span>
            <p className="font-medium text-foreground">{profile?.handicap || 'Non renseigné'}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Fréquence</span>
            <p className="font-medium text-foreground">{getFrequencyLabel(profile?.frequency || null)}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Expérience</span>
            <p className="font-medium text-foreground">
              {profile?.years_experience ? `${profile.years_experience} ans` : 'Non renseignée'}
            </p>
          </div>
          <div className="col-span-2">
            <span className="text-xs text-muted-foreground">Club</span>
            <p className="font-medium text-foreground">
              {profile?.club_name ? `${profile.club_name}${profile.club_city ? `, ${profile.club_city}` : ''}` : 'Non renseigné'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Activity className="h-5 w-5" />
          📊 MA PRATIQUE
        </h3>
        {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      <div className="space-y-6 p-4 bg-muted/30 rounded-lg border border-border/20">
        <div className="space-y-3">
          <Label className="text-foreground font-medium">Niveau</Label>
          <RadioGroup
            value={formData.level || ''}
            onValueChange={(value) => handleRadioChange('level', value)}
            className="flex flex-wrap gap-4"
          >
            {LEVELS.map((level) => (
              <div key={level.value} className="flex items-center space-x-2">
                <RadioGroupItem value={level.value} id={`golf-level-${level.value}`} />
                <Label htmlFor={`golf-level-${level.value}`} className="cursor-pointer">{level.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="golf-handicap" className="text-foreground">Handicap</Label>
            <Input
              id="golf-handicap"
              placeholder="Entrez votre handicap (ex: 18.5)"
              value={formData.handicap || ''}
              onChange={(e) => setFormData({ ...formData, handicap: e.target.value })}
              className="border-border/30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="golf-years" className="text-foreground">Années d'expérience</Label>
            <Input
              id="golf-years"
              type="number"
              placeholder="Nombre d'années"
              value={formData.years_experience || ''}
              onChange={(e) => setFormData({ ...formData, years_experience: parseInt(e.target.value) || null })}
              className="border-border/30"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-foreground font-medium">Fréquence</Label>
          <RadioGroup
            value={formData.frequency || ''}
            onValueChange={(value) => handleRadioChange('frequency', value)}
            className="flex flex-wrap gap-4"
          >
            {FREQUENCIES.map((freq) => (
              <div key={freq.value} className="flex items-center space-x-2">
                <RadioGroupItem value={freq.value} id={`golf-freq-${freq.value}`} />
                <Label htmlFor={`golf-freq-${freq.value}`} className="cursor-pointer">{freq.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="golf-club" className="text-foreground">Club</Label>
            <Input
              id="golf-club"
              placeholder="Nom du club"
              value={formData.club_name || ''}
              onChange={(e) => setFormData({ ...formData, club_name: e.target.value })}
              className="border-border/30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="golf-city" className="text-foreground">Ville</Label>
            <Input
              id="golf-city"
              placeholder="Ville"
              value={formData.club_city || ''}
              onChange={(e) => setFormData({ ...formData, club_city: e.target.value })}
              className="border-border/30"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GolfPractice;
