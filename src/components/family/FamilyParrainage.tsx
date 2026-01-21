import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Gift, CheckCircle2, XCircle, Loader2, Search, UserPlus, Share2, Copy, Check, Link2, Trash2, Edit, Eye, EyeOff, Clock, ThumbsUp, ThumbsDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface ReferredMember {
  id: string;
  referred_id: string;
  status: string;
  sponsor_approved: boolean;
  sponsor_approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  referred_profile: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    created_at: string;
  };
}

interface ReferralLink {
  id: string;
  link_code: string;
  link_name: string | null;
  referral_code: string;
  click_count: number;
  registration_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface FamilyParrainageProps {
  isEditable?: boolean;
  onUpdate?: () => void;
  userId?: string;
}

export const FamilyParrainage = ({ isEditable = false, onUpdate, userId }: FamilyParrainageProps) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [referredMembers, setReferredMembers] = useState<ReferredMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [maxReferrals, setMaxReferrals] = useState<number>(10);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);
  const [addingReferral, setAddingReferral] = useState(false);
  const [referralCode, setReferralCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [referralLinks, setReferralLinks] = useState<ReferralLink[]>([]);
  const [maxReferralLinks, setMaxReferralLinks] = useState<number>(5);
  const [newLinkDialogOpen, setNewLinkDialogOpen] = useState(false);
  const [newLinkName, setNewLinkName] = useState("");
  const [creatingLink, setCreatingLink] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  
  // Sponsor approval states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ReferredMember | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingApproval, setProcessingApproval] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const profileId = userId || user.id;

      // Charger les limites depuis les paramètres admin
      const { data: settingsData } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['max_referrals_per_user', 'max_referral_links_per_user']);

      if (settingsData) {
        const referralsSetting = settingsData.find(s => s.setting_key === 'max_referrals_per_user');
        const linksSetting = settingsData.find(s => s.setting_key === 'max_referral_links_per_user');
        
        if (referralsSetting?.setting_value) {
          setMaxReferrals(parseInt(referralsSetting.setting_value, 10) || 10);
        }
        if (linksSetting?.setting_value) {
          setMaxReferralLinks(parseInt(linksSetting.setting_value, 10) || 5);
        }
      }

      // Charger le code de parrainage (généré automatiquement par le trigger si absent)
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', profileId)
        .single();

      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
      } else {
        // Si le code n'existe toujours pas, le générer côté client
        const generatedCode = generateReferralCode();
        await supabase
          .from('profiles')
          .update({ referral_code: generatedCode })
          .eq('id', profileId);
        setReferralCode(generatedCode);
      }
      // Charger les membres parrainés depuis la table referrals
      const { data: referralsData, error: referralsError } = await (supabase as any)
        .from('referrals')
        .select('id, referred_id, status, sponsor_approved, sponsor_approved_at, rejection_reason, created_at')
        .eq('sponsor_id', profileId)
        .order('created_at', { ascending: false });

      if (referralsError) {
        console.error("Error loading referrals:", referralsError);
      }

      // Log pour déboguer
      console.log('Referrals chargés:', referralsData?.length || 0, 'références');
      if (referralsData && referralsData.length > 0) {
        console.log('Exemple de referral:', {
          id: referralsData[0].id,
          sponsor_approved: referralsData[0].sponsor_approved,
          status: referralsData[0].status
        });
      }

      // Pour chaque referral, charger le profil du membre parrainé
      const transformed = await Promise.all(
        (referralsData || []).map(async (ref: any) => {
          const { data: refProfile, error: profileError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, created_at')
            .eq('id', ref.referred_id)
            .maybeSingle();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error loading profile:', profileError);
          }

          return {
            id: ref.id,
            referred_id: ref.referred_id,
            status: ref.status || 'pending',
            // Normaliser : null ou undefined = false (non approuvé)
            sponsor_approved: ref.sponsor_approved === true ? true : false,
            sponsor_approved_at: ref.sponsor_approved_at,
            rejection_reason: ref.rejection_reason,
            created_at: ref.created_at,
            referred_profile: refProfile || null
          };
        })
      );

      // Filtrer les membres sans profil valide
      setReferredMembers(transformed.filter(m => m.referred_profile !== null));

      // Charger les liens de partage
      const { data: links, error: linksError } = await (supabase as any)
        .from('referral_links')
        .select('*')
        .eq('sponsor_id', profileId)
        .order('created_at', { ascending: false });

      if (linksError) throw linksError;
      setReferralLinks((links || []) as ReferralLink[]);
    } catch (error: any) {
      console.error("Error loading referrals:", error);
      toast.error(t('errorLoadingReferrals'));
    } finally {
      setIsLoading(false);
    }
  };

  const searchUserByEmail = async () => {
    if (!searchEmail.trim()) {
      toast.error(t('pleaseEnterUsernameNameOrFirstName'));
      return;
    }

    setSearching(true);
    try {
      // Rechercher l'utilisateur par username, first_name ou last_name
      const searchTerm = searchEmail.trim();
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, username')
        .or(`username.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;

      if (profiles && profiles.length > 0) {
        if (profiles.length === 1) {
          setFoundUser(profiles[0]);
        } else {
          // Si plusieurs résultats, prendre le premier qui correspond exactement au username
          const exactMatch = profiles.find(p => p.username?.toLowerCase() === searchTerm.toLowerCase());
          setFoundUser(exactMatch || profiles[0]);
          if (profiles.length > 1) {
            toast.info(t('multipleResultsFoundFirstSelected').replace('{count}', profiles.length.toString()));
          }
        }
      } else {
        toast.error(t('noUserFound'));
        setFoundUser(null);
      }
    } catch (error: any) {
      console.error("Error searching user:", error);
      toast.error(t('errorSearching'));
    } finally {
      setSearching(false);
    }
  };

  const addReferral = async () => {
    if (!foundUser) {
      toast.error(t('pleaseSearchUserFirst'));
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error(t('youMustBeConnected'));
      return;
    }

    const profileId = userId || user.id;

    // Vérifier la limite
    if (referredMembers.length >= maxReferrals) {
      toast.error(t('referralLimitReached').replace('{maxReferrals}', maxReferrals.toString()));
      return;
    }

    // Vérifier si l'utilisateur n'est pas déjà parrainé
    const { data: existing } = await (supabase as any)
      .from('referrals')
      .select('id')
      .eq('referred_id', foundUser.id)
      .maybeSingle();

    if (existing) {
      toast.error(t('userAlreadySponsored'));
      return;
    }

    // Vérifier qu'on ne se parraine pas soi-même
    if (foundUser.id === profileId) {
      toast.error(t('cannotSponsorYourself'));
      return;
    }

    setAddingReferral(true);
    try {
      // Récupérer le code de parrainage du sponsor
      const { data: sponsorProfile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', profileId)
        .single();

      const { error } = await (supabase as any)
        .from('referrals')
        .insert({
          sponsor_id: profileId,
          referred_id: foundUser.id,
          referral_code: sponsorProfile?.referral_code || '',
          status: 'confirmed'
        });

      if (error) throw error;

      toast.success(t('referralAddedSuccessfully'));
      setNewDialogOpen(false);
      setSearchEmail("");
      setFoundUser(null);
      loadData();
      onUpdate?.();
    } catch (error: any) {
      console.error("Error adding referral:", error);
      toast.error(error.message || t('errorAddingReferral'));
    } finally {
      setAddingReferral(false);
    }
  };

  const generateReferralCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "AURORA-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(referralCode);
        setCopied(true);
        toast.success(t('codeCopiedClipboard'));
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback: créer un élément textarea temporaire pour copier
        const textarea = document.createElement('textarea');
        textarea.value = referralCode;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          setCopied(true);
          toast.success("Code copié dans le presse-papiers");
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          toast.error(t('cannotCopyCode'));
        } finally {
          document.body.removeChild(textarea);
        }
      }
    } catch (error) {
      toast.error(t('cannotCopyCode'));
    }
  };

  const shareReferralLink = async () => {
    const shareUrl = `${window.location.origin}/register?ref=${referralCode}`;
    const shareData = {
      title: t('joinAuroraSociety'),
      text: t('inviteToJoinAuroraSociety').replace('{code}', referralCode),
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        // Utiliser l'API Clipboard si disponible
        await navigator.clipboard.writeText(shareUrl);
        toast.success(t('referralLinkCopiedClipboard'));
      } else {
        // Fallback: créer un élément textarea temporaire pour copier
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          toast.success(t('referralLinkCopiedClipboard'));
        } catch (err) {
          toast.error(t('cannotCopyLinkManually'));
        } finally {
          document.body.removeChild(textarea);
        }
      }
    } catch (error) {
      console.error("Error sharing:", error);
      // Si navigator.share échoue, essayer de copier dans le presse-papiers
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast.success(t('referralLinkCopiedClipboard'));
        } catch (clipboardError) {
          toast.error(t('cannotShareOrCopyLink'));
        }
      } else {
        toast.error(t('cannotShareOrCopyLink'));
      }
    }
  };

  const createReferralLink = async () => {
    if (!referralCode) {
      toast.error(t('referralCodeNotFound'));
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error(t('youMustBeConnected'));
      return;
    }

    const profileId = userId || user.id;

    // Vérifier la limite
    if (referralLinks.length >= maxReferralLinks) {
      toast.error(t('referralLinksLimitReached').replace('{maxReferralLinks}', maxReferralLinks.toString()));
      return;
    }

    setCreatingLink(true);
    try {
      // Générer le code de lien via une fonction edge ou directement
      const { data: linkData, error } = await (supabase as any)
        .from('referral_links')
        .insert({
          sponsor_id: profileId,
          link_name: newLinkName.trim() || null,
          referral_code: referralCode,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(t('shareLinkCreatedSuccessfully'));
      setNewLinkDialogOpen(false);
      setNewLinkName("");
      loadData();
      onUpdate?.();
    } catch (error: any) {
      console.error("Error creating link:", error);
      toast.error(error.message || t('errorCreatingLink'));
    } finally {
      setCreatingLink(false);
    }
  };

  const copyLinkToClipboard = async (link: ReferralLink) => {
    const linkUrl = `${window.location.origin}/register?link=${link.link_code}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(linkUrl);
        setCopiedLinkId(link.id);
        toast.success(t('linkCopiedClipboard'));
        setTimeout(() => setCopiedLinkId(null), 2000);
      } else {
        // Fallback: créer un élément textarea temporaire pour copier
        const textarea = document.createElement('textarea');
        textarea.value = linkUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          setCopiedLinkId(link.id);
          toast.success(t('linkCopiedClipboard'));
          setTimeout(() => setCopiedLinkId(null), 2000);
        } catch (err) {
          toast.error(t('cannotCopyLink'));
        } finally {
          document.body.removeChild(textarea);
        }
      }
    } catch (error) {
      toast.error(t('cannotCopyLink'));
    }
  };

  const shareLink = async (link: ReferralLink) => {
    const linkUrl = `${window.location.origin}/register?link=${link.link_code}`;
    const shareData = {
      title: t('joinAuroraSociety'),
      text: t('inviteToJoinAuroraSocietyWithLink').replace('{link}', linkUrl),
      url: linkUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        // Utiliser l'API Clipboard si disponible
        await navigator.clipboard.writeText(linkUrl);
        toast.success(t('referralLinkCopiedClipboard'));
      } else {
        // Fallback: créer un élément textarea temporaire pour copier
        const textarea = document.createElement('textarea');
        textarea.value = linkUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          toast.success(t('referralLinkCopiedClipboard'));
        } catch (err) {
          toast.error(t('cannotCopyLinkManually'));
        } finally {
          document.body.removeChild(textarea);
        }
      }
    } catch (error) {
      console.error("Error sharing:", error);
      // Si navigator.share échoue, essayer de copier dans le presse-papiers
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(linkUrl);
          toast.success(t('referralLinkCopiedClipboard'));
        } catch (clipboardError) {
          toast.error(t('cannotShareOrCopyLink'));
        }
      } else {
        toast.error(t('cannotShareOrCopyLink'));
      }
    }
  };

  const toggleLinkActive = async (link: ReferralLink) => {
    try {
      const { error } = await (supabase as any)
        .from('referral_links')
        .update({ is_active: !link.is_active })
        .eq('id', link.id);

      if (error) throw error;
      toast.success(link.is_active ? t('linkDeactivated') : t('linkActivated'));
      loadData();
      onUpdate?.();
    } catch (error: any) {
      toast.error(t('updateLinkError'));
    }
  };

  const deleteLink = async (link: ReferralLink) => {
    if (!confirm(t('deleteLinkConfirm').replace('{linkNameOrCode}', link.link_name || link.link_code))) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('referral_links')
        .delete()
        .eq('id', link.id);

      if (error) throw error;
      toast.success(t('linkDeleted'));
      loadData();
      onUpdate?.();
    } catch (error: any) {
      toast.error(t('deleteLinkError'));
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const localeMap: Record<string, string> = {
      'fr': 'fr-FR', 'en': 'en-US', 'es': 'es-ES', 'de': 'de-DE', 
      'it': 'it-IT', 'pt': 'pt-BR', 'ar': 'ar-SA', 'zh': 'zh-CN', 
      'ja': 'ja-JP', 'ru': 'ru-RU'
    };
    return new Date(dateString).toLocaleDateString(localeMap[language] || 'fr-FR', {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (member: ReferredMember) => {
    // Si le membre est rejeté par le parrain
    if (member.status === 'rejected' && member.rejection_reason) {
      return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="w-3 h-3 mr-1" />{t('rejected')}</Badge>;
    }
    
    // Si en attente d'approbation du parrain
    if (!member.sponsor_approved && member.status === 'pending') {
      return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20"><Clock className="w-3 h-3 mr-1" />{t('pendingSponsorApproval')}</Badge>;
    }
    
    switch (member.status) {
      case 'confirmed':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1" />{t('confirmed')}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">{t('pending')}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="w-3 h-3 mr-1" />{t('rejected')}</Badge>;
      default:
        return <Badge variant="outline">{member.status}</Badge>;
    }
  };

  // Approve a member's registration
  const approveMember = async () => {
    if (!selectedMember) return;
    
    setProcessingApproval(true);
    try {
      const { error } = await (supabase as any)
        .from('referrals')
        .update({ 
          sponsor_approved: true, 
          sponsor_approved_at: new Date().toISOString(),
          rejection_reason: null
        })
        .eq('id', selectedMember.id);

      if (error) throw error;

      toast.success(t('memberApproved'));
      setApproveDialogOpen(false);
      setSelectedMember(null);
      loadData();
      onUpdate?.();
    } catch (error: any) {
      console.error("Error approving member:", error);
      toast.error(error.message || t('error'));
    } finally {
      setProcessingApproval(false);
    }
  };

  // Reject a member's registration
  const rejectMember = async () => {
    if (!selectedMember) return;
    
    setProcessingApproval(true);
    try {
      const { error } = await (supabase as any)
        .from('referrals')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason || null,
          sponsor_approved: false
        })
        .eq('id', selectedMember.id);

      if (error) throw error;

      toast.success(t('memberRejected'));
      setRejectDialogOpen(false);
      setSelectedMember(null);
      setRejectionReason("");
      loadData();
      onUpdate?.();
    } catch (error: any) {
      console.error("Error rejecting member:", error);
      toast.error(error.message || t('error'));
    } finally {
      setProcessingApproval(false);
    }
  };

  // Filter members by approval status
  // Approuvés / confirmés / rejetés (historique)
  const approvedOrConfirmedMembers = referredMembers.filter(m => 
    m.sponsor_approved === true || m.status === 'confirmed' || m.status === 'rejected'
  );
  
  // En attente : uniquement les membres NON approuvés (sponsor_approved !== true) et NON rejetés
  const pendingApprovalMembers = referredMembers.filter(m => {
    const isNotApproved = m.sponsor_approved !== true; // false, null, ou undefined
    const isNotRejected = m.status !== 'rejected';
    return isNotApproved && isNotRejected;
  });
  
  // Log pour déboguer
  console.log('Membres totaux:', referredMembers.length);
  console.log('En attente d\'approbation:', pendingApprovalMembers.length);
  console.log('Approuvés/confirmés:', approvedOrConfirmedMembers.length);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gold" />
      </div>
    );
  }

  const currentCount = referredMembers.length;
  const remaining = Math.max(0, maxReferrals - currentCount);

  return (
    <div className="space-y-6">
      {/* Statistiques - Full Width */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-gold/10 to-transparent border-gold/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-gold/20">
                <Users className="h-6 w-6 text-gold" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{currentCount} / {maxReferrals}</p>
                <p className="text-sm text-muted-foreground">{t('referredMembers')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{remaining}</p>
                <p className="text-sm text-muted-foreground">{t('referralsRemaining')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <CheckCircle2 className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{maxReferrals}</p>
                <p className="text-sm text-muted-foreground">{t('totalLimit')}</p>
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

        {/* Colonne gauche : Code de parrainage et Liens */}
        <div className="space-y-4 sm:space-y-6">
          {/* Code de parrainage */}
          {referralCode && (
            <Card className="bg-gradient-to-br from-gold/5 to-transparent border-gold/20">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{t('yourShareableReferralCode')}</p>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-gold/20">
                      <p className="text-lg sm:text-xl font-mono font-bold text-gold flex-1 break-all">{referralCode}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyToClipboard}
                        className="h-8 w-8 p-0 border-gold/30 text-gold hover:bg-gold/10 flex-shrink-0"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="flex-1 border-gold/30 text-gold hover:bg-gold/10"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          {t('copied')}
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">{t('copyCode')}</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={shareReferralLink}
                      className="flex-1 bg-gold hover:bg-gold/90 text-primary-foreground h-9 sm:h-10 px-2 sm:px-4"
                    >
                      <Share2 className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">{t('share')}</span>
                    </Button>
                  </div>
                
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bouton ajouter */}
          {isEditable && remaining > 0 && (
            <Button
              onClick={() => setNewDialogOpen(true)}
              variant="outline"
              size="sm"
              className="w-full border-gold/30 text-gold hover:bg-gold/10"
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('sponsorNewMember')}</span>
            </Button>
          )}

          {isEditable && remaining === 0 && (
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                {t('limitReached').replace('{maxReferrals}', maxReferrals.toString())}
              </p>
            </div>
          )}

          {/* Section Liens de Partage */}
          <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Link2 className="h-5 w-5 text-gold" />
              {t('customShareLinks')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('trackInvitations').replace('{referralLinksLength}', referralLinks.length.toString()).replace('{maxReferralLinks}', maxReferralLinks.toString())}
            </p>
          </div>
          {isEditable && referralLinks.length < maxReferralLinks && (
            <Button
              onClick={() => setNewLinkDialogOpen(true)}
              variant="outline"
              size="sm"
              className="border-gold/30 text-gold hover:bg-gold/10"
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('createLink')}</span>
            </Button>
          )}
        </div>

        {referralLinks.length === 0 ? (
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="text-center py-6">
                <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-medium text-foreground mb-2">{t('noShareLink')}</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('createCustomLinksHint')}
                </p>
                {isEditable && (
                  <Button
                    onClick={() => setNewLinkDialogOpen(true)}
                    variant="outline"
                    size="sm"
                    className="border-gold/30 text-gold hover:bg-gold/10"
                  >
                    <Plus className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t('createYourFirstLink')}</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {referralLinks.map((link) => {
              const linkUrl = `${window.location.origin}/register?link=${link.link_code}`;
              return (
                <Card key={link.id} className={`${!link.is_active ? 'opacity-60' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-foreground">
                              {link.link_name || `${t('link')} ${link.link_code}`}
                            </h4>
                            {!link.is_active && (
                              <Badge variant="outline" className="text-xs">{t('inactive')}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded bg-muted/50 border border-border">
                            <code className="text-xs font-mono text-foreground flex-1 break-all">
                              {linkUrl}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyLinkToClipboard(link)}
                              className="h-7 w-7 p-0"
                            >
                              {copiedLinkId === link.id ? (
                                <Check className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">{t('clicks')}</p>
                          <p className="font-semibold text-foreground">{link.click_count}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t('registrations')}</p>
                          <p className="font-semibold text-foreground">{link.registration_count}</p>
                        </div>
                      </div> */}

                      {isEditable && (
                        <div className="flex items-center justify-between pt-2 ">
                          <div className="flex items-center gap-2">
                            {/* <Switch
                              checked={link.is_active}
                              onCheckedChange={() => toggleLinkActive(link)}
                            />
                            <Label className="text-sm">
                              {link.is_active ? t('active') : t('inactive')}
                            </Label> */}
                          </div>
                          <div className="flex gap-2">
                            {/* <Button
                              variant="outline"
                              size="sm"
                              onClick={() => shareLink(link)}
                              className="border-gold/30 text-gold hover:bg-gold/10"
                            >
                              <Share2 className="h-3.5 w-3.5 sm:mr-1.5" />
                              <span className="hidden sm:inline">{t('share')}</span>
                            </Button> */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteLink(link)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {isEditable && referralLinks.length >= maxReferralLinks && (
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              {t('referralLinksLimitReached').replace('{maxReferralLinks}', maxReferralLinks.toString())}
            </p>
          </div>
          )}
          </div>
        </div>

        {/* Colonne droite : Liste des membres parrainés */}
        <div className="space-y-4 sm:space-y-6">
          {/* Section: Membres en attente d'approbation - TOUJOURS VISIBLE SI isEditable */}
          {isEditable && (
            <div className="space-y-3">
              {pendingApprovalMembers.length > 0 ? (
                <>
                  <div className="bg-orange-500/10 border-2 border-orange-500/50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-2">
                      <AlertCircle className="h-6 w-6 text-orange-500 animate-pulse" />
                      {t('pendingApprovalMembers')} 
                      <Badge variant="destructive" className="ml-2">
                        {pendingApprovalMembers.length}
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('waitingForYourApproval')} - {pendingApprovalMembers.length} {pendingApprovalMembers.length === 1 ? t('member') : t('members')}
                    </p>
                  </div>
                  {pendingApprovalMembers.map((member) => (
                    <Card key={member.id} className="border-orange-500/30 bg-orange-500/5">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.referred_profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-gold/10 text-gold">
                              {member.referred_profile?.first_name?.[0]}{member.referred_profile?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-foreground">
                                {member.referred_profile?.first_name} {member.referred_profile?.last_name}
                              </h4>
                              {getStatusBadge(member)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {t('waitingForYourApproval')}
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-500/30 text-green-600 hover:bg-green-500/10 flex-1 sm:flex-initial"
                              onClick={(e) => { e.stopPropagation(); setSelectedMember(member); setApproveDialogOpen(true); }}
                            >
                              <ThumbsUp className="w-4 h-4 sm:mr-2" />
                              <span className="hidden sm:inline">{t('approve')}</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/30 text-red-600 hover:bg-red-500/10 flex-1 sm:flex-initial"
                              onClick={(e) => { e.stopPropagation(); setSelectedMember(member); setRejectDialogOpen(true); }}
                            >
                              <ThumbsDown className="w-4 h-4 sm:mr-2" />
                              <span className="hidden sm:inline">{t('reject')}</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : (
                <div className="bg-muted/30 border border-border rounded-lg p-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t('noPendingApprovals')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Section: Autres membres */}
          {referredMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">{t('noReferredMembers')}</h3>
              <p className="text-muted-foreground">
                {isEditable ? t('startSponsoringHint') : t('noReferralsRecorded')}
              </p>
            </div>
          ) : approvedOrConfirmedMembers.length > 0 && (
            <div className="space-y-3">
              {pendingApprovalMembers.length > 0 && (
                <h3 className="text-lg font-semibold text-foreground">{t('approvedMembers')}</h3>
              )}
              {approvedOrConfirmedMembers.map((member) => (
                <Card
                  key={member.id}
                  className="hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/profile/${member.referred_profile?.id}`)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.referred_profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gold/10 text-gold">
                          {member.referred_profile?.first_name?.[0]}{member.referred_profile?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground">
                            {member.referred_profile?.first_name} {member.referred_profile?.last_name}
                          </h4>
                          {getStatusBadge(member)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {member.sponsor_approved_at 
                            ? `${t('sponsorValidatedAt')} ${formatDate(member.sponsor_approved_at)}`
                            : `${t('sponsoredOn')} ${formatDate(member.created_at)}`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
        )}
        </div>
      </div>

      {/* Dialog pour ajouter un parrainage */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('sponsorNewMember')}</DialogTitle>
            <DialogDescription>
              {t('searchMemberToAddToReferrals').replace('{remaining}', remaining.toString())}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('searchByUsernameFirstNameLastName')}</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder={t('searchByUsernameFirstNameLastName')}
                  onKeyPress={(e) => e.key === 'Enter' && searchUserByEmail()}
                />
                <Button
                  onClick={searchUserByEmail}
                  disabled={searching}
                  className="bg-gold hover:bg-gold/90 text-primary-foreground"
                >
                  {searching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {foundUser && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={foundUser.avatar_url || undefined} />
                      <AvatarFallback className="bg-gold/10 text-gold">
                        {foundUser.first_name?.[0]}{foundUser.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-foreground">
                        {foundUser.first_name} {foundUser.last_name}
                      </h4>
                      <p className="text-sm text-muted-foreground">{t('userFound')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setNewDialogOpen(false);
                setSearchEmail("");
                setFoundUser(null);
              }}>
                {t('cancel')}
              </Button>
              <Button
                onClick={addReferral}
                disabled={!foundUser || addingReferral}
                className="bg-gold hover:bg-gold/90 text-primary-foreground"
              >
                {addingReferral ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t('adding')}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t('addReferral')}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog pour créer un nouveau lien */}
      <Dialog open={newLinkDialogOpen} onOpenChange={setNewLinkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('createNewShareLink')}</DialogTitle>
            <DialogDescription>
              {t('createCustomLinkHint').replace('{remainingLinks}', (maxReferralLinks - referralLinks.length).toString())}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="linkName">{t('linkNameOptional')}</Label>
              <Input
                id="linkName"
                value={newLinkName}
                onChange={(e) => setNewLinkName(e.target.value)}
                placeholder={t('exLinkedInInvitation')}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('giveNameToLinkHint')}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">{t('associatedReferralCode')}</p>
              <p className="font-mono font-semibold text-foreground">{referralCode}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewLinkDialogOpen(false);
                setNewLinkName("");
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={createReferralLink}
              disabled={creatingLink || !referralCode}
              className="bg-gold hover:bg-gold/90 text-primary-foreground"
            >
              {creatingLink ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {t('creating')}
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 mr-2" />
                  {t('createLink')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour approuver un membre */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-green-500" />
              {t('approveThisMember')}
            </DialogTitle>
            <DialogDescription>
              {t('approveThisMemberDesc')}
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedMember.referred_profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gold/10 text-gold">
                      {selectedMember.referred_profile?.first_name?.[0]}{selectedMember.referred_profile?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-foreground">
                      {selectedMember.referred_profile?.first_name} {selectedMember.referred_profile?.last_name}
                    </h4>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedMember.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={approveMember}
              disabled={processingApproval}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {processingApproval ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ThumbsUp className="w-4 h-4 mr-2" />}
              {t('approveMember')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour refuser un membre */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ThumbsDown className="w-5 h-5 text-red-500" />
              {t('rejectThisMember')}
            </DialogTitle>
            <DialogDescription>
              {t('rejectThisMemberDesc')}
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedMember.referred_profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gold/10 text-gold">
                      {selectedMember.referred_profile?.first_name?.[0]}{selectedMember.referred_profile?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-foreground">
                      {selectedMember.referred_profile?.first_name} {selectedMember.referred_profile?.last_name}
                    </h4>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <div className="space-y-2">
            <Label htmlFor="rejectionReason">{t('rejectionReason')}</Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t('rejectionReasonPlaceholder')}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialogOpen(false); setRejectionReason(""); }}>
              {t('cancel')}
            </Button>
            <Button
              onClick={rejectMember}
              disabled={processingApproval}
              variant="destructive"
            >
              {processingApproval ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ThumbsDown className="w-4 h-4 mr-2" />}
              {t('rejectMember')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

