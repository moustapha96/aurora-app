import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, Users, Trophy, Crown, Star, 
  Network, GitBranch, Gift, UserPlus
} from "lucide-react";
import { Header } from "@/components/Header";
import { FamilyDocuments } from "@/components/FamilyDocuments";
import { PageNavigation } from "@/components/BackButton";
import { 
  FamilyModule, 
  FamilyLineage, 
  FamilyCloseMembers, 
  FamilyInfluential, 
  FamilyBoard, 
  FamilyCommitments, 
  FamilyHeritage,
  FamilyParrainage,
  FamilyLinkInvite
} from "@/components/family";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const FamilySocial = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  
  const [profile, setProfile] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  
  // Content states for each module
  const [familyContent, setFamilyContent] = useState<any>({});
  const [lineageEntries, setLineageEntries] = useState<any[]>([]);
  const [closeMembers, setCloseMembers] = useState<any[]>([]);
  const [influentialPeople, setInfluentialPeople] = useState<any[]>([]);
  const [boardMembers, setBoardMembers] = useState<any[]>([]);
  const [commitments, setCommitments] = useState<any[]>([]);
  const [heritage, setHeritage] = useState<any>(null);

  useEffect(() => {
    loadAllContent();
  }, [id]);

  const loadAllContent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const profileId = id || user.id;
      const isOwn = profileId === user.id;
      setIsOwnProfile(isOwn);

      // Check access if viewing another user's profile
      if (!isOwn) {
        const { data: friendships } = await supabase
          .from('friendships')
          .select('family_access')
          .or(`and(user_id.eq.${user.id},friend_id.eq.${profileId}),and(user_id.eq.${profileId},friend_id.eq.${user.id})`);

        if (!friendships || friendships.length === 0 || !friendships[0].family_access) {
          setHasAccess(false);
          setIsCheckingAccess(false);
          return;
        }
        setHasAccess(true);
      } else {
        setHasAccess(true);
      }
      setIsCheckingAccess(false);

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (profileData) setProfile(profileData);

      // Load family_content
      const { data: content } = await supabase
        .from('family_content')
        .select('*')
        .eq('user_id', profileId)
        .maybeSingle();

      if (content) {
        setFamilyContent(content);
      }

      // Load lineage entries
      const { data: lineage } = await supabase
        .from('family_lineage')
        .select('*')
        .eq('user_id', profileId)
        .order('display_order');
      if (lineage) setLineageEntries(lineage);

      // Load close family members
      const { data: close } = await supabase
        .from('family_close')
        .select('*')
        .eq('user_id', profileId)
        .order('display_order');
      if (close) setCloseMembers(close);

      // Load influential people
      const { data: influential } = await supabase
        .from('family_influential')
        .select('*')
        .eq('user_id', profileId)
        .order('display_order');
      if (influential) setInfluentialPeople(influential);

      // Load board members
      const { data: board } = await supabase
        .from('family_board')
        .select('*')
        .eq('user_id', profileId)
        .order('display_order');
      if (board) setBoardMembers(board);

      // Load commitments
      const { data: comms } = await supabase
        .from('family_commitments')
        .select('*')
        .eq('user_id', profileId)
        .order('display_order');
      if (comms) setCommitments(comms);

      // Load heritage
      const { data: her } = await supabase
        .from('family_heritage')
        .select('*')
        .eq('user_id', profileId)
        .maybeSingle();
      if (her) setHeritage(her);

    } catch (error) {
      console.error('Error loading content:', error);
      toast.error(t('errorLoadingContent'));
    }
  };

  if (isCheckingAccess) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background text-foreground pt-24 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (!isOwnProfile && !hasAccess) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background text-foreground pt-24 flex items-center justify-center">
          <div className="text-center max-w-md">
            <p className="mb-4">{t('noAccessToSection')}</p>
            <Button 
              variant="outline" 
              onClick={() => navigate(id ? `/profile/${id}` : "/profile")}
            >
              {t('backToGeneralProfile')}
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <PageNavigation to={id ? `/profile/${id}` : "/profile"} />
      <div className="min-h-screen bg-background text-foreground pt-32 sm:pt-36 safe-area-all">
        {/* Header */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-16 sm:top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif text-gold tracking-wide">{t('lineageAlliancesHeritage')}</h1>
              <p className="text-gold/60 text-xs sm:text-sm mt-1">{t('preserveFamilyHistory')}</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Profile Summary Card */}
          <Card className="module-card rounded-xl mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-gold/5" />
            <CardHeader className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl font-serif mb-2">
                    {profile ? `${profile.first_name} ${profile.last_name}` : t('member')}
                  </CardTitle>
                  <CardDescription className="text-lg text-foreground/80">
                    {profile?.honorific_title || profile?.job_function || t('memberAurora')}
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2">
                  {profile?.is_founder && (
                    <Badge className="bg-gold text-gold-foreground">
                      <Trophy className="w-3 h-3 mr-1" />
                      {t('founder')}
                    </Badge>
                  )}
                  {profile?.is_patron && (
                    <Badge className="bg-gold text-gold-foreground">
                      <Heart className="w-3 h-3 mr-1 fill-current" />
                      {t('patron')}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Module 1: Lignée & Origines */}
            <FamilyModule
              title={t('lineageOrigins')}
              icon={<GitBranch className="w-5 h-5" />}
              moduleType="lineage_text"
              content={familyContent.bio || ""}
              isEditable={isOwnProfile}
              onUpdate={loadAllContent}
              renderContent={() => (
                <div className="space-y-6">
                  <FamilyLineage 
                    entries={lineageEntries} 
                    isEditable={isOwnProfile} 
                    onUpdate={loadAllContent} 
                  />
                  {/* Section pour inviter des proches */}
                  <FamilyLinkInvite 
                    isEditable={isOwnProfile}
                    onUpdate={loadAllContent}
                  />
                </div>
              )}
            />

            {/* Module 2: Famille proche */}
            <FamilyModule
              title={t('closeFamily')}
              icon={<Users className="w-5 h-5" />}
              moduleType="family_text"
              content={familyContent.family_text || ""}
              isEditable={isOwnProfile}
              onUpdate={loadAllContent}
              renderContent={() => (
                <FamilyCloseMembers 
                  members={closeMembers} 
                  isEditable={isOwnProfile} 
                  onUpdate={loadAllContent} 
                />
              )}
            />

            {/* Module 3: Personnes marquantes */}
            <FamilyModule
              title={t('influentialPeople')}
              icon={<Star className="w-5 h-5" />}
              moduleType="network_text"
              content={familyContent.network_text || ""}
              isEditable={isOwnProfile}
              onUpdate={loadAllContent}
              renderContent={() => (
                <FamilyInfluential 
                  people={influentialPeople} 
                  isEditable={isOwnProfile} 
                  onUpdate={loadAllContent} 
                />
              )}
            />

            {/* Module 4: Réseau clé / Board personnel */}
            <FamilyModule
              title={t('keyNetworkBoard')}
              icon={<Network className="w-5 h-5" />}
              moduleType="board_text"
              content={familyContent.philanthropy_text || ""}
              isEditable={isOwnProfile}
              onUpdate={loadAllContent}
              renderContent={() => (
                <FamilyBoard 
                  members={boardMembers} 
                  isEditable={isOwnProfile} 
                  onUpdate={loadAllContent} 
                />
              )}
            />

            {/* Module 5: Engagements familiaux */}
            <FamilyModule
              title={t('familyCommitments')}
              icon={<Heart className="w-5 h-5" />}
              moduleType="philanthropy_text"
              content={familyContent.philanthropy_text || ""}
              isEditable={isOwnProfile}
              onUpdate={loadAllContent}
              renderContent={() => (
                <FamilyCommitments 
                  commitments={commitments} 
                  isEditable={isOwnProfile} 
                  onUpdate={loadAllContent} 
                />
              )}
            />

            {/* Module 6: Héritage & Transmission */}
            <FamilyModule
              title={t('heritageTransmission')}
              icon={<Crown className="w-5 h-5" />}
              moduleType="heritage"
              content={heritage?.heritage_description || ""}
              isEditable={isOwnProfile}
              onUpdate={loadAllContent}
              renderContent={() => (
                <FamilyHeritage 
                  heritage={heritage} 
                  isEditable={isOwnProfile} 
                  onUpdate={loadAllContent} 
                />
              )}
            />

            {/* Module 7: Parrainage */}
            <FamilyModule
              title={t('sponsorship')}
              icon={<Gift className="w-5 h-5" />}
              moduleType="parrainage"
              content=""
              isEditable={isOwnProfile}
              onUpdate={loadAllContent}
              renderContent={() => (
                <FamilyParrainage 
                  isEditable={isOwnProfile} 
                  onUpdate={loadAllContent}
                  userId={id}
                />
              )}
            />
          </div>

          {/* Documents Section - Owner only */}
          {isOwnProfile && (
            <div className="mt-8">
              <FamilyDocuments isOwnProfile={isOwnProfile} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FamilySocial;
