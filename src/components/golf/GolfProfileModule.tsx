import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import GolfPractice from './GolfPractice';
import GolfCourses from './GolfCourses';
import GolfAchievements from './GolfAchievements';
import GolfGallery from './GolfGallery';

interface GolfProfileModuleProps {
  userId: string;
  isEditable?: boolean;
}

export interface GolfProfile {
  id?: string;
  user_id: string;
  level: string | null;
  handicap: string | null;
  years_experience: number | null;
  frequency: string | null;
  club_name: string | null;
  club_city: string | null;
}

export interface GolfCourse {
  id?: string;
  user_id: string;
  course_name: string;
  location: string | null;
  country: string | null;
  par: number | null;
  best_score: number | null;
  times_played: number | null;
  rating: string | null;
  description: string | null;
  is_favorite: boolean;
  display_order: number;
}

export interface GolfAchievement {
  id?: string;
  user_id: string;
  achievement_type: string | null;
  year: string | null;
  tournament_name: string | null;
  result: string | null;
  description: string | null;
  display_order: number;
}

export interface GolfGalleryPhoto {
  id?: string;
  user_id: string;
  image_url: string | null;
  caption: string | null;
  location: string | null;
  date: string | null;
  display_order: number;
}

const GolfProfileModule: React.FC<GolfProfileModuleProps> = ({ userId, isEditable = false }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<GolfProfile | null>(null);
  const [courses, setCourses] = useState<GolfCourse[]>([]);
  const [achievements, setAchievements] = useState<GolfAchievement[]>([]);
  const [gallery, setGallery] = useState<GolfGalleryPhoto[]>([]);

  useEffect(() => {
    loadAllData();
  }, [userId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [profileRes, coursesRes, achievementsRes, galleryRes] = await Promise.all([
        supabase.from('golf_profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('golf_courses').select('*').eq('user_id', userId).order('display_order'),
        supabase.from('golf_achievements').select('*').eq('user_id', userId).order('display_order'),
        supabase.from('golf_gallery').select('*').eq('user_id', userId).order('display_order'),
      ]);

      if (profileRes.data) setProfile(profileRes.data as GolfProfile);
      if (coursesRes.data) setCourses(coursesRes.data as GolfCourse[]);
      if (achievementsRes.data) setAchievements(achievementsRes.data as GolfAchievement[]);
      if (galleryRes.data) setGallery(galleryRes.data as GolfGalleryPhoto[]);
    } catch (error) {
      console.error('Error loading golf data:', error);
      toast.error(t('golfErrorLoadingData'));
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
            <span className="text-3xl">⛳</span>
            {t('golfMyPassion')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <GolfPractice
            userId={userId}
            profile={profile}
            isEditable={isEditable}
            onUpdate={loadAllData}
          />

          <GolfCourses
            userId={userId}
            courses={courses}
            isEditable={isEditable}
            onUpdate={loadAllData}
          />

          <GolfAchievements
            userId={userId}
            achievements={achievements}
            isEditable={isEditable}
            onUpdate={loadAllData}
          />

          <GolfGallery
            userId={userId}
            photos={gallery}
            isEditable={isEditable}
            onUpdate={loadAllData}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default GolfProfileModule;
