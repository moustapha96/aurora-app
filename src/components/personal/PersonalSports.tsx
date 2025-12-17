import React, { useState } from "react";
import { Dumbbell, Plus, Pencil, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonalModule } from "./PersonalModule";
import { SportsEditor } from "./editors/SportsEditor";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

const SPORT_OPTIONS: { type: CategoryType; label: string; description?: string }[] = [
  { type: 'custom', label: 'Mes sports particuliers', description: 'Ajoutez vos activités personnalisées' },
  // Sports équestres & traditionnels
  { type: 'polo', label: 'Polo', description: 'Le sport des rois, alliant stratégie et maîtrise équestre' },
  { type: 'equitation', label: 'Équitation', description: 'Dressage, saut d\'obstacles, concours complet' },
  { type: 'chasse', label: 'Chasse', description: 'Chasse à courre, battue, safari' },
  { type: 'fauconnerie', label: 'Fauconnerie', description: 'Art ancestral de la chasse au vol' },
  // Golf
  { type: 'golf', label: 'Golf', description: 'Parcours prestigieux et compétitions internationales' },
  // Sports nautiques
  { type: 'yachting', label: 'Yachting', description: 'Navigation de plaisance et régates' },
  { type: 'voile', label: 'Voile de compétition', description: 'America\'s Cup, courses transatlantiques' },
  { type: 'plongee', label: 'Plongée sous-marine', description: 'Exploration des fonds marins' },
  { type: 'kitesurf', label: 'Kitesurf', description: 'Glisse et sensations fortes' },
  { type: 'surf', label: 'Surf', description: 'Vagues et spots exclusifs' },
  { type: 'wakeboard', label: 'Wakeboard & Ski nautique', description: 'Sports tractés' },
  { type: 'jetski', label: 'Jet-ski', description: 'Vitesse sur l\'eau' },
  { type: 'peche', label: 'Pêche sportive', description: 'Pêche au gros, mouche, destinations exclusives' },
  // Sports de montagne
  { type: 'ski', label: 'Ski alpin', description: 'Stations prestigieuses et hors-piste' },
  { type: 'heliskiing', label: 'Héliski', description: 'Ski hors-piste accessible par hélicoptère' },
  { type: 'alpinisme', label: 'Alpinisme', description: 'Ascensions et expéditions en haute montagne' },
  { type: 'randonnee', label: 'Trekking & Randonnée', description: 'Expéditions et sentiers d\'exception' },
  // Sports de raquette
  { type: 'tennis', label: 'Tennis', description: 'Courts privés et tournois' },
  { type: 'padel', label: 'Padel', description: 'Sport en pleine expansion' },
  { type: 'squash', label: 'Squash', description: 'Intensité et réactivité' },
  // Sports automobiles & aviation
  { type: 'automobile', label: 'Conduite sportive', description: 'Supercars et circuits privés' },
  { type: 'course_automobile', label: 'Course automobile', description: 'GT, Endurance, Formule' },
  { type: 'rallye', label: 'Rallye', description: 'Compétition sur routes et terrains variés' },
  { type: 'karting', label: 'Karting', description: 'Base de la course automobile' },
  { type: 'collection_voitures', label: 'Collection automobile', description: 'Voitures de collection et concours d\'élégance' },
  { type: 'aviation', label: 'Aviation privée', description: 'Pilotage avion, hélicoptère, ULM' },
  // Sports de combat & précision
  { type: 'escrime', label: 'Escrime', description: 'Art du duel et discipline olympique' },
  { type: 'tir', label: 'Tir sportif', description: 'Précision et concentration' },
  { type: 'art_martial', label: 'Arts martiaux', description: 'Disciplines traditionnelles et modernes' },
  // Sports britanniques
  { type: 'cricket', label: 'Cricket', description: 'Sport gentleman par excellence' },
  { type: 'croquet', label: 'Croquet', description: 'Élégance sur pelouse' },
  // Sports d'endurance
  { type: 'cyclisme', label: 'Cyclisme sur route', description: 'Parcours mythiques et sorties club' },
  { type: 'vtt', label: 'VTT', description: 'Trails et descente' },
  { type: 'triathlon', label: 'Triathlon', description: 'Natation, cyclisme, course à pied' },
  { type: 'marathon', label: 'Course à pied', description: 'Marathons et ultra-trails prestigieux' },
  // Bien-être
  { type: 'fitness', label: 'Fitness & Musculation', description: 'Entraînement personnel et coaching' },
  { type: 'yoga', label: 'Yoga', description: 'Pratique physique et spirituelle' },
  { type: 'meditation', label: 'Méditation', description: 'Pleine conscience et relaxation' },
];

