import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Gift, CheckCircle2, XCircle, Loader2, Search, UserPlus, Share2, Copy, Check, Link2, Trash2, Edit, Eye, EyeOff, Clock, ThumbsUp, ThumbsDown, AlertCircle, Calendar, User } from "lucide-react";
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
import { SingleUseInvitationCodes } from "./SingleUseInvitationCodes";

interface ReferredMember {
  id: string;
  referred_id: string;
  status: string;
  sponsor_approved: boolean;
  sponsor_approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  // Le profil peut ne pas encore être créé au moment de l'inscription via lien
  referred_profile: {
    id?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string | null;
    created_at?: string;
  } | null;
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

interface SecondaryReferralCode {
  id: string;
  user_id: string;
  invitation_code: string;
  code_name: string | null;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  is_active: boolean;
  created_at: string;
  used_by_profile?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
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
  
  // Invitation states
  const [newInviteCode, setNewInviteCode] = useState<string>("");
  const [newInviteLink, setNewInviteLink] = useState<string>("");
  const [inviteLinkName, setInviteLinkName] = useState<string>("");
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  
  // Secondary referral codes states
  const [secondaryCodes, setSecondaryCodes] = useState<SecondaryReferralCode[]>([]);
  const [newCodeDialogOpen, setNewCodeDialogOpen] = useState(false);
  const [newCodeName, setNewCodeName] = useState<string>("");
  const [creatingNewCode, setCreatingNewCode] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

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

