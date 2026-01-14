import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart, Users, Trophy, Crown, Star,
  Network, GitBranch, Gift
} from "lucide-react";
import { Header } from "@/components/Header";
import { FamilyDocuments } from "@/components/FamilyDocuments";
import { PageHeaderBackButton } from "@/components/BackButton";
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
  const [isLoading, setIsLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
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
  }, [id, navigate, t]);

  const loadAllContent = async () => {
    setIsCheckingAccess(true);
    setIsLoading(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error(t('errorLoadingContent'));
        navigate("/login");
        return;
      }

      const currentProfileId = id || user.id;
      setProfileId(currentProfileId);
      const isOwn = currentProfileId === user.id;
      setIsOwnProfile(isOwn);

      // Check access if viewing another user's profile
      if (!isOwn) {
        // Check friendship in both directions
        const { data: friendships, error: friendshipError } = await supabase
          .from('friendships')
          .select('family_access')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

        if (friendshipError) {
          console.error('Error checking friendship:', friendshipError);
          toast.error(t('errorLoadingContent'));
          setIsCheckingAccess(false);
          setIsLoading(false);
          return;
        }

        // Find the friendship where the other user is involved
        const friendship = friendships?.find(
          (f: any) =>
            (f.user_id === user.id && f.friend_id === currentProfileId) ||
            (f.user_id === currentProfileId && f.friend_id === user.id)
        );

        if (!friendship || !friendship.family_access) {
          setHasAccess(false);
          setIsCheckingAccess(false);
          setIsLoading(false);
          return;
        }
        setHasAccess(true);
      } else {
        setHasAccess(true);
      }
      setIsCheckingAccess(false);

      // Load all data in parallel for better performance
      const [
        { data: profileData, error: profileError },
        { data: content, error: contentError },
        { data: lineage, error: lineageError },
        { data: close, error: closeError },
        { data: influential, error: influentialError },
        { data: board, error: boardError },
        { data: comms, error: commsError },
        { data: her, error: herError }
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', currentProfileId)
          .single(),
        supabase
          .from('family_content')
          .select('*')
          .eq('user_id', currentProfileId)
          .maybeSingle(),
        supabase
          .from('family_lineage')
          .select('*')
          .eq('user_id', currentProfileId)
          .order('display_order'),
        supabase
          .from('family_close')
          .select('*')
          .eq('user_id', currentProfileId)
          .order('display_order'),
        supabase
          .from('family_influential')
          .select('*')
          .eq('user_id', currentProfileId)
          .order('display_order'),
        supabase
          .from('family_board')
          .select('*')
          .eq('user_id', currentProfileId)
          .order('display_order'),
        supabase
          .from('family_commitments')
          .select('*')
          .eq('user_id', currentProfileId)
          .order('display_order'),
        supabase
          .from('family_heritage')
          .select('*')
          .eq('user_id', currentProfileId)
          .maybeSingle()
      ]);

      // Handle errors
      if (profileError) {
        console.error('Error loading profile:', profileError);
        toast.error(t('errorLoadingContent'));
      } else if (profileData) {
        setProfile(profileData);
      }

      if (contentError) {
        console.error('Error loading family content:', contentError);
      } else if (content) {
        setFamilyContent(content);
      }

      if (lineageError) {
        console.error('Error loading lineage:', lineageError);
      } else {
        setLineageEntries(lineage || []);
      }

      if (closeError) {
        console.error('Error loading close members:', closeError);
      } else {
        setCloseMembers(close || []);
      }

      if (influentialError) {
        console.error('Error loading influential people:', influentialError);
      } else {
        setInfluentialPeople(influential || []);
      }

      if (boardError) {
        console.error('Error loading board members:', boardError);
      } else {
        setBoardMembers(board || []);
      }

      if (commsError) {
        console.error('Error loading commitments:', commsError);
      } else {
        setCommitments(comms || []);
      }

      if (herError) {
        console.error('Error loading heritage:', herError);
      } else if (her) {
        setHeritage(her);
      }

    } catch (error) {
      console.error('Error loading content:', error);
      toast.error(t('errorLoadingContent'));
      setIsCheckingAccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAccess || isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background text-foreground pt-24 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
            <p className="text-gold/60 text-sm">{t('loading')}</p>
          </div>
        </div>
      </>
    );
  }

  if (!isOwnProfile && !hasAccess) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background text-foreground pt-24 flex items-center justify-center safe-area-all">
          <div className="text-center max-w-md px-4">
            <div className="mb-6">
              <Users className="w-16 h-16 text-gold/30 mx-auto mb-4" />
              <h2 className="text-xl font-serif text-gold mb-2">{t('accessRestricted')}</h2>
              <p className="text-gold/60 text-sm mb-4">{t('noAccessToSection')}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(id ? `/profile/${id}` : "/profile")}
              className="border-gold/30 hover:bg-gold/10"
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
      <div className="min-h-screen bg-background text-foreground pt-20 sm:pt-24 safe-area-all">
        {/* Header */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-16 sm:top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center">
              {/* <PageHeaderBackButton to={id ? `/profile/${id}` : "/profile"} /> */}
              <PageHeaderBackButton to={"/member-card"} />
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif text-gold tracking-wide">{t('lineageAlliancesHeritage')}</h1>
                <p className="text-gold/60 text-xs sm:text-sm mt-1">{t('preserveFamilyHistory')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 mt-12 overflow-x-hidden">
          {/* Profile Summary Card */}
          <Card className="module-card rounded-xl mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-gold/5 pointer-events-none" />
            <CardHeader className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-2xl sm:text-3xl font-serif mb-2 text-gold">
                    {profile ? `${profile.first_name} ${profile.last_name}` : t('member')}
                  </CardTitle>
                  <CardDescription className="text-base sm:text-lg text-gold/80">
                    {profile?.honorific_title || profile?.job_function || t('memberAurora')}
                  </CardDescription>
                </div>
                <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
                  {profile?.is_founder && (
                    <Badge className="bg-gold text-black whitespace-nowrap">
                      <Trophy className="w-3 h-3 mr-1" />
                      {t('founder')}
                    </Badge>
                  )}
                  {profile?.is_patron && (
                    <Badge className="bg-gold text-black whitespace-nowrap">
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

            {/* Module 6: Héritage & Transmission - Full Width */}
            <div className="col-span-1 lg:col-span-2">
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
            </div>

            {/* Module 7: Parrainage - Full Width */}
            {isOwnProfile && profileId && (
              <div className="col-span-1 lg:col-span-2">
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
                      userId={profileId}
                    />
                  )}
                />
              </div>
            )}


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
