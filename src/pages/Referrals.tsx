import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useReferrals, Referral, ReferralStats } from '@/hooks/useReferrals';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Copy, 
  CheckCircle2, 
  TrendingUp, 
  Calendar,
  UserPlus,
  Award,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const Referrals = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { 
    referrals, 
    stats, 
    referralCode, 
    loading, 
    error,
    getReferrer,
    refresh 
  } = useReferrals();
  
  const [copied, setCopied] = useState(false);
  const [referrer, setReferrer] = useState<any>(null);
  const [loadingReferrer, setLoadingReferrer] = useState(true);

  useEffect(() => {
    const loadReferrer = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setLoadingReferrer(true);
        const referrerData = await getReferrer(user.id);
        setReferrer(referrerData);
        setLoadingReferrer(false);
      }
    };
    loadReferrer();
  }, [getReferrer]);

  const handleCopyCode = async () => {
    if (!referralCode) return;
    
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast.success(t('copied') || 'Code copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error(t('error') || 'Erreur lors de la copie');
    }
  };

  const handleShareCode = () => {
    const shareText = `${t('referralInvite') || 'Rejoignez-moi sur Aurora Society avec mon code de parrainage'}: ${referralCode}`;
    const shareUrl = `${window.location.origin}/register?ref=${referralCode}`;
    
    if (navigator.share) {
      navigator.share({
        title: t('referralInvite') || 'Rejoignez Aurora Society',
        text: shareText,
        url: shareUrl
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success(t('linkCopied') || 'Lien copié !');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-gold p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gold/60">{t('loading') || 'Chargement...'}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gold p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-gold hover:text-gold hover:bg-gold/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-serif text-gold">
                {t('myReferralNetwork') || 'Mon Réseau de Parrainage'}
              </h1>
              <p className="text-gold/60 mt-1">
                {t('referralNetworkDescription') || 'Gérez vos parrainages et invitez de nouveaux membres'}
              </p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="bg-red-950/20 border-red-500/50">
            <CardContent className="pt-6">
              <p className="text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Referral Code & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* My Referral Code */}
            <Card className="bg-black/50 border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  {t('myReferralCode') || 'Mon Code de Parrainage'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/50 border border-gold/30 rounded-lg p-4">
                    <p className="text-2xl font-mono font-bold text-gold text-center">
                      {referralCode || '---'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyCode}
                    className="border-gold/30 text-gold hover:bg-gold/10"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={handleShareCode}
                  className="w-full bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20"
                  variant="outline"
                >
                  {t('shareCode') || 'Partager mon code'}
                </Button>
                <p className="text-sm text-gold/60 text-center">
                  {t('referralCodeHelp') || 'Partagez ce code avec vos contacts pour les inviter à rejoindre Aurora Society'}
                </p>
              </CardContent>
            </Card>

            {/* Statistics */}
            {stats && (
              <Card className="bg-black/50 border-gold/20">
                <CardHeader>
                  <CardTitle className="text-gold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {t('statistics') || 'Statistiques'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gold/80">{t('totalReferrals') || 'Total parrainages'}</span>
                      <span className="text-2xl font-bold text-gold">{stats.total_referrals || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gold/80">{t('thisMonth') || 'Ce mois'}</span>
                      <span className="text-xl font-semibold text-gold">{stats.referrals_this_month || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gold/80">{t('thisYear') || 'Cette année'}</span>
                      <span className="text-xl font-semibold text-gold">{stats.referrals_this_year || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* My Referrer */}
            {!loadingReferrer && referrer && (
              <Card className="bg-black/50 border-gold/20">
                <CardHeader>
                  <CardTitle className="text-gold flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    {t('myReferrer') || 'Mon Parrain'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {referrer.referrer_profile && (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border border-gold/30">
                        <AvatarImage src={referrer.referrer_profile.avatar_url || undefined} />
                        <AvatarFallback className="bg-gold/10 text-gold">
                          {getInitials(
                            referrer.referrer_profile.first_name,
                            referrer.referrer_profile.last_name
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gold">
                          {referrer.referrer_profile.first_name} {referrer.referrer_profile.last_name}
                        </p>
                        <p className="text-sm text-gold/60">
                          {formatDate(referrer.created_at)}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Referrals List */}
          <div className="lg:col-span-2">
            <Card className="bg-black/50 border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t('myReferrals') || 'Mes Filleuls'}
                  {referrals.length > 0 && (
                    <span className="ml-2 text-gold/60 text-lg font-normal">
                      ({referrals.length})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {referrals.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gold/30 mx-auto mb-4" />
                    <p className="text-gold/60 text-lg mb-2">
                      {t('noReferralsYet') || 'Aucun parrainage pour le moment'}
                    </p>
                    <p className="text-gold/40 text-sm">
                      {t('shareCodeToInvite') || 'Partagez votre code pour inviter de nouveaux membres'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {referrals.map((referral) => (
                      <div
                        key={referral.id}
                        className="flex items-center gap-4 p-4 bg-black/30 rounded-lg border border-gold/10 hover:border-gold/30 transition-colors"
                      >
                        <Avatar className="h-12 w-12 border border-gold/30">
                          <AvatarImage 
                            src={referral.referred_profile?.avatar_url || undefined} 
                          />
                          <AvatarFallback className="bg-gold/10 text-gold">
                            {referral.referred_profile 
                              ? getInitials(
                                  referral.referred_profile.first_name,
                                  referral.referred_profile.last_name
                                )
                              : '??'
                            }
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-gold">
                            {referral.referred_profile 
                              ? `${referral.referred_profile.first_name} ${referral.referred_profile.last_name}`
                              : 'Membre'
                            }
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gold/60">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(referral.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium",
                            referral.status === 'completed' 
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-gold/20 text-gold border border-gold/30"
                          )}>
                            {referral.status === 'completed' 
                              ? t('completed') || 'Complété'
                              : t('pending') || 'En attente'
                            }
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Referrals;