      // Pour chaque referral, charger le profil du membre parrainé (s'il existe déjà)
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
            // On garde même si le profil n'existe pas encore : le parrain doit tout de même voir la demande
            referred_profile: refProfile || null
          };
        })
      );

      // Ne plus filtrer : inclure aussi les membres dont le profil n'est pas encore complété
      setReferredMembers(transformed as ReferredMember[]);

      // Charger les liens de partage
      const { data: links, error: linksError } = await (supabase as any)
        .from('referral_links')
        .select('*')
        .eq('sponsor_id', profileId)
        .order('created_at', { ascending: false });

      if (linksError) throw linksError;
      setReferralLinks((links || []) as ReferralLink[]);

      // Charger les codes d'invitation à usage unique
      const { data: secondaryCodesData, error: secondaryCodesError } = await (supabase as any)
        .from('single_use_invitation_codes')
        .select('*')
        .eq('user_id', profileId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (secondaryCodesError) {
        console.error("Error loading invitation codes:", secondaryCodesError);
      } else {
        // Récupérer les profils des membres qui ont utilisé les codes
        const codesWithProfiles = await Promise.all(
          (secondaryCodesData || []).map(async (code: any) => {
            if (code.is_used && code.used_by) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, last_name, avatar_url')
                .eq('id', code.used_by)
                .maybeSingle();
              return { ...code, used_by_profile: profile };
            }
            return { ...code, used_by_profile: null };
          })
        );
        setSecondaryCodes(codesWithProfiles as SecondaryReferralCode[]);
      }
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

  const createSecondaryReferralCode = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error(t('youMustBeConnected'));
      return;
    }

    const profileId = userId || user.id;
    setCreatingNewCode(true);

    try {
      // Générer un code unique
      let newCode: string = "";
      let codeExists = true;
      let attempts = 0;
      
      while (codeExists && attempts < 10) {
        newCode = generateReferralCode();
        // Vérifier l'unicité dans single_use_invitation_codes
        const { data: existingCode } = await (supabase as any)
          .from('single_use_invitation_codes')
          .select('id')
          .eq('invitation_code', newCode)
          .maybeSingle();
        
        if (!existingCode) {
          codeExists = false;
        }
        attempts++;
      }

      if (codeExists) {
        toast.error(t('errorGeneratingUniqueCode') || 'Erreur lors de la génération d\'un code unique');
        return;
      }

      // Créer le code d'invitation à usage unique
      const { error } = await (supabase as any)
        .from('single_use_invitation_codes')
        .insert({
          user_id: profileId,
          invitation_code: newCode,
          code_name: newCodeName.trim() || null,
          is_active: true,
          is_used: false
        });

      if (error) throw error;

      toast.success(t('secondaryCodeCreatedSuccessfully') || 'Code de parrainage créé avec succès');
      setNewCodeDialogOpen(false);
      setNewCodeName("");
      loadData();
      onUpdate?.();
    } catch (error: any) {
      console.error("Error creating invitation code:", error);
      toast.error(error.message || t('errorCreatingSecondaryCode') || 'Erreur lors de la création du code');
    } finally {
      setCreatingNewCode(false);
    }
  };

  const copySecondaryCode = async (code: string, codeId: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code);
        setCopiedCodeId(codeId);
        toast.success(t('codeCopiedClipboard'));
        setTimeout(() => setCopiedCodeId(null), 2000);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          setCopiedCodeId(codeId);
          toast.success(t('codeCopiedClipboard'));
          setTimeout(() => setCopiedCodeId(null), 2000);
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

  const deleteSecondaryCode = async (codeId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('single_use_invitation_codes')
        .update({ is_active: false })
        .eq('id', codeId);

      if (error) throw error;

      toast.success(t('secondaryCodeDeletedSuccessfully') || 'Code de parrainage supprimé avec succès');
      loadData();
      onUpdate?.();
    } catch (error: any) {
      console.error("Error deleting invitation code:", error);
      toast.error(error.message || t('errorDeletingSecondaryCode') || 'Erreur lors de la suppression du code');
    }
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

  const createInviteLink = async () => {
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

    setCreatingInvite(true);
    try {
      // Récupérer le code de parrainage du sponsor
      const { data: sponsorProfile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', profileId)
        .single();

      if (!sponsorProfile?.referral_code) {
        toast.error(t('referralCodeNotFound'));
        return;
      }

      // Générer un code de lien unique
      const generateLinkCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "AURORA-LINK-";
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      const linkCode = generateLinkCode();
      const linkName = inviteLinkName.trim() || t('newMemberInvitation') || 'Invitation nouveau membre';

      // Créer le lien de partage
      const { data: linkData, error } = await (supabase as any)
        .from('referral_links')
        .insert({
          sponsor_id: profileId,
          link_name: linkName,
          link_code: linkCode,
          referral_code: sponsorProfile.referral_code,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      const inviteUrl = `${window.location.origin}/register?link=${linkCode}`;
      setNewInviteCode(linkCode);
      setNewInviteLink(inviteUrl);
      
      toast.success(t('inviteLinkCreatedSuccessfully') || 'Lien d\'invitation créé avec succès');
      setInviteLinkName("");
      loadData();
      onUpdate?.();
    } catch (error: any) {
      console.error("Error creating invite link:", error);
      toast.error(error.message || t('errorCreatingLink') || 'Erreur lors de la création du lien');
    } finally {
      setCreatingInvite(false);
    }
  };

  const copyInviteLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(newInviteLink);
        setInviteCopied(true);
        toast.success(t('linkCopiedClipboard') || 'Lien copié dans le presse-papiers');
        setTimeout(() => setInviteCopied(false), 2000);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = newInviteLink;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          setInviteCopied(true);
          toast.success(t('linkCopiedClipboard') || 'Lien copié dans le presse-papiers');
          setTimeout(() => setInviteCopied(false), 2000);
        } catch (err) {
          toast.error(t('cannotCopyLink') || 'Impossible de copier le lien');
        } finally {
          document.body.removeChild(textarea);
        }
      }
    } catch (error) {
      toast.error(t('cannotCopyLink') || 'Impossible de copier le lien');
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

  // En attente : uniquement les membres NON approuvés et NON rejetés
  const pendingApprovalMembers = referredMembers.filter(m => {
    const isNotApproved = m.sponsor_approved !== true;
    const isNotRejected = m.status !== 'rejected';
    return isNotApproved && isNotRejected;
  });

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
      {/* Deux colonnes : Codes d'invitation | Parrainages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">

        {/* Colonne gauche : Codes d'invitation */}
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-gold shrink-0" />
            <h2 className="text-lg font-semibold text-foreground">{t('singleUseInvitationCodes') || 'Codes d\'invitation'}</h2>
          </div>

          {/* Code de parrainage initial */}
          {referralCode && (
            <Card className={`rounded-xl border bg-card overflow-hidden ${referredMembers.length > 0 ? 'border-muted/40 from-muted/10 to-transparent' : 'border-gold/20 from-gold/5 to-transparent'}`}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground mb-1">{t('initialInvitationCode') || 'Code d\'invitation initial'}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-base font-mono font-bold ${referredMembers.length > 0 ? 'text-muted-foreground line-through' : 'text-gold'}`}>
                        {referralCode}
                      </p>
                      {referredMembers.length > 0 ? (
                        <Badge variant="secondary" className="text-xs">
                          {t('used') || 'Utilisé'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs border-green-500/50 text-green-600">
                          {t('available') || 'Disponible'}
                        </Badge>
                      )}
                    </div>
                    {referredMembers.length > 0 && (
                      <div className="mt-2 flex items-center gap-2 p-2 rounded-md bg-muted/30">
                        {referredMembers[0]?.referred_profile ? (
                          <>
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarImage src={referredMembers[0].referred_profile.avatar_url || undefined} />
                              <AvatarFallback className="text-xs bg-gold/20 text-gold">
                                {referredMembers[0].referred_profile.first_name?.[0]}
                                {referredMembers[0].referred_profile.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground">
                                {t('codeUsedBy') || 'Utilisé par'}: {[referredMembers[0].referred_profile.first_name, referredMembers[0].referred_profile.last_name].filter(Boolean).join(' ') || t('unknownMember')}
                                {referredMembers.length > 1 && ` +${referredMembers.length - 1} ${t('other') || 'autre(s)'}`}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3 shrink-0" />
                                {referredMembers.length} {referredMembers.length === 1 ? (t('member') || 'membre') : (t('members') || 'membres')} {t('referred') || 'parrainé(s)'}
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground shrink-0" />
                            <p className="text-xs text-muted-foreground">
                              {t('codeUsedBy') || 'Utilisé par'}: {referredMembers.length} {referredMembers.length === 1 ? (t('member') || 'membre') : (t('members') || 'membres')} {t('referred') || 'parrainé(s)'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyToClipboard}
                      className="h-8 w-8 p-0 text-gold hover:bg-gold/10"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


          {isEditable && remaining === 0 && (
            <div className="rounded-xl p-4 bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                {t('limitReached').replace('{maxReferrals}', maxReferrals.toString())}
              </p>
            </div>
          )}

          {/* Codes à usage unique */}
          {userId && (
            <div className="space-y-3">
              <SingleUseInvitationCodes
                isEditable={isEditable}
                userId={userId}
                onUpdate={onUpdate}
                hasInitialCode={!!referralCode}
                initialCodeUsed={referredMembers.length > 0}
              />
            </div>
          )}

          {/* Section Liens de Partage */}
          <div className="space-y-4">
        {/* <div className="flex items-center justify-between">
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
        </div> */}


        {/* {referralLinks.length === 0 ? (
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

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">{t('clicks')}</p>
                          <p className="font-semibold text-foreground">{link.click_count}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t('registrations')}</p>
                          <p className="font-semibold text-foreground">{link.registration_count}</p>
                        </div>
                      </div>

                      {isEditable && (
                        <div className="flex items-center justify-between pt-2 ">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={link.is_active}
                              onCheckedChange={() => toggleLinkActive(link)}
                            />
                            <Label className="text-sm">
                              {link.is_active ? t('active') : t('inactive')}
                            </Label>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => shareLink(link)}
                              className="border-gold/30 text-gold hover:bg-gold/10"
                            >
                              <Share2 className="h-3.5 w-3.5 sm:mr-1.5" />
                              <span className="hidden sm:inline">{t('share')}</span>
                            </Button>
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
        )} */}

        {isEditable && referralLinks.length >= maxReferralLinks && (
          <div className="rounded-xl p-4 sm:p-5 bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {t('referralLinksLimitReached').replace('{maxReferralLinks}', maxReferralLinks.toString())}
            </p>
          </div>
        )}
          </div>
        </div>

        {/* Colonne droite : Parrainages (liste des membres parrainés) */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gold shrink-0" />
            <h2 className="text-lg font-semibold text-foreground">{t('referrals') || 'Parrainages'}</h2>
          </div>

          {/* Section: Membres en attente d'approbation - TOUJOURS VISIBLE SI isEditable */}
          {isEditable && (
            <div className="space-y-3">
              {pendingApprovalMembers.length > 0 ? (
                <>
                  <div className="rounded-xl p-4 sm:p-5 bg-orange-500/10 border border-orange-500/30">
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-1">
                      <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
                      {t('pendingApprovalMembers')}
                      <Badge variant="destructive" className="text-xs">
                        {pendingApprovalMembers.length}
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('waitingForYourApproval')} — {pendingApprovalMembers.length} {pendingApprovalMembers.length === 1 ? t('member') : t('members')}
                    </p>
                  </div>
                  {pendingApprovalMembers.map((member) => (
                    <Card key={member.id} className="rounded-xl border border-orange-500/20 bg-card overflow-hidden">
                      <CardContent className="p-4 sm:p-5">
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
                <Card className="rounded-xl border border-border bg-card overflow-hidden">
                  <CardContent className="p-6 text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">{t('noPendingApprovals')}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t('noPendingApprovalsDesc') || 'Aucune demande en attente.'}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {referredMembers.length === 0 && (
            <Card className="rounded-xl border border-border bg-card overflow-hidden">
              <CardContent className="p-6 sm:p-8 text-center">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">{t('noReferredMembers')}</p>
                <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">
                  {isEditable ? t('startSponsoringHint') : t('noReferralsRecorded')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog pour inviter un nouveau membre */}
      <Dialog open={newDialogOpen} onOpenChange={(open) => {
        setNewDialogOpen(open);
        if (!open) {
          setNewInviteCode("");
          setNewInviteLink("");
          setInviteLinkName("");
          setInviteCopied(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('sponsorNewMember')}</DialogTitle>
            <DialogDescription>
              {t('inviteNewMemberWithCode') || 'Générez un code d\'invitation unique pour inviter un nouveau membre'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!newInviteLink ? (
              <>
                <div>
                  <Label htmlFor="inviteLinkName">{t('linkNameOptional') || 'Nom du lien (optionnel)'}</Label>
                  <Input
                    id="inviteLinkName"
                    value={inviteLinkName}
                    onChange={(e) => setInviteLinkName(e.target.value)}
                    placeholder={t('exNewMemberInvitation') || 'Ex: Invitation nouveau membre'}
                    className="mt-2"
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNewDialogOpen(false);
                      setInviteLinkName("");
                    }}
                    size="sm"
                    className="w-full sm:w-auto text-sm"
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    onClick={createInviteLink}
                    disabled={creatingInvite}
                    size="sm"
                    className="w-full sm:w-auto bg-gold hover:bg-gold/90 text-primary-foreground text-sm"
                  >
                    {creatingInvite ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        {t('creating') || 'Création...'}
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">{t('generateInviteCode') || 'Générer le code'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <Label>{t('inviteCode') || 'Code d\'invitation'}</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newInviteCode}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        onClick={copyInviteLink}
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                      >
                        {inviteCopied ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>{t('inviteLink') || 'Lien d\'invitation'}</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newInviteLink}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        onClick={copyInviteLink}
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                      >
                        {inviteCopied ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-muted/50 border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      {t('inviteLinkInstructions') || 'Partagez ce lien avec le nouveau membre. Il pourra s\'inscrire en utilisant ce code d\'invitation unique.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNewDialogOpen(false);
                      setNewInviteCode("");
                      setNewInviteLink("");
                      setInviteLinkName("");
                      setInviteCopied(false);
                    }}
                    size="sm"
                    className="w-full sm:w-auto text-sm"
                  >
                    {t('close') || 'Fermer'}
                  </Button>
                  <Button
                    onClick={copyInviteLink}
                    size="sm"
                    className="w-full sm:w-auto bg-gold hover:bg-gold/90 text-primary-foreground text-sm"
                  >
                    <Share2 className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t('copyLink') || 'Copier le lien'}</span>
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog pour créer un nouveau code de parrainage */}
      <Dialog open={newCodeDialogOpen} onOpenChange={(open) => {
        setNewCodeDialogOpen(open);
        if (!open) {
          setNewCodeName("");
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('createNewReferralCode') || 'Créer un nouveau code de parrainage'}</DialogTitle>
            <DialogDescription>
              {t('createSecondaryCodeDescription') || 'Créez un deuxième code de parrainage unique pour inviter de nouveaux membres.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="codeName">{t('codeNameOptional') || 'Nom du code (optionnel)'}</Label>
              <Input
                id="codeName"
                value={newCodeName}
                onChange={(e) => setNewCodeName(e.target.value)}
                placeholder={t('exFamilyInvitation') || 'Ex: Invitation famille'}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('codeNameHint') || 'Donnez un nom à ce code pour le distinguer de votre code principal'}
              </p>
            </div>

            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                {t('secondaryCodeInfo') || 'Un nouveau code unique sera généré automatiquement au format AURORA-XXXXXX. Ce code pourra être utilisé pour parrainer de nouveaux membres.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setNewCodeDialogOpen(false);
                  setNewCodeName("");
                }}
                size="sm"
                className="w-full sm:w-auto text-sm"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={createSecondaryReferralCode}
                disabled={creatingNewCode}
                size="sm"
                className="w-full sm:w-auto bg-gold hover:bg-gold/90 text-primary-foreground text-sm"
              >
                {creatingNewCode ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t('creating') || 'Création...'}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t('createCode') || 'Créer le code'}</span>
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
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
              size="sm"
              className="w-full sm:w-auto text-sm"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={approveMember}
              disabled={processingApproval}
              size="sm"
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white text-sm"
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
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => { setRejectDialogOpen(false); setRejectionReason(""); }}
              size="sm"
              className="w-full sm:w-auto text-sm"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={rejectMember}
              disabled={processingApproval}
              variant="destructive"
              size="sm"
              className="w-full sm:w-auto text-sm"
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

