import React, { useState, useEffect, useCallback } from "react";
import { Dumbbell, ChevronDown, ChevronUp, GripVertical, Check, Plus, Edit2, Trash2 } from "lucide-react";
import { PersonalModule } from "./PersonalModule";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PoloProfileModule } from "@/components/polo";
import { GolfProfileModule } from "@/components/golf";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { SportsEditor } from "./editors/SportsEditor";

interface SportEntry {
  id: string;
  title: string;
  subtitle?: string;
  badge_text?: string;
  description: string;
  image_url?: string;
  sport_type?: string;
}

interface PersonalSportsProps {
  sports: SportEntry[];
  isEditable: boolean;
  onDataChange: () => void;
}

type CategoryType = 
  | 'custom' 
  | 'golf' 
  | 'polo' 
  | 'equitation' 
  | 'yachting' 
  | 'voile' 
  | 'ski' 
  | 'heliskiing' 
  | 'tennis'
  | 'football'
  | 'chasse' 
  | 'peche' 
  | 'aviation' 
  | 'automobile' 
  | 'art_martial'
  | 'escrime'
  | 'tir'
  | 'cricket'
  | 'croquet'
  | 'padel'
  | 'squash'
  | 'plongee'
  | 'kitesurf'
  | 'surf'
  | 'wakeboard'
  | 'jetski'
  | 'alpinisme'
  | 'randonnee'
  | 'vtt'
  | 'cyclisme'
  | 'triathlon'
  | 'marathon'
  | 'fitness'
  | 'yoga'
  | 'meditation'
  | 'fauconnerie'
  | 'collection_voitures'
  | 'course_automobile'
  | 'rallye'
  | 'karting';

interface SportOption {
  type: CategoryType;
}

const SPORT_OPTIONS: SportOption[] = [
  { type: 'custom' },
  { type: 'polo' },
  { type: 'equitation' },
  { type: 'chasse' },
  { type: 'fauconnerie' },
  { type: 'golf' },
  { type: 'yachting' },
  { type: 'voile' },
  { type: 'plongee' },
  { type: 'kitesurf' },
  { type: 'surf' },
  { type: 'wakeboard' },
  { type: 'jetski' },
  { type: 'peche' },
  { type: 'ski' },
  { type: 'heliskiing' },
  { type: 'alpinisme' },
  { type: 'randonnee' },
  { type: 'tennis' },
  { type: 'football' },
  { type: 'padel' },
  { type: 'squash' },
  { type: 'automobile' },
  { type: 'course_automobile' },
  { type: 'rallye' },
  { type: 'karting' },
  { type: 'collection_voitures' },
  { type: 'aviation' },
  { type: 'escrime' },
  { type: 'tir' },
  { type: 'art_martial' },
  { type: 'cricket' },
  { type: 'croquet' },
  { type: 'cyclisme' },
  { type: 'vtt' },
  { type: 'triathlon' },
  { type: 'marathon' },
  { type: 'fitness' },
  { type: 'yoga' },
  { type: 'meditation' },
];

