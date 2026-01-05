import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import PoloPractice from './PoloPractice';
import PoloHorses from './PoloHorses';
import PoloAchievements from './PoloAchievements';
import PoloObjectives from './PoloObjectives';
import PoloGallery from './PoloGallery';

interface PoloProfileModuleProps {
  userId: string;
  isEditable?: boolean;
}

export interface PoloProfile {
  id?: string;
  user_id: string;
  level: string | null;
  handicap: string | null;
  preferred_position: string | null;
  frequency: string | null;
  years_experience: number | null;
  club_name: string | null;
  club_city: string | null;
}

export interface PoloHorse {
  id?: string;
  user_id: string;
  name: string;
  age: number | null;
  breed: string | null;
  together_since: string | null;
  is_primary: boolean;
  is_own_horse: boolean;
  exclusive_rider: boolean;
  tournament_wins: boolean;
  in_training: boolean;
  display_order: number;
}

export interface PoloAchievement {
  id?: string;
  user_id: string;
  achievement_type: 'tournament' | 'pride';
  year: string | null;
  tournament_name: string | null;
  result: string | null;
  role_performance: string | null;
  description: string | null;
  has_trophies: boolean;
  has_medals: boolean;
  has_qualifications: boolean;
  has_special_recognition: boolean;
  display_order: number;
}

export interface PoloObjective {
  id?: string;
  user_id: string;
  objective_type: 'season' | 'long_term';
  description: string;
  is_completed: boolean;
  display_order: number;
}

export interface PoloGalleryItem {
  id?: string;
  user_id: string;
  slot_type: 'action' | 'horse_portrait' | 'complicity' | 'team' | 'trophy' | 'ambiance' | 'additional';
  image_url: string | null;
  caption: string | null;
  display_order: number;
}

const PoloProfileModule: React.FC<PoloProfileModuleProps> = ({ userId, isEditable = false }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PoloProfile | null>(null);
  const [horses, setHorses] = useState<PoloHorse[]>([]);
  const [achievements, setAchievements] = useState<PoloAchievement[]>([]);
  const [objectives, setObjectives] = useState<PoloObjective[]>([]);
  const [gallery, setGallery] = useState<PoloGalleryItem[]>([]);

  useEffect(() => {
    loadAllData();
  }, [userId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [profileRes, horsesRes, achievementsRes, objectivesRes, galleryRes] = await Promise.all([
        supabase.from('polo_profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('polo_horses').select('*').eq('user_id', userId).order('display_order'),
        supabase.from('polo_achievements').select('*').eq('user_id', userId).order('display_order'),
        supabase.from('polo_objectives').select('*').eq('user_id', userId).order('display_order'),
        supabase.from('polo_gallery').select('*').eq('user_id', userId).order('display_order'),
      ]);

      if (profileRes.data) setProfile(profileRes.data as PoloProfile);
      if (horsesRes.data) setHorses(horsesRes.data as PoloHorse[]);
      if (achievementsRes.data) setAchievements(achievementsRes.data as PoloAchievement[]);
      if (objectivesRes.data) setObjectives(objectivesRes.data as PoloObjective[]);
      if (galleryRes.data) setGallery(galleryRes.data as PoloGalleryItem[]);
    } catch (error) {
      console.error('Error loading polo data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/20 bg-gradient-to-br from-muted/10 to-background">
        <CardHeader className="border-b border-border/10">
          <CardTitle className="flex items-center gap-3 text-2xl font-serif text-primary">
            <span className="text-3xl">🏇</span>
            MA PASSION POLO
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <PoloPractice
            userId={userId}
            profile={profile}
            isEditable={isEditable}
            onUpdate={loadAllData}
          />

          <PoloHorses
            userId={userId}
            horses={horses}
            isEditable={isEditable}
            onUpdate={loadAllData}
          />

          <PoloAchievements
            userId={userId}
            achievements={achievements}
            isEditable={isEditable}
            onUpdate={loadAllData}
          />

          <PoloObjectives
            userId={userId}
            objectives={objectives}
            isEditable={isEditable}
            onUpdate={loadAllData}
          />

          <PoloGallery
            userId={userId}
            gallery={gallery}
            isEditable={isEditable}
            onUpdate={loadAllData}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PoloProfileModule;
