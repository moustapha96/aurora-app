import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Trophy, Plus, Trash2, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EditableText } from "@/components/EditableText";
import { EditableImage } from "@/components/EditableImage";
import { SportsHobbiesEditor } from "@/components/SportsHobbiesEditor";
import { PersonalContentEditor } from "@/components/PersonalContentEditor";
import { CuratedSportEditor } from "@/components/CuratedSportEditor";
import { useLanguage } from "@/contexts/LanguageContext";
import sportYachting from "@/assets/sport-yachting.jpg";
import sportPolo from "@/assets/sport-polo.jpg";
import sportChasse from "@/assets/sport-chasse.jpg";

const Personal = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [curatedSports, setCuratedSports] = useState<any>({
    yachting: null,
    polo: null,
    chasse: null
  });
  const [initialCuratedSports, setInitialCuratedSports] = useState<any>({});
  const [sportsHobbies, setSportsHobbies] = useState<any[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [contentEditorOpen, setContentEditorOpen] = useState(false);
  const [curatedSportEditorOpen, setCuratedSportEditorOpen] = useState(false);
  const [editingHobby, setEditingHobby] = useState<any>(null);
  const [editingCuratedSport, setEditingCuratedSport] = useState<any>(null);
  const [editingCuratedSportType, setEditingCuratedSportType] = useState<string>('');
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, [id]);

  const checkAuthAndLoadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }
    loadData();
  };

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const profileId = id || user.id;
      const isOwn = profileId === user.id;
      setIsOwnProfile(isOwn);

      // Check access if viewing another user's profile
      if (!isOwn) {
        const { data: friendships } = await supabase
          .from('friendships')
          .select('personal_access')
          .or(`and(user_id.eq.${user.id},friend_id.eq.${profileId}),and(user_id.eq.${profileId},friend_id.eq.${user.id})`);

        if (!friendships || friendships.length === 0 || !friendships[0].personal_access) {
          setHasAccess(false);
          setIsCheckingAccess(false);
          setLoading(false);
          return;
        }
        setHasAccess(true);
      } else {
        setHasAccess(true);
      }
      setIsCheckingAccess(false);

      const { data: curatedData } = await supabase
        .from('curated_sports')
        .select('*')
        .eq('user_id', profileId);

      const curatedMap = curatedData?.reduce((acc, item) => {
        acc[item.sport_type] = item;
        return acc;
      }, {} as any) || {};

      setCuratedSports(curatedMap);
      console.log('🟢 Curated sports loaded:', curatedMap);
      
      // Sauvegarder les valeurs initiales seulement si c'est la première fois
      if (Object.keys(initialCuratedSports).length === 0 && curatedData && curatedData.length > 0) {
        setInitialCuratedSports(curatedMap);
      }

      const { data: hobbiesData } = await supabase
        .from('sports_hobbies')
        .select('*')
        .eq('user_id', profileId)
        .order('display_order', { ascending: true });

      setSportsHobbies(hobbiesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSportField = async (sportType: string, field: string, value: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const currentSport = curatedSports[sportType] || {};
      const sportData = {
        user_id: user.id,
        sport_type: sportType,
        title: currentSport.title || '',
        subtitle: currentSport.subtitle || '',
        badge_text: currentSport.badge_text || '',
        description: currentSport.description || '',
        image_url: currentSport.image_url || '',
        stat1_label: currentSport.stat1_label || '',
        stat1_value: currentSport.stat1_value || '',
        stat2_label: currentSport.stat2_label || '',
        stat2_value: currentSport.stat2_value || '',
        stat3_label: currentSport.stat3_label || '',
        stat3_value: currentSport.stat3_value || '',
        [field]: value
      };

      await supabase
        .from('curated_sports')
        .upsert(sportData, { 
          onConflict: 'user_id,sport_type'
        });

      toast({ title: "Modification enregistrée" });
      loadData();
    } catch (error) {
      console.error('Update error:', error);
      toast({ 
        title: "Erreur lors de la mise à jour", 
        variant: "destructive" 
      });
    }
  };

  const handleDeleteHobby = async (id: string) => {
    try {
      await supabase
        .from('sports_hobbies')
        .delete()
        .eq('id', id);

      toast({ title: "Passion supprimée" });
      loadData();
    } catch (error) {
      console.error('Delete error:', error);
      toast({ 
        title: "Erreur lors de la suppression", 
        variant: "destructive" 
      });
    }
  };

  const handleEditHobby = (hobby: any) => {
    setEditingHobby(hobby);
    setEditorOpen(true);
  };

  const handleAddHobby = () => {
    setEditingHobby(null);
    setEditorOpen(true);
  };

  const handleEditCuratedSport = (sportType: string) => {
    setEditingCuratedSport(curatedSports[sportType]);
    setEditingCuratedSportType(sportType);
    setCuratedSportEditorOpen(true);
  };

  const handleDeleteCuratedSport = async (sportType: string) => {
    console.log('🔴 DELETE FUNCTION CALLED for:', sportType);
    
    try {
      const sport = curatedSports[sportType];
      console.log('🔴 Sport object:', sport);
      
      if (!sport?.id) {
        console.log('❌ No sport data to delete for', sportType, sport);
        toast({ 
          title: "Aucune donnée à supprimer", 
          variant: "destructive" 
        });
        return;
      }

      console.log('✅ Attempting to delete sport:', sportType, 'ID:', sport.id);
      
      const { error, data } = await supabase
        .from('curated_sports')
        .delete()
        .eq('id', sport.id)
        .select();

      console.log('🔴 Delete response:', { error, data });

      if (error) {
        console.error('❌ Delete error from Supabase:', error);
        toast({ 
          title: "Erreur lors de la suppression", 
          description: error.message,
          variant: "destructive" 
        });
        return;
      }

      console.log('✅ Sport deleted successfully');
      
      // Mettre à jour l'état local immédiatement
      setCuratedSports(prev => ({
        ...prev,
        [sportType]: null
      }));

      toast({ title: "Sport supprimé avec succès" });
      loadData();
    } catch (error) {
      console.error('❌ Delete catch error:', error);
      toast({ 
        title: "Erreur lors de la suppression", 
        variant: "destructive" 
      });
    }
  };

  if (loading || isCheckingAccess) {
    return (
      <>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p>{t('loading')}</p>
        </div>
      </>
    );
  }

  if (!isOwnProfile && !hasAccess) {
    return (
      <>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center max-w-md">
            <p className="mb-4">Vous n'avez pas accès à cette section du profil.</p>
            <Button 
              variant="outline" 
              onClick={() => navigate(id ? `/profile/${id}` : "/profile")}
            >
              {t('backToProfile')}
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="border-b border-border p-6 bg-card">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-serif text-primary mb-2">PERSONAL</h1>
              <p className="text-muted-foreground">Univers personnel & passions</p>
            </div>
            <div className="flex gap-3">
              {isOwnProfile && (
                <Button 
                  variant="outline" 
                  onClick={() => setContentEditorOpen(true)}
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                  {t('edit')}
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => navigate(id ? `/profile/${id}` : "/profile")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('backToProfile')}
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-20">
            <div className="flex items-center mb-8">
              <Trophy className="w-6 h-6 text-primary mr-3" />
              <h2 className="text-3xl font-serif text-primary">Sports & Passions</h2>
            </div>

            <div className="space-y-12 animate-fade-in">
              {/* Yachting */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-4xl font-serif text-foreground">Yachting</h2>
                  {isOwnProfile && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCuratedSport('yachting')}
                        className="gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        {curatedSports.yachting ? t('edit') : t('add')}
                      </Button>
                      {curatedSports.yachting && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCuratedSport('yachting')}
                          className="gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('delete')}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <EditableImage
                  imageUrl={curatedSports.yachting?.image_url || sportYachting}
                  onSave={(url) => updateSportField('yachting', 'image_url', url)}
                  className="relative h-[500px] rounded-xl overflow-hidden"
                  alt="Luxury yacht"
                  editable={isOwnProfile}
                />
                <Card>
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <EditableText
                          value={curatedSports.yachting?.title || "Aurora III"}
                          onSave={(value) => updateSportField('yachting', 'title', value)}
                          className="text-3xl font-semibold"
                          placeholder="Titre..."
                          editable={isOwnProfile}
                        />
                        <EditableText
                          value={curatedSports.yachting?.subtitle || "Benetti Custom 65m • 2022"}
                          onSave={(value) => updateSportField('yachting', 'subtitle', value)}
                          className="text-muted-foreground text-lg"
                          placeholder="Sous-titre..."
                          editable={isOwnProfile}
                        />
                      </div>
                      <EditableText
                        value={curatedSports.yachting?.badge_text || "Propriétaire"}
                        onSave={(value) => updateSportField('yachting', 'badge_text', value)}
                        className="text-base px-4 py-2 bg-primary text-primary-foreground rounded-md"
                        placeholder="Badge..."
                        editable={isOwnProfile}
                      />
                    </div>
                    <EditableText
                      value={curatedSports.yachting?.description || "Navigation depuis 1995, membre du Yacht Club de Monaco depuis 2010. Participation régulière aux régates de prestige : Monaco Classic Week, Voiles de Saint-Tropez, Maxi Yacht Rolex Cup. Croisières annuelles en Méditerranée (Côte d'Azur, Sardaigne, Grèce) et dans les Caraïbes."}
                      onSave={(value) => updateSportField('yachting', 'description', value)}
                      className="text-foreground leading-relaxed text-lg"
                      placeholder="Description..."
                      multiline
                      editable={isOwnProfile}
                    />
                    <div className="grid grid-cols-3 gap-6 pt-6 border-t">
                      <div>
                        <EditableText
                          value={curatedSports.yachting?.stat1_label || "Clubs"}
                          onSave={(value) => updateSportField('yachting', 'stat1_label', value)}
                          className="text-sm text-muted-foreground mb-1"
                          placeholder="Label 1..."
                          editable={isOwnProfile}
                        />
                        <EditableText
                          value={curatedSports.yachting?.stat1_value || "YC Monaco, NYYC"}
                          onSave={(value) => updateSportField('yachting', 'stat1_value', value)}
                          className="font-semibold text-lg"
                          placeholder="Valeur 1..."
                          editable={isOwnProfile}
                        />
                      </div>
                      <div>
                        <EditableText
                          value={curatedSports.yachting?.stat2_label || "Capitainerie"}
                          onSave={(value) => updateSportField('yachting', 'stat2_label', value)}
                          className="text-sm text-muted-foreground mb-1"
                          placeholder="Label 2..."
                          editable={isOwnProfile}
                        />
                        <EditableText
                          value={curatedSports.yachting?.stat2_value || "Port Hercule"}
                          onSave={(value) => updateSportField('yachting', 'stat2_value', value)}
                          className="font-semibold text-lg"
                          placeholder="Valeur 2..."
                          editable={isOwnProfile}
                        />
                      </div>
                      <div>
                        <EditableText
                          value={curatedSports.yachting?.stat3_label || "Régates"}
                          onSave={(value) => updateSportField('yachting', 'stat3_label', value)}
                          className="text-sm text-muted-foreground mb-1"
                          placeholder="Label 3..."
                          editable={isOwnProfile}
                        />
                        <EditableText
                          value={curatedSports.yachting?.stat3_value || "12 saisons"}
                          onSave={(value) => updateSportField('yachting', 'stat3_value', value)}
                          className="font-semibold text-lg"
                          placeholder="Valeur 3..."
                          editable={isOwnProfile}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Polo */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-4xl font-serif text-foreground">Polo</h2>
                  {isOwnProfile && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCuratedSport('polo')}
                        className="gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        {curatedSports.polo ? t('edit') : t('add')}
                      </Button>
                      {curatedSports.polo && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCuratedSport('polo')}
                          className="gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('delete')}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <EditableImage
                  imageUrl={curatedSports.polo?.image_url || sportPolo}
                  onSave={(url) => updateSportField('polo', 'image_url', url)}
                  className="relative h-[500px] rounded-xl overflow-hidden"
                  alt="Polo match"
                  editable={isOwnProfile}
                />
                <Card>
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <EditableText
                          value={curatedSports.polo?.title || "Polo Club de Paris"}
                          onSave={(value) => updateSportField('polo', 'title', value)}
                          className="text-3xl font-semibold"
                          placeholder="Titre..."
                          editable={isOwnProfile}
                        />
                        <EditableText
                          value={curatedSports.polo?.subtitle || "Handicap 4 • Membre depuis 2008"}
                          onSave={(value) => updateSportField('polo', 'subtitle', value)}
                          className="text-muted-foreground text-lg"
                          placeholder="Sous-titre..."
                          editable={isOwnProfile}
                        />
                      </div>
                      <EditableText
                        value={curatedSports.polo?.badge_text || "Joueur Actif"}
                        onSave={(value) => updateSportField('polo', 'badge_text', value)}
                        className="text-base px-4 py-2 bg-primary text-primary-foreground rounded-md"
                        placeholder="Badge..."
                        editable={isOwnProfile}
                      />
                    </div>
                    <EditableText
                      value={curatedSports.polo?.description || "Pratique régulière au Polo Club de Paris (Bagatelle) et au Polo Club de Chantilly. Participation aux tournois de haut niveau : Coupe d'Or de Deauville, Open de France, Argentine Open (invité). Écurie personnelle de 8 chevaux, entraînement bi-hebdomadaire avec Gonzalo Pieres."}
                      onSave={(value) => updateSportField('polo', 'description', value)}
                      className="text-foreground leading-relaxed text-lg"
                      placeholder="Description..."
                      multiline
                      editable={isOwnProfile}
                    />
                    <div className="grid grid-cols-3 gap-6 pt-6 border-t">
                      <div>
                        <EditableText
                          value={curatedSports.polo?.stat1_label || "Handicap"}
                          onSave={(value) => updateSportField('polo', 'stat1_label', value)}
                          className="text-sm text-muted-foreground mb-1"
                          placeholder="Label 1..."
                          editable={isOwnProfile}
                        />
                        <EditableText
                          value={curatedSports.polo?.stat1_value || "4 Goals"}
                          onSave={(value) => updateSportField('polo', 'stat1_value', value)}
                          className="font-semibold text-lg"
                          placeholder="Valeur 1..."
                          editable={isOwnProfile}
                        />
                      </div>
                      <div>
                        <EditableText
                          value={curatedSports.polo?.stat2_label || "Chevaux"}
                          onSave={(value) => updateSportField('polo', 'stat2_label', value)}
                          className="text-sm text-muted-foreground mb-1"
                          placeholder="Label 2..."
                          editable={isOwnProfile}
                        />
                        <EditableText
                          value={curatedSports.polo?.stat2_value || "8 têtes"}
                          onSave={(value) => updateSportField('polo', 'stat2_value', value)}
                          className="font-semibold text-lg"
                          placeholder="Valeur 2..."
                          editable={isOwnProfile}
                        />
                      </div>
                      <div>
                        <EditableText
                          value={curatedSports.polo?.stat3_label || "Tournois"}
                          onSave={(value) => updateSportField('polo', 'stat3_label', value)}
                          className="text-sm text-muted-foreground mb-1"
                          placeholder="Label 3..."
                          editable={isOwnProfile}
                        />
                        <EditableText
                          value={curatedSports.polo?.stat3_value || "15+ annuels"}
                          onSave={(value) => updateSportField('polo', 'stat3_value', value)}
                          className="font-semibold text-lg"
                          placeholder="Valeur 3..."
                          editable={isOwnProfile}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chasse à Courre */}
              {curatedSports.chasse && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-4xl font-serif text-foreground">Chasse à Courre</h2>
                  {isOwnProfile && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCuratedSport('chasse')}
                        className="gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCuratedSport('chasse')}
                        className="gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </Button>
                    </div>
                  )}
                </div>
                <EditableImage
                  imageUrl={curatedSports.chasse?.image_url || sportChasse}
                  onSave={(url) => updateSportField('chasse', 'image_url', url)}
                  className="relative h-[500px] rounded-xl overflow-hidden"
                  alt="Chasse à courre"
                  editable={isOwnProfile}
                />
                <Card>
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <EditableText
                          value={curatedSports.chasse?.title || "Équipage de Fontainebleau"}
                          onSave={(value) => updateSportField('chasse', 'title', value)}
                          className="text-3xl font-semibold"
                          placeholder="Titre..."
                          editable={isOwnProfile}
                        />
                        <EditableText
                          value={curatedSports.chasse?.subtitle || "Maître d'Équipage Adjoint • Depuis 2012"}
                          onSave={(value) => updateSportField('chasse', 'subtitle', value)}
                          className="text-muted-foreground text-lg"
                          placeholder="Sous-titre..."
                          editable={isOwnProfile}
                        />
                      </div>
                      <EditableText
                        value={curatedSports.chasse?.badge_text || "Vénerie"}
                        onSave={(value) => updateSportField('chasse', 'badge_text', value)}
                        className="text-base px-4 py-2 bg-primary text-primary-foreground rounded-md"
                        placeholder="Badge..."
                        editable={isOwnProfile}
                      />
                    </div>
                    <EditableText
                      value={curatedSports.chasse?.description || "Tradition familiale depuis quatre générations. Membre de la Société de Vénerie et du prestigieux Rallye Row Fontainebleau. Participation aux grandes chasses royales en forêt de Fontainebleau, Compiègne et Chantilly. Meute personnelle de 15 couples de chiens français tricolores. Organisation de la Saint-Hubert annuelle du domaine familial."}
                      onSave={(value) => updateSportField('chasse', 'description', value)}
                      className="text-foreground leading-relaxed text-lg"
                      placeholder="Description..."
                      multiline
                      editable={isOwnProfile}
                    />
                    <div className="grid grid-cols-3 gap-6 pt-6 border-t">
                      <div>
                        <EditableText
                          value={curatedSports.chasse?.stat1_label || "Équipage"}
                          onSave={(value) => updateSportField('chasse', 'stat1_label', value)}
                          className="text-sm text-muted-foreground mb-1"
                          placeholder="Label 1..."
                          editable={isOwnProfile}
                        />
                        <EditableText
                          value={curatedSports.chasse?.stat1_value || "Fontainebleau"}
                          onSave={(value) => updateSportField('chasse', 'stat1_value', value)}
                          className="font-semibold text-lg"
                          placeholder="Valeur 1..."
                          editable={isOwnProfile}
                        />
                      </div>
                      <div>
                        <EditableText
                          value={curatedSports.chasse?.stat2_label || "Chiens"}
                          onSave={(value) => updateSportField('chasse', 'stat2_label', value)}
                          className="text-sm text-muted-foreground mb-1"
                          placeholder="Label 2..."
                          editable={isOwnProfile}
                        />
                        <EditableText
                          value={curatedSports.chasse?.stat2_value || "15 couples"}
                          onSave={(value) => updateSportField('chasse', 'stat2_value', value)}
                          className="font-semibold text-lg"
                          placeholder="Valeur 2..."
                          editable={isOwnProfile}
                        />
                      </div>
                      <div>
                        <EditableText
                          value={curatedSports.chasse?.stat3_label || "Forêts"}
                          onSave={(value) => updateSportField('chasse', 'stat3_label', value)}
                          className="text-sm text-muted-foreground mb-1"
                          placeholder="Label 3..."
                          editable={isOwnProfile}
                        />
                        <EditableText
                          value={curatedSports.chasse?.stat3_value || "3 territoires"}
                          onSave={(value) => updateSportField('chasse', 'stat3_value', value)}
                          className="font-semibold text-lg"
                          placeholder="Valeur 3..."
                          editable={isOwnProfile}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              )}

              {/* Autres passions/sports */}
              {sportsHobbies.map((hobby) => (
                <div key={hobby.id} className="space-y-6 mb-16">
                  <div className="flex items-center justify-between">
                    <h2 className="text-4xl font-serif text-foreground">{hobby.title}</h2>
                    {isOwnProfile && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditHobby(hobby)}
                        >
                          Modifier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteHobby(hobby.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {hobby.image_url && (
                    <img 
                      src={hobby.image_url} 
                      alt={hobby.title}
                      className="w-full h-[500px] object-cover rounded-xl"
                    />
                  )}
                  <Card>
                    <CardContent className="p-8 space-y-4">
                      {hobby.badge_text && (
                        <Badge variant="secondary">{hobby.badge_text}</Badge>
                      )}
                      <p className="text-foreground leading-relaxed text-lg whitespace-pre-wrap">
                        {hobby.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}

              {isOwnProfile && (
                <div className="flex flex-col items-center gap-3 pt-6">
                  <Button
                    onClick={handleAddHobby}
                    variant="outline"
                    size="lg"
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter une photo / passion
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    Pour ajouter plusieurs photos d'une même passion, créez plusieurs entrées
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-center mt-12">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate("/profile")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('backToProfile')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <SportsHobbiesEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        hobby={editingHobby}
        onSave={loadData}
      />

      <CuratedSportEditor
        open={curatedSportEditorOpen}
        onOpenChange={setCuratedSportEditorOpen}
        sport={editingCuratedSport}
        sportType={editingCuratedSportType}
        onSave={loadData}
      />
      
      <PersonalContentEditor
        open={contentEditorOpen}
        onOpenChange={setContentEditorOpen}
        content={{
          yachting_title: curatedSports.yachting?.title,
          yachting_subtitle: curatedSports.yachting?.subtitle,
          yachting_badge: curatedSports.yachting?.badge_text,
          yachting_description: curatedSports.yachting?.description,
          yachting_image_url: curatedSports.yachting?.image_url,
          yachting_stat1_label: curatedSports.yachting?.stat1_label,
          yachting_stat1_value: curatedSports.yachting?.stat1_value,
          yachting_stat2_label: curatedSports.yachting?.stat2_label,
          yachting_stat2_value: curatedSports.yachting?.stat2_value,
          yachting_stat3_label: curatedSports.yachting?.stat3_label,
          yachting_stat3_value: curatedSports.yachting?.stat3_value,
          polo_title: curatedSports.polo?.title,
          polo_subtitle: curatedSports.polo?.subtitle,
          polo_badge: curatedSports.polo?.badge_text,
          polo_description: curatedSports.polo?.description,
          polo_image_url: curatedSports.polo?.image_url,
          polo_stat1_label: curatedSports.polo?.stat1_label,
          polo_stat1_value: curatedSports.polo?.stat1_value,
          polo_stat2_label: curatedSports.polo?.stat2_label,
          polo_stat2_value: curatedSports.polo?.stat2_value,
          polo_stat3_label: curatedSports.polo?.stat3_label,
          polo_stat3_value: curatedSports.polo?.stat3_value,
          chasse_title: curatedSports.chasse?.title,
          chasse_subtitle: curatedSports.chasse?.subtitle,
          chasse_badge: curatedSports.chasse?.badge_text,
          chasse_description: curatedSports.chasse?.description,
          chasse_image_url: curatedSports.chasse?.image_url,
          chasse_stat1_label: curatedSports.chasse?.stat1_label,
          chasse_stat1_value: curatedSports.chasse?.stat1_value,
          chasse_stat2_label: curatedSports.chasse?.stat2_label,
          chasse_stat2_value: curatedSports.chasse?.stat2_value,
          chasse_stat3_label: curatedSports.chasse?.stat3_label,
          chasse_stat3_value: curatedSports.chasse?.stat3_value,
        }}
        onSave={loadData}
        sportsHobbies={sportsHobbies}
        onEditHobby={handleEditHobby}
        onDeleteHobby={handleDeleteHobby}
        onAddHobby={handleAddHobby}
      />
    </>
  );
};

export default Personal;