export const PersonalSports = ({ sports, isEditable, onDataChange }: PersonalSportsProps) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [expandedSport, setExpandedSport] = useState<CategoryType | null>(null);
  const [customizedSports, setCustomizedSports] = useState<Set<CategoryType>>(new Set());
  const [sportsData, setSportsData] = useState<Map<string, SportEntry>>(new Map());
  const [sportOrder, setSportOrder] = useState<CategoryType[]>([]);
  const [draggedItem, setDraggedItem] = useState<CategoryType | null>(null);
  const [dragOverItem, setDragOverItem] = useState<CategoryType | null>(null);
  const [otherActivitiesOpen, setOtherActivitiesOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSport, setEditingSport] = useState<SportEntry | null>(null);
  const [editingSportType, setEditingSportType] = useState<CategoryType | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const loadData = useCallback(async (userId: string) => {
    await loadCustomizedSports(userId);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        await loadData(user.id);
      }
    };
    fetchUser();
  }, [loadData]);

  const loadCustomizedSports = async (userId: string) => {
    try {
      // Charger tous les sports de la base de données
      const [poloProfile, poloHorses, poloAchievements, golfProfile, golfCourses, golfAchievements, sportsResult] = await Promise.all([
        supabase.from('polo_profiles').select('level, handicap, club_name').eq('user_id', userId).maybeSingle(),
        supabase.from('polo_horses').select('id').eq('user_id', userId).limit(1),
        supabase.from('polo_achievements').select('id').eq('user_id', userId).limit(1),
        supabase.from('golf_profiles').select('level, handicap, club_name').eq('user_id', userId).maybeSingle(),
        supabase.from('golf_courses').select('id').eq('user_id', userId).limit(1),
        supabase.from('golf_achievements').select('id').eq('user_id', userId).limit(1),
        supabase.from('sports_hobbies').select('*').eq('user_id', userId).order('display_order'),
      ]);

      const customized = new Set<CategoryType>();
      const dataMap = new Map<string, SportEntry>();
      
      // Polo est customisé seulement si des données réelles existent
      const hasPoloData = poloProfile.data && (
        poloProfile.data.level || 
        poloProfile.data.handicap || 
        poloProfile.data.club_name ||
        (poloHorses.data && poloHorses.data.length > 0) ||
        (poloAchievements.data && poloAchievements.data.length > 0)
      );
      if (hasPoloData) {
        customized.add('polo');
      }
      
      // Golf est customisé seulement si des données réelles existent
      const hasGolfData = golfProfile.data && (
        golfProfile.data.level || 
        golfProfile.data.handicap || 
        golfProfile.data.club_name ||
        (golfCourses.data && golfCourses.data.length > 0) ||
        (golfAchievements.data && golfAchievements.data.length > 0)
      );
      if (hasGolfData) {
        customized.add('golf');
      }

      // Charger les sports depuis sports_hobbies
      if (sportsResult.data) {
        sportsResult.data.forEach((s: any) => {
          if (s.sport_type) {
            customized.add(s.sport_type as CategoryType);
            dataMap.set(s.sport_type, {
              id: s.id,
              title: s.title,
              subtitle: s.subtitle,
              badge_text: s.badge_text,
              description: s.description,
              image_url: s.image_url,
              sport_type: s.sport_type
            });
          }
        });
      }

      setSportsData(dataMap);
      setCustomizedSports(customized);

      const customizedList = Array.from(customized);
      const nonCustomized = SPORT_OPTIONS.filter(s => !customized.has(s.type)).map(s => s.type);
      setSportOrder([...customizedList, ...nonCustomized]);
    } catch (error) {
      console.error('Error loading customized sports:', error);
    }
  };

  // Activer un sport (le créer en base avec des valeurs par défaut)
  const handleActivateSport = async (sportType: CategoryType) => {
    if (!currentUserId) return;
    
    try {
      const defaultTitle = getSportLabel(sportType);
      const defaultDescription = getSportDescription(sportType);
      
      const { data, error } = await supabase
        .from('sports_hobbies')
        .insert({
          user_id: currentUserId,
          title: defaultTitle,
          description: defaultDescription || '',
          sport_type: sportType,
          display_order: customizedSports.size
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: t('sportActivated') });
      await loadData(currentUserId);
      onDataChange();
      
      // Ouvrir automatiquement l'éditeur pour personnaliser
      if (data) {
        setEditingSport(data as SportEntry);
        setEditingSportType(sportType);
        setEditorOpen(true);
      }
    } catch (error) {
      console.error('Error activating sport:', error);
      toast({ title: t('saveError'), variant: 'destructive' });
    }
  };

  // Désactiver un sport (le supprimer de la base)
  const handleDeactivateSport = async (sportType: CategoryType) => {
    if (!currentUserId) return;
    
    try {
      const { error } = await supabase
        .from('sports_hobbies')
        .delete()
        .eq('user_id', currentUserId)
        .eq('sport_type', sportType);

      if (error) throw error;

      toast({ title: t('sportDeactivated') });
      await loadData(currentUserId);
      onDataChange();
    } catch (error) {
      console.error('Error deactivating sport:', error);
      toast({ title: t('deleteError'), variant: 'destructive' });
    }
  };

  // Éditer un sport existant
  const handleEditSport = (sportType: CategoryType) => {
    const sportData = sportsData.get(sportType);
    if (sportData) {
      setEditingSport(sportData);
      setEditingSportType(sportType);
      setEditorOpen(true);
    }
  };

  // Callback après sauvegarde
  const handleSportSaved = async () => {
    if (currentUserId) {
      await loadData(currentUserId);
      onDataChange();
    }
    setEditorOpen(false);
    setEditingSport(null);
    setEditingSportType(null);
  };

  // Sauvegarder l'ordre des sports
  const saveOrder = async (newOrder: CategoryType[]) => {
    if (!currentUserId) return;
    
    try {
      const customizedList = newOrder.filter(s => customizedSports.has(s));
      
      for (let i = 0; i < customizedList.length; i++) {
        const sportType = customizedList[i];
        const sportData = sportsData.get(sportType);
        if (sportData?.id) {
          await supabase
            .from('sports_hobbies')
            .update({ display_order: i })
            .eq('id', sportData.id);
        }
      }
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const handleToggleSport = (sportType: CategoryType) => {
    setExpandedSport(prev => prev === sportType ? null : sportType);
  };

  const handleDragStart = (e: React.DragEvent, sportType: CategoryType) => {
    setDraggedItem(sportType);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sportType);
  };

  const handleDragOver = (e: React.DragEvent, sportType: CategoryType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedItem && sportType !== draggedItem) {
      setDragOverItem(sportType);
    }
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetType: CategoryType) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetType) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    // Obtenir la liste des sports customisés dans l'ordre actuel
    const customizedList = sportOrder.filter(s => customizedSports.has(s));
    
    const dragIndex = customizedList.indexOf(draggedItem);
    const dropIndex = customizedList.indexOf(targetType);

    if (dragIndex === -1 || dropIndex === -1) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    // Réorganiser
    const newOrder = [...customizedList];
    newOrder.splice(dragIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);

    const nonCustomized = sportOrder.filter(s => !customizedSports.has(s));
    const fullOrder = [...newOrder, ...nonCustomized];
    setSportOrder(fullOrder);

    // Sauvegarder l'ordre en base
    saveOrder(fullOrder);

    toast({
      title: t('personalOrderUpdatedTitle'),
      description: t('personalOrderUpdatedDescription'),
    });

    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const getSportLabel = (type: CategoryType) => {
    const option = SPORT_OPTIONS.find(s => s.type === type);
    if (!option) return type;
    return t(`personalSportLabel_${type}`);
  };

  const getSportDescription = (type: CategoryType) => {
    const option = SPORT_OPTIONS.find(s => s.type === type);
    if (!option) return '';
    return t(`personalSportDescription_${type}`);
  };

  const renderSportModule = (sportType: CategoryType) => {
    if (!currentUserId) return null;

    const sportData = sportsData.get(sportType);

    switch (sportType) {
      case 'polo':
        return <PoloProfileModule userId={currentUserId} isEditable={isEditable} />;
      case 'golf':
        return <GolfProfileModule userId={currentUserId} isEditable={isEditable} />;
      default:
        // Afficher les données du sport enregistré
        if (sportData) {
          return (
            <div className="space-y-4">
              {sportData.image_url && (
                <img 
                  src={sportData.image_url} 
                  alt={sportData.title} 
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              {sportData.badge_text && (
                <span className="inline-block bg-primary/20 text-primary px-3 py-1 rounded-full text-sm">
                  {sportData.badge_text}
                </span>
              )}
              {sportData.subtitle && (
                <p className="text-muted-foreground">{sportData.subtitle}</p>
              )}
              <p className="text-foreground whitespace-pre-wrap">{sportData.description}</p>
              
              {isEditable && (
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditSport(sportType)}
                    className="gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    {t('edit')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeactivateSport(sportType)}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('delete')}
                  </Button>
                </div>
              )}
            </div>
          );
        }
        
        return (
          <div className="text-center py-12 text-muted-foreground">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('personalSportModuleInDevelopment')}</p>
            <p className="text-sm mt-2">{t('personalSportModuleComingSoon')}</p>
          </div>
        );
    }
  };

  const renderSportItem = (sport: SportOption, isDraggable: boolean) => {
    const isCustomized = customizedSports.has(sport.type);
    const isExpanded = expandedSport === sport.type;
    const isDragging = draggedItem === sport.type;
    const isDragOver = dragOverItem === sport.type;

    return (
      <div
        key={sport.type}
        draggable={isDraggable}
        onDragStart={(e) => handleDragStart(e, sport.type)}
        onDragOver={(e) => handleDragOver(e, sport.type)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, sport.type)}
        onDragEnd={handleDragEnd}
        className={cn(
          "rounded-xl transition-all overflow-hidden",
          isCustomized && "border-4 border-primary",
          !isCustomized && "border border-border",
          isDragging && "opacity-50 scale-95",
          isDragOver && "ring-2 ring-primary ring-offset-2",
          isDraggable && "cursor-grab active:cursor-grabbing"
        )}
      >
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => handleToggleSport(sport.type)}
            className={cn(
              "flex-1 flex items-center gap-3 text-left transition-colors",
              isCustomized ? "text-primary" : "text-foreground"
            )}
          >
            {isDraggable && (
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-medium",
                  isCustomized ? "text-primary" : "text-foreground"
                )}>
                  {getSportLabel(sport.type)}
                </span>
                {isCustomized && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
              {getSportDescription(sport.type) && !isExpanded && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {getSportDescription(sport.type)}
                </p>
              )}
            </div>
          </button>
          
          <div className="flex items-center gap-2">
            {isEditable && !isCustomized && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleActivateSport(sport.type);
                }}
                className="gap-1 text-primary hover:text-primary"
              >
                <Plus className="w-4 h-4" />
                {t('add')}
              </Button>
            )}
            <button onClick={() => handleToggleSport(sport.type)}>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className={cn(
            "p-4 border-t",
            isCustomized ? "border-primary/30 bg-background" : "border-border bg-background"
          )}>
            {renderSportModule(sport.type)}
          </div>
        )}
      </div>
    );
  };

  if (!currentUserId) {
    return (
      <PersonalModule
        title={t('personalSportsTitle')}
        icon={Dumbbell}
        moduleType="sports"
      >
        <div className="flex items-center justify-center py-8">
          <span className="text-muted-foreground">{t('loading')}</span>
        </div>
      </PersonalModule>
    );
  }

  const customizedSportsList = sportOrder.filter(s => customizedSports.has(s));
  const nonCustomizedSports = sportOrder.filter(s => !customizedSports.has(s));

  return (
    <>
      <PersonalModule
        title={t('personalSportsTitle')}
        icon={Dumbbell}
        moduleType="sports"
      >
        <div className="space-y-4">
          {customizedSportsList.length > 0 && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm mb-2">
                {t('personalMyPassions')}{" "}
                {isEditable && customizedSportsList.length > 1 && t('personalMyPassionsReorderHint')}
              </p>
              {customizedSportsList.map((type) => {
                const sport = SPORT_OPTIONS.find(s => s.type === type)!;
                return renderSportItem(sport, isEditable && customizedSportsList.length > 1);
              })}
            </div>
          )}

          <Collapsible open={otherActivitiesOpen} onOpenChange={setOtherActivitiesOpen}>
            <CollapsibleTrigger className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted rounded-xl transition-colors border border-border">
              <span className="font-medium text-foreground">{t('personalOtherActivities')}</span>
              {otherActivitiesOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {nonCustomizedSports.map((type) => {
                const sport = SPORT_OPTIONS.find(s => s.type === type)!;
                return renderSportItem(sport, false);
              })}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </PersonalModule>

      <SportsEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        sport={editingSport}
        onSave={handleSportSaved}
        defaultCategory={editingSportType}
      />
    </>
  );
};