export const PersonalSports = ({ sports, isEditable, onDataChange }: PersonalSportsProps) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSport, setEditingSport] = useState<SportEntry | null>(null);
  const [addCategory, setAddCategory] = useState<CategoryType | null>(null);
  const [viewingSport, setViewingSport] = useState<SportEntry | null>(null);
  const { toast } = useToast();

  const handleSelectSport = (category: CategoryType) => {
    setAddCategory(category);
    setEditingSport(null);
    setEditorOpen(true);
  };

  const handleEdit = (sport: SportEntry) => {
    setEditingSport(sport);
    setAddCategory(null);
    setEditorOpen(true);
  };

  const handleEditorClose = (open: boolean) => {
    setEditorOpen(open);
    if (!open) {
      setEditingSport(null);
      setAddCategory(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("sports_hobbies")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Sport supprimé" });
      onDataChange();
    } catch (error) {
      console.error("Delete error:", error);
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    }
  };

  const getItemsByCategory = (category: CategoryType) => {
    if (category === 'custom') {
      return sports.filter(item => !item.sport_type || item.sport_type === 'autre' || item.sport_type === 'custom');
    }
    return sports.filter(item => item.sport_type === category);
  };

  const getCategoryLabel = (type: CategoryType) => {
    return SPORT_OPTIONS.find(item => item.type === type)?.label || type;
  };

  // Get all sports grouped by category, only show categories with items
  const categoriesWithItems = SPORT_OPTIONS
    .map(item => ({ ...item, items: getItemsByCategory(item.type) }))
    .filter(cat => cat.items.length > 0);

  return (
    <PersonalModule
      title="Sports & Activités"
      icon={Dumbbell}
      moduleType="sports"
    >
      <div className="space-y-4">
        {/* Dropdown menu */}
        {isEditable && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between gap-2 border-gold/30 hover:border-gold hover:bg-gold/10">
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Ajouter un sport
                </span>
                <ChevronDown className="w-4 h-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 max-h-[300px] overflow-y-auto bg-background border border-border z-50" align="start">
              {SPORT_OPTIONS.map((option) => {
                const count = getItemsByCategory(option.type).length;
                return (
                  <DropdownMenuItem
                    key={option.type}
                    onClick={() => handleSelectSport(option.type)}
                    className="cursor-pointer flex-col items-start"
                  >
                    <div className="flex w-full justify-between items-center">
                      <span className="font-medium">{option.label}</span>
                      {count > 0 && (
                        <span className="text-xs text-muted-foreground ml-2">({count})</span>
                      )}
                    </div>
                    {option.description && (
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Sports list grouped by category */}
        <div className="space-y-4">
          {categoriesWithItems.map(({ type, label, items }) => (
            <div key={type} className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {label}
              </h4>
              <div className="space-y-2">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3 bg-muted/30 rounded-lg group cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setViewingSport(item)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-foreground">{item.title}</h4>
                        {item.subtitle && <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>}
                        {item.badge_text && (
                          <span className="text-xs px-2 py-0.5 bg-gold/20 text-gold rounded inline-block mt-1">
                            {item.badge_text}
                          </span>
                        )}
                      </div>
                      {isEditable && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {categoriesWithItems.length === 0 && (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              {isEditable ? "Sélectionnez un sport dans le menu pour commencer" : "Aucun sport renseigné"}
            </p>
          )}
        </div>
      </div>

      <SportsEditor
        open={editorOpen}
        onOpenChange={handleEditorClose}
        sport={editingSport}
        onSave={onDataChange}
        defaultCategory={addCategory}
      />

      {/* View dialog */}
      <Dialog open={!!viewingSport} onOpenChange={(open) => !open && setViewingSport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingSport?.title}
              {viewingSport?.badge_text && (
                <span className="text-xs px-2 py-0.5 bg-gold/20 text-gold rounded">
                  {viewingSport.badge_text}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {viewingSport?.image_url && (
              <img 
                src={viewingSport.image_url} 
                alt={viewingSport.title} 
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            {viewingSport?.subtitle && (
              <p className="text-sm text-muted-foreground">{viewingSport.subtitle}</p>
            )}
            {viewingSport?.description && (
              <p className="text-sm text-foreground whitespace-pre-wrap">{viewingSport.description}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PersonalModule>
  );
};
