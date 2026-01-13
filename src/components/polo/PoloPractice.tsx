import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Activity, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PoloProfile } from './PoloProfileModule';

interface PoloPracticeProps {
  userId: string;
  profile: PoloProfile | null;
  isEditable: boolean;
  onUpdate: () => void;
}

const LEVELS = [
  { value: 'debutant' },
  { value: 'intermediaire' },
  { value: 'avance' },
  { value: 'professionnel' },
];

const POSITIONS = [
  { value: 'attaquant' },
  { value: 'milieu_offensif' },
  { value: 'milieu_capitaine' },
  { value: 'defenseur' },
];

const FREQUENCIES = [
  { value: 'occasionnelle' },
  { value: 'reguliere' },
  { value: 'intensive' },
  { value: 'competition' },
];

const PoloPractice: React.FC<PoloPracticeProps> = ({ userId, profile, isEditable, onUpdate }) => {
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<PoloProfile>>({
    level: profile?.level || null,
    handicap: profile?.handicap || null,
    preferred_position: profile?.preferred_position || null,
    frequency: profile?.frequency || null,
    years_experience: profile?.years_experience || null,
    club_name: profile?.club_name || null,
    club_city: profile?.club_city || null,
  });

  // Sync formData with profile when profile changes
  useEffect(() => {
    setFormData({
      level: profile?.level || null,
      handicap: profile?.handicap || null,
      preferred_position: profile?.preferred_position || null,
      frequency: profile?.frequency || null,
      years_experience: profile?.years_experience || null,
      club_name: profile?.club_name || null,
      club_city: profile?.club_city || null,
    });
  }, [profile]);

  // Debounced auto-save
  const saveData = useCallback(async (data: Partial<PoloProfile>) => {
    setSaving(true);
    try {
      if (profile?.id) {
        const { error } = await supabase
          .from('polo_profiles')
          .update(data)
          .eq('id', profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('polo_profiles')
          .insert({ user_id: userId, ...data });
        if (error) throw error;
      }
      onUpdate();
    } catch (error) {
      console.error('Error saving practice:', error);
      toast.error(t('poloErrorSaving'));
    } finally {
      setSaving(false);
    }
  }, [profile?.id, userId, onUpdate]);

  // Auto-save with debounce for text inputs
  useEffect(() => {
    if (!isEditable) return;
    const timer = setTimeout(() => {
      // Only save if there's data to save
      if (formData.handicap !== profile?.handicap || 
          formData.years_experience !== profile?.years_experience ||
          formData.club_name !== profile?.club_name ||
          formData.club_city !== profile?.club_city) {
        saveData(formData);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [formData.handicap, formData.years_experience, formData.club_name, formData.club_city]);

  const handleRadioChange = (field: keyof PoloProfile, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    saveData(newData);
  };

  const getLevelLabel = (value: string | null) => {
    if (!value) return t('poloNotDefined');
    return t(`poloLevel_${value}`);
  };
  const getPositionLabel = (value: string | null) => {
    if (!value) return t('poloNotDefinedF');
    return t(`poloPosition_${value}`);
  };
  const getFrequencyLabel = (value: string | null) => {
    if (!value) return t('poloNotDefinedF');
    return t(`poloFrequency_${value}`);
  };

  if (!isEditable) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Activity className="h-5 w-5" />
            📊 {t('poloMyPractice')}
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg">
          <div>
            <span className="text-xs text-muted-foreground">{t('poloLevel')}</span>
            <p className="font-medium text-foreground">{getLevelLabel(profile?.level || null)}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">{t('poloHandicap')}</span>
            <p className="font-medium text-foreground">{profile?.handicap || t('poloNotProvided')}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">{t('poloPosition')}</span>
            <p className="font-medium text-foreground">{getPositionLabel(profile?.preferred_position || null)}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">{t('poloFrequency')}</span>
            <p className="font-medium text-foreground">{getFrequencyLabel(profile?.frequency || null)}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">{t('poloExperience')}</span>
            <p className="font-medium text-foreground">
              {profile?.years_experience ? `${profile.years_experience} ${t('poloYears')}` : t('poloNotProvidedF')}
            </p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">{t('poloClub')}</span>
            <p className="font-medium text-foreground">
              {profile?.club_name ? `${profile.club_name}${profile.club_city ? `, ${profile.club_city}` : ''}` : t('poloNotProvided')}
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
          📊 {t('poloMyPractice')}
        </h3>
        {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      <div className="space-y-6 p-4 bg-muted/30 rounded-lg border border-border/20">
        <div className="space-y-3">
          <Label className="text-foreground font-medium">{t('poloLevel')}</Label>
          <RadioGroup
            value={formData.level || ''}
            onValueChange={(value) => handleRadioChange('level', value)}
            className="flex flex-wrap gap-4"
          >
            {LEVELS.map((level) => (
              <div key={level.value} className="flex items-center space-x-2">
                <RadioGroupItem value={level.value} id={`level-${level.value}`} />
                <Label htmlFor={`level-${level.value}`} className="cursor-pointer">{t(`poloLevel_${level.value}`)}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="handicap" className="text-foreground">{t('poloHandicap')}</Label>
            <Input
              id="handicap"
              placeholder={t('poloHandicapPlaceholder')}
              value={formData.handicap || ''}
              onChange={(e) => setFormData({ ...formData, handicap: e.target.value })}
              className="border-border/30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="years" className="text-foreground">{t('poloYearsExperience')}</Label>
            <Input
              id="years"
              type="number"
              placeholder={t('poloYearsNumberPlaceholder')}
              value={formData.years_experience || ''}
              onChange={(e) => setFormData({ ...formData, years_experience: parseInt(e.target.value) || null })}
              className="border-border/30"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-foreground font-medium">{t('poloPreferredPosition')}</Label>
          <RadioGroup
            value={formData.preferred_position || ''}
            onValueChange={(value) => handleRadioChange('preferred_position', value)}
            className="grid grid-cols-2 gap-2"
          >
            {POSITIONS.map((pos) => (
              <div key={pos.value} className="flex items-center space-x-2">
                <RadioGroupItem value={pos.value} id={`pos-${pos.value}`} />
                <Label htmlFor={`pos-${pos.value}`} className="cursor-pointer text-sm">{t(`poloPosition_${pos.value}`)}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label className="text-foreground font-medium">{t('poloFrequency')}</Label>
          <RadioGroup
            value={formData.frequency || ''}
            onValueChange={(value) => handleRadioChange('frequency', value)}
            className="flex flex-wrap gap-4"
          >
            {FREQUENCIES.map((freq) => (
              <div key={freq.value} className="flex items-center space-x-2">
                <RadioGroupItem value={freq.value} id={`freq-${freq.value}`} />
                <Label htmlFor={`freq-${freq.value}`} className="cursor-pointer">{t(`poloFrequency_${freq.value}`)}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="club" className="text-foreground">{t('poloClubTeam')}</Label>
            <Input
              id="club"
              placeholder={t('poloClubNamePlaceholder')}
              value={formData.club_name || ''}
              onChange={(e) => setFormData({ ...formData, club_name: e.target.value })}
              className="border-border/30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city" className="text-foreground">{t('poloCity')}</Label>
            <Input
              id="city"
              placeholder={t('poloCity')}
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

export default PoloPractice;