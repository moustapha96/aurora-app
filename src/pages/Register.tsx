import { AuroraLogo } from "@/components/AuroraLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage, languages } from "@/contexts/LanguageContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Globe, Crown, ArrowLeft, Eye, EyeOff, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INDUSTRIES } from "@/lib/industries";
import { RegistrationVerification } from "@/components/RegistrationVerification";

import { RegistrationProfileVerification } from "@/components/RegistrationProfileVerification";
import { Captcha, useCaptchaConfig } from "@/components/Captcha";

type RegistrationStep = 'form' | 'verification';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language, setLanguage, t } = useLanguage();
  const { siteKey, isEnabled } = useCaptchaConfig('register');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Vérifier si on doit afficher directement la vérification
  const stepParam = searchParams.get('step');
  const verificationParam = searchParams.get('verification');
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>(
    stepParam === 'verification' || Boolean(verificationParam) ? 'verification' : 'form'
  );

  // Récupérer les données d'inscription depuis sessionStorage si on revient de Veriff
  const [verificationData, setVerificationData] = useState<{firstName: string; lastName: string; email: string} | null>(null);
  const [verificationImages, setVerificationImages] = useState<{ idImage: string; selfieImage: string } | null>(null);
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [profilePhotoVerified, setProfilePhotoVerified] = useState(false);
  const [profilePhotoReason, setProfilePhotoReason] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralCodeValid, setReferralCodeValid] = useState<boolean | null>(null);
  const [checkingReferralCode, setCheckingReferralCode] = useState(false);
  const [usedReferralLink, setUsedReferralLink] = useState<string | null>(null);
  const [validatedCode, setValidatedCode] = useState<string | null>(null); // Stocker le code déjà validé
  const [isFamilyRegistration, setIsFamilyRegistration] = useState(false);
  const [formData, setFormData] = useState({
    referralCode: "",
    firstName: "",
    lastName: "",
    honorificTitle: "",
    email: "",
    mobile: "",
    jobFunction: "",
    activityDomain: "",
    personalQuote: "",
    isFounder: false,
    wealthAmount: "",
    wealthUnit: "M",
    wealthCurrency: "EUR",
    password: "",
    confirmPassword: "",
    username: "",
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setProfilePhotoVerified(false);
      setProfilePhotoReason('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePhotoVerification = (isValid: boolean, reason: string) => {
    setProfilePhotoVerified(isValid);
    setProfilePhotoReason(reason);
    if (isValid) {
      toast.success(t('profilePhotoValidated'));
    } else {
      toast.error(reason || t('profilePhotoNonCompliant'));
    }
  };


  // Ref pour le debounce du code de parrainage
  const referralCodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Vérifier le code de parrainage dans la base de données
  const checkReferralCode = async (code: string) => {
    if (!code || code.trim().length === 0) {
      setReferralCodeValid(null);
      setValidatedCode(null);
      return;
    }

    const trimmedCode = code.trim();

    // Si le code est déjà validé et qu'il n'a pas changé, ne pas re-vérifier
    if (validatedCode === trimmedCode && referralCodeValid === true) {
      return;
    }

    // Vérifier le format du code
    // - Le champ attend un CODE (AURORA-XXXXXX)
    // - Un lien (AURORA-LINK-XXXXXX) doit être passé via l'URL ?link=
    if (trimmedCode.startsWith('AURORA-LINK-')) {
      setReferralCodeValid(false);
      setValidatedCode(null);
      toast.error(t('pastedLinkError'));
      return;
    }

    if (!trimmedCode.startsWith('AURORA-')) {
      setReferralCodeValid(false);
      setValidatedCode(null);
      toast.error(t('invalidCodeFormat'));
      return;
    }

    setCheckingReferralCode(true);
    try {
      // Use secure RPC function to validate referral code without exposing profile data
      const { data, error } = await supabase
        .rpc('validate_referral_code', { code: trimmedCode });

      if (error) {
        console.error('Error checking referral code:', error);
        setReferralCodeValid(false);
        setValidatedCode(null);
        toast.error(t('errorCheckingCode'));
        return;
      }

      if (data && data.length > 0 && data[0].is_valid) {
        setReferralCodeValid(true);
        setValidatedCode(trimmedCode); // Stocker le code validé
        toast.success(t('referralCodeValid'));
      } else {
        setReferralCodeValid(false);
        setValidatedCode(null);
        toast.error(t('referralCodeInvalid'));
      }
    } catch (error) {
      console.error('Error checking referral code:', error);
      setReferralCodeValid(false);
      setValidatedCode(null);
      toast.error(t('errorCheckingCode'));
    } finally {
      setCheckingReferralCode(false);
    }
  };

  // Handler pour les liens de partage
  const handleReferralLink = async (linkCode: string) => {
    if (!linkCode || linkCode.trim().length === 0) {
      return;
    }

    const trimmedLinkCode = linkCode.trim();
    setCheckingReferralCode(true);

    try {
      // Vérifier le format du lien (doit commencer par AURORA-LINK-)
      if (!trimmedLinkCode.startsWith('AURORA-LINK-')) {
        setReferralCodeValid(false);
        toast.error(t('invalidLinkFormat'));
        setCheckingReferralCode(false);
        return;
      }

      // Use secure RPC function to validate referral link without exposing full table data
      const { data: linkData, error } = await supabase
        .rpc('validate_referral_link', { link_code_param: trimmedLinkCode });

      if (error || !linkData || linkData.length === 0 || !linkData[0].is_valid) {
        setReferralCodeValid(false);
        toast.error(t('referralLinkInvalid'));
        setCheckingReferralCode(false);
        return;
      }

      const link = linkData[0];

      // Si c'est un lien familial, activer le mode d'inscription familiale
      if (link.is_family_link) {
        setIsFamilyRegistration(true);
      }

      // Enregistrer le clic (via une fonction edge)
      try {
        await supabase.functions.invoke('track-referral-link-click', {
          body: { link_code: trimmedLinkCode }
        });
      } catch (error) {
        console.error('Error tracking click:', error);
        // Ne pas bloquer l'inscription si le tracking échoue
      }

      // Remplir le code de parrainage et valider
      setFormData(prev => ({ ...prev, referralCode: link.referral_code }));
      setReferralCodeValid(true);
      setValidatedCode(link.referral_code); // Stocker le code validé
      setUsedReferralLink(trimmedLinkCode); // Sauvegarder le code du lien utilisé
      
      toast.success(`${t('referralLinkValid')}: ${link.referral_code}`);
    } catch (error) {
      console.error('Error handling referral link:', error);
      setReferralCodeValid(false);
      toast.error(t('errorProcessingLink'));
    } finally {
      setCheckingReferralCode(false);
    }
  };

  // Handler pour le changement du code de parrainage avec debounce
  const handleReferralCodeChange = (value: string) => {
    const trimmedValue = value.trim();
    setFormData(prev => ({ ...prev, referralCode: value }));
    
    // Si le code change et qu'il est différent du code validé, réinitialiser la validation
    if (trimmedValue !== validatedCode) {
      setReferralCodeValid(null);
      setValidatedCode(null);
    }
    
    // Annuler le timeout précédent
    if (referralCodeTimeoutRef.current) {
      clearTimeout(referralCodeTimeoutRef.current);
    }
    
    // Si le code est déjà validé et qu'il n'a pas changé, ne pas re-vérifier
    if (trimmedValue === validatedCode && referralCodeValid === true) {
      return;
    }
    
    // Définir un nouveau timeout pour vérifier après 500ms d'inactivité
    referralCodeTimeoutRef.current = setTimeout(() => {
      if (trimmedValue.length > 0) {
        checkReferralCode(trimmedValue);
      } else {
        setReferralCodeValid(null);
        setValidatedCode(null);
      }
    }, 500);
  };

  // Nettoyer le timeout au démontage et vérifier les paramètres URL
  useEffect(() => {
    // Retour de vérification: si verification=complete, on enregistre le statut via le token
    // puis on redirige immédiatement vers la page de connexion.
    const verificationParam = searchParams.get('verification');
    const token = searchParams.get('token');

    if (verificationParam === 'complete') {
      if (token) {
        supabase.functions
          .invoke('veriff-verification', {
            body: { action: 'check-registration', registrationToken: token },
          })
          .then(({ data, error }) => {
            if (error) {
              console.error('Error saving verification status:', error);
            } else {
              console.log('Verification status saved:', data?.status);
            }
          })
          .catch((err) => console.error('Error saving verification status:', err));
      }

      supabase.auth.signOut().finally(() => {
        navigate('/login', { replace: true });
      });

      return;
    }

    // Si on revient de Veriff, afficher l'étape de vérification automatiquement
    if (searchParams.get('verification')) {
      setRegistrationStep('verification');
    }
    // Récupérer le code de parrainage depuis l'URL si présent
    const refCode = searchParams.get('ref');
    const linkCode = searchParams.get('link');
    const familyParam = searchParams.get('family');

    // Vérifier si c'est une inscription familiale
    if (familyParam === 'true') {
      setIsFamilyRegistration(true);
    }

    // Priorité au lien de partage s'il est présent
    if (linkCode) {
      // Traiter le lien de partage (vérification complète)
      handleReferralLink(linkCode);
    } else if (refCode) {
      // Traiter le code de parrainage direct
      const trimmedRef = refCode.trim();
      setFormData(prev => ({ ...prev, referralCode: trimmedRef }));
      // Vérifier automatiquement le code après un court délai (une seule fois)
      setTimeout(() => {
        checkReferralCode(trimmedRef);
      }, 300);
    }
    
    // Récupérer les données de vérification depuis sessionStorage si on revient de Veriff
    const storedVerificationData = sessionStorage.getItem('verificationUserData');
    if (storedVerificationData) {
      try {
        const parsed = JSON.parse(storedVerificationData);
        setVerificationData(parsed);
      } catch (e) {
        console.error('Error parsing verification data:', e);
      }
    }

    return () => {
      if (referralCodeTimeoutRef.current) {
        clearTimeout(referralCodeTimeoutRef.current);
      }
    };
  }, [searchParams]);

  // Variable pour désactiver les autres champs si le code n'est pas valide
  // Le champ de code de parrainage reste TOUJOURS modifiable pour permettre la correction
  // Les autres champs sont désactivés uniquement si :
  // - Un code a été saisi ET il n'est pas encore validé ET on est en train de vérifier
  // OU - Un code a été saisi ET la vérification a échoué
  // Les champs sont activés dès que referralCodeValid === true
  const hasCodeEntered = formData.referralCode.trim().length > 0;
  const fieldsDisabled = hasCodeEntered && (checkingReferralCode || referralCodeValid === false);
  // Le champ de code n'est JAMAIS désactivé (sauf pendant la vérification)
  const referralCodeFieldDisabled = checkingReferralCode;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Vérifier CAPTCHA si activé
      if (isEnabled && siteKey && !captchaToken) {
        toast.error(t('captchaRequired'));
        setLoading(false);
        return;
      }

      // Validation basique
      if (!formData.email || !formData.firstName || !formData.lastName || !formData.referralCode) {
        toast.error(t('fillAllRequiredFields'));
        setLoading(false);
        return;
      }

      // Valider CAPTCHA côté serveur si token présent
      if (captchaToken) {
        const { error: captchaError } = await supabase.functions.invoke('verify-captcha', {
          body: { token: captchaToken }
        });
        if (captchaError) {
          toast.error(t('captchaFailed'));
          setCaptchaToken(null);
          setLoading(false);
          return;
        }
      }

      // Vérifier que le code de parrainage est valide
      if (formData.referralCode.trim().length > 0 && referralCodeValid !== true) {
        if (checkingReferralCode) {
          toast.error(t('verificationInProgress'));
        } else if (referralCodeValid === false) {
          toast.error(t('referralCodeInvalidRetry'));
        } else {
          toast.error(t('waitForVerification'));
        }
        setLoading(false);
        return;
      }

      if (formData.password && formData.password !== formData.confirmPassword) {
        toast.error(t('passwordsDoNotMatch'));
        setLoading(false);
        return;
      }

      // Si pas de mot de passe, stocker les données et rediriger vers login pour compléter
      if (!formData.password || !formData.username) {
        sessionStorage.setItem('registrationData', JSON.stringify(formData));
        if (avatarFile) {
          sessionStorage.setItem('registrationAvatar', avatarPreview);
        }
        toast.info(t('completeRegistrationWithPassword'));
        navigate("/login?mode=complete");
        setLoading(false);
        return;
      }

      // Créer le compte utilisateur directement
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username: formData.username,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error(t('errorCreatingAccount'));
      }

      // Upload avatar si présent - utiliser le chemin standardisé
      let avatarUrl = null;
      if (avatarFile && avatarPreview) {
        try {
          const { uploadAvatar } = await import('@/lib/avatarUtils');
          avatarUrl = await uploadAvatar(authData.user.id, avatarPreview);
        } catch (uploadErr) {
          console.error('Error uploading avatar:', uploadErr);
        }
      }

      // Générer un code de parrainage unique pour le nouveau membre
      const generateNewReferralCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "AURORA-";
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };
      const newUserReferralCode = generateNewReferralCode();

      // Déterminer le sponsor_id pour les comptes liés
      let sponsorIdForLinkedAccount: string | null = null;
      if (isFamilyRegistration && usedReferralLink) {
        // Récupérer le sponsor_id depuis le lien utilisé
        const { data: linkData } = await (supabase as any)
          .from('referral_links')
          .select('sponsor_id')
          .eq('link_code', usedReferralLink)
          .single();
        if (linkData) {
          sponsorIdForLinkedAccount = linkData.sponsor_id;
        }
      }

      // Créer le profil (identity_verified = false par défaut, compte bloqué)
      // Le nouveau membre obtient son propre referral_code (pas celui du parrain)
      // Si c'est un compte familial lié, marquer is_linked_account = true
      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .insert({
          id: authData.user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          honorific_title: formData.honorificTitle,
          job_function: formData.jobFunction,
          activity_domain: formData.activityDomain,
          personal_quote: formData.personalQuote,
          username: formData.username,
          referral_code: newUserReferralCode, // Son propre code, pas celui du parrain
          is_founder: formData.isFounder || false,
          avatar_url: avatarUrl,
          identity_verified: false, // Compte bloqué jusqu'à vérification
          is_linked_account: isFamilyRegistration, // Compte associé si inscription familiale
          linked_by_user_id: sponsorIdForLinkedAccount, // Qui a créé le lien
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      // Créer le profil privé (sans patrimoine pour les comptes liés)
      const { error: privateError } = await supabase
        .from('profiles_private')
        .insert({
          user_id: authData.user.id,
          mobile_phone: formData.mobile,
          // Pas de patrimoine pour les comptes familiaux liés
          wealth_currency: isFamilyRegistration ? null : (formData.wealthCurrency || 'EUR'),
          wealth_unit: isFamilyRegistration ? null : formData.wealthUnit,
          wealth_amount: isFamilyRegistration ? null : formData.wealthAmount,
        });

      if (privateError) {
        console.error('Private profile creation error:', privateError);
      }

      // Créer l'entrée dans linked_accounts si c'est une inscription familiale
      if (isFamilyRegistration && sponsorIdForLinkedAccount) {
        try {
          await (supabase as any)
            .from('linked_accounts')
            .insert({
              sponsor_id: sponsorIdForLinkedAccount,
              linked_user_id: authData.user.id,
              relation_type: 'family'
            });
          console.log('Linked account created successfully');
        } catch (error) {
          console.error('Error creating linked account:', error);
        }
      }

      // Créer l'entrée de parrainage dans la table referrals
      if (formData.referralCode) {
        try {
          // Trouver le parrain à partir du code de parrainage
          const { data: sponsorProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('referral_code', formData.referralCode)
            .maybeSingle();

          if (sponsorProfile) {
            const { error: referralError } = await supabase
              .from('referrals')
              .insert({
                sponsor_id: sponsorProfile.id,
                referred_id: authData.user.id,
                referral_code: formData.referralCode,
                status: 'pending',
                sponsor_approved: false
              });

            if (referralError) {
              console.error('Error creating referral entry:', referralError);
            } else {
              console.log('Referral entry created successfully');
            }
          }
        } catch (error) {
          console.error('Error creating referral:', error);
          // Ne pas bloquer l'inscription si la création du parrainage échoue
        }
      }

      // Incrémenter le compteur d'inscriptions du lien si utilisé
      if (usedReferralLink) {
        try {
          const { data: link } = await (supabase as any)
            .from('referral_links')
            .select('id, registration_count')
            .eq('link_code', usedReferralLink)
            .single();

          if (link) {
            await (supabase as any)
              .from('referral_links')
              .update({ registration_count: ((link as any).registration_count || 0) + 1 })
              .eq('id', (link as any).id);
          }
        } catch (error) {
          console.error('Error updating link registration count:', error);
          // Ne pas bloquer l'inscription si l'update échoue
        }
      }

      toast.success(t('registrationSuccess'));
      
      // Vérifier si l'utilisateur a un code de parrainage et si l'approbation du sponsor est requise
      if (formData.referralCode) {
        const { data: referralData } = await supabase
          .from('referrals')
          .select('sponsor_approved')
          .eq('referred_id', authData.user.id)
          .maybeSingle();

        if (referralData && !referralData.sponsor_approved) {
          // En attente de validation du parrain - sauvegarder l'état dans sessionStorage
          sessionStorage.setItem('waitingForSponsorApproval', 'true');
          // Sauvegarder les données utilisateur pour la vérification
          sessionStorage.setItem('verificationUserData', JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email
          }));
          // Passer à l'étape de vérification pour afficher le message d'attente
          setRegistrationStep('verification');
          return;
        }
      }
      
      // Sauvegarder les données utilisateur pour la vérification
      sessionStorage.setItem('verificationUserData', JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      }));
      // S'assurer que l'état d'attente n'est pas défini
      sessionStorage.removeItem('waitingForSponsorApproval');
      
      // Passer à l'étape de vérification après inscription réussie (seulement si sponsor a approuvé)
      setRegistrationStep('verification');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(`${t('errorDuringRegistration')}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationComplete = async (verificationId: string, status: string) => {
    try {
      // Mettre à jour le statut de vérification dans le profil
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && status === 'verified') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            identity_verified: true,
            identity_verified_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating verification status:', updateError);
          toast.error(t('errorUpdatingVerificationStatus'));
          return;
        }

        toast.success(t('identityVerificationCompleted'));
        navigate("/login");
      } else {
        toast.error(t('verificationNotValidated'));
      }
    } catch (error: any) {
      console.error('Error in verification complete:', error);
      toast.error(t('errorFinalizingVerification'));
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 py-12">
      {/* Language Selector */}
      <div className="absolute top-6 right-6 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gold hover:bg-gold/10 border border-gold/30">
              <Globe className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-black border-gold/30">
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={language === lang.code ? "bg-gold/20 text-gold" : "text-gold hover:bg-gold/10"}
              >
                <span className="mr-2">{lang.flag}</span>
                {lang.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <AuroraLogo size="md" className="mx-auto mb-6" />
          <h1 className="text-3xl md:text-4xl font-serif text-gold mb-2 tracking-wide">
            AURORA SOCIETY
          </h1>
          <p className="text-gold/60 text-sm tracking-widest">{t('registration')}</p>
        </div>

        {/* Quit Button */}
        <div className="flex justify-between mb-4">
          {registrationStep === 'form' && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/login")}
              className="text-gold/60 hover:text-gold hover:bg-gold/10"
            >
              ✕ {t('quit')}
            </Button>
          )}
        </div>

        {/* Verification Step */}
        {registrationStep === 'verification' && (
          <RegistrationVerification
            onComplete={handleVerificationComplete}
          />
        )}

        {/* Registration Form */}
        {registrationStep === 'form' && (
        <form onSubmit={handleFormSubmit} className="space-y-6 bg-black/40 border border-gold/20 rounded-lg p-8">
          {/* Avatar Upload */}
          <div className="space-y-2">
            <Label className="text-gold/80 text-sm font-serif">{t('profilePhoto')}</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-24 w-24">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} alt={t('avatarPreview')} />
                ) : (
                  <AvatarFallback className="bg-gold/10 text-gold">
                    <Upload className="w-8 h-8" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  id="avatar-upload"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  className="w-full border-gold/30 text-gold hover:bg-gold/10 h-9 sm:h-10 px-2 sm:px-4"
                >
                  <Upload className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline truncate">{avatarFile ? avatarFile.name : t('chooseFile')}</span>
                  {avatarFile && (
                    <span className="sm:hidden text-xs truncate max-w-[100px]">{avatarFile.name.length > 10 ? avatarFile.name.substring(0, 10) + '...' : avatarFile.name}</span>
                  )}
                </Button>
                <p className="text-xs text-gold/60">{t('photoFormatsHint')}</p>
                
                {/* Profile Photo Verification */}
                <div className={fieldsDisabled ? 'opacity-50 pointer-events-none' : ''}>
                  <RegistrationProfileVerification
                    imageBase64={avatarPreview || null}
                    onVerificationComplete={handleProfilePhotoVerification}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Referral Code */}
          <div className="space-y-2">
            <Label htmlFor="referralCode" className="text-gold/80 text-sm font-serif">
              {t('referralCode')} <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="referralCode"
                value={formData.referralCode}
                onChange={(e) => handleReferralCodeChange(e.target.value)}
                className={`bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold ${
                  referralCodeValid === false ? 'border-red-500 focus:border-red-500' : ''
                } ${referralCodeValid === true ? 'border-green-500 focus:border-green-500' : ''}`}
                placeholder={t('referralCode') + " " + t('referralCodeExample')}
                required
                disabled={referralCodeFieldDisabled}
              />
              {checkingReferralCode && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 text-gold animate-spin" />
                </div>
              )}
              {referralCodeValid === true && !checkingReferralCode && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              )}
              {referralCodeValid === false && !checkingReferralCode && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <XCircle className="w-4 h-4 text-red-500" />
                </div>
              )}
            </div>
            {checkingReferralCode && (
              <p className="text-gold/60 text-xs">{t('verifyingReferralCode')}</p>
            )}
            {referralCodeValid === false && !checkingReferralCode && (
              <p className="text-red-500 text-xs">
                {t('invalidReferralCode')} 
                {formData.referralCode.trim().startsWith('AURORA-') 
                  ? ` ${t('checkCodeCorrect')}` 
                  : ` ${t('codeMustStartWith')}`}
              </p>
            )}
            {referralCodeValid === true && !checkingReferralCode && (
              <p className="text-green-500 text-xs">✓ {t('validReferralCode')}</p>
            )}
            {!referralCodeValid && !checkingReferralCode && formData.referralCode.trim().length === 0 && (
              <p className="text-gold/60 text-xs">
                {t('enterReferralCodeHint')} <span className="font-mono">AURORA-</span>
              </p>
            )}
          </div>


          {/* Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-gold/80 text-sm font-serif">
                {t('firstName')}
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className={`bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold ${fieldsDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder={t('firstName')}
                required
                disabled={fieldsDisabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-gold/80 text-sm font-serif">
                {t('lastName')}
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className={`bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold ${fieldsDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder={t('lastName')}
                required
                disabled={fieldsDisabled}
              />
            </div>
          </div>

          {/* Honorific Title */}
          <div className="space-y-2">
            <Label htmlFor="honorificTitle" className="text-gold/80 text-sm font-serif">
              {t('honorificTitle')}
            </Label>
            <Select
              value={formData.honorificTitle}
              onValueChange={(value) => setFormData(prev => ({ ...prev, honorificTitle: value }))}
              disabled={fieldsDisabled}
            >
              <SelectTrigger className={`bg-black border-gold/30 text-gold z-40 ${fieldsDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <SelectValue placeholder={t('selectTitle')} />
              </SelectTrigger>
              <SelectContent className="bg-black border-gold/30 z-50 max-h-[400px]">
                <SelectItem value="dr" className="text-gold hover:bg-gold/10">{t('titleDr')}</SelectItem>
                <SelectItem value="dre" className="text-gold hover:bg-gold/10">{t('titleDre')}</SelectItem>
                <SelectItem value="prof" className="text-gold hover:bg-gold/10">{t('titleProf')}</SelectItem>
                <SelectItem value="professeure" className="text-gold hover:bg-gold/10">{t('titleProfesseure')}</SelectItem>
                <SelectItem value="maitre" className="text-gold hover:bg-gold/10">{t('titleMaitre')}</SelectItem>
                <SelectItem value="maitresse" className="text-gold hover:bg-gold/10">{t('titleMaitresse')}</SelectItem>
                <SelectItem value="son_excellence_m" className="text-gold hover:bg-gold/10">{t('titleSonExcellenceM')}</SelectItem>
                <SelectItem value="son_excellence_f" className="text-gold hover:bg-gold/10">{t('titleSonExcellenceF')}</SelectItem>
                <SelectItem value="son_altesse_m" className="text-gold hover:bg-gold/10">{t('titleSonAltesseM')}</SelectItem>
                <SelectItem value="son_altesse_f" className="text-gold hover:bg-gold/10">{t('titleSonAltesseF')}</SelectItem>
                <SelectItem value="son_altesse_royale_m" className="text-gold hover:bg-gold/10">{t('titleSonAltesseRoyaleM')}</SelectItem>
                <SelectItem value="son_altesse_royale_f" className="text-gold hover:bg-gold/10">{t('titleSonAltesseRoyaleF')}</SelectItem>
                <SelectItem value="son_altesse_serenissime_m" className="text-gold hover:bg-gold/10">{t('titleSonAltesseSerenissimeM')}</SelectItem>
                <SelectItem value="son_altesse_serenissime_f" className="text-gold hover:bg-gold/10">{t('titleSonAltesseSerenissimeF')}</SelectItem>
                <SelectItem value="sa_majeste_m" className="text-gold hover:bg-gold/10">{t('titleSaMajesteM')}</SelectItem>
                <SelectItem value="sa_majeste_f" className="text-gold hover:bg-gold/10">{t('titleSaMajesteF')}</SelectItem>
                <SelectItem value="sa_majeste_imperiale_m" className="text-gold hover:bg-gold/10">{t('titleSaMajesteImperialeM')}</SelectItem>
                <SelectItem value="sa_majeste_imperiale_f" className="text-gold hover:bg-gold/10">{t('titleSaMajesteImperialeF')}</SelectItem>
                <SelectItem value="son_eminence_m" className="text-gold hover:bg-gold/10">{t('titleSonEminenceM')}</SelectItem>
                <SelectItem value="son_eminence_f" className="text-gold hover:bg-gold/10">{t('titleSonEminenceF')}</SelectItem>
                <SelectItem value="sa_saintete_m" className="text-gold hover:bg-gold/10">{t('titleSaSainteteM')}</SelectItem>
                <SelectItem value="sa_saintete_f" className="text-gold hover:bg-gold/10">{t('titleSaSainteteF')}</SelectItem>
                <SelectItem value="prince" className="text-gold hover:bg-gold/10">{t('titlePrince')}</SelectItem>
                <SelectItem value="princesse" className="text-gold hover:bg-gold/10">{t('titlePrincesse')}</SelectItem>
                <SelectItem value="duc" className="text-gold hover:bg-gold/10">{t('titleDuc')}</SelectItem>
                <SelectItem value="duchesse" className="text-gold hover:bg-gold/10">{t('titleDuchesse')}</SelectItem>
                <SelectItem value="marquis" className="text-gold hover:bg-gold/10">{t('titleMarquis')}</SelectItem>
                <SelectItem value="marquise" className="text-gold hover:bg-gold/10">{t('titleMarquise')}</SelectItem>
                <SelectItem value="comte" className="text-gold hover:bg-gold/10">{t('titleComte')}</SelectItem>
                <SelectItem value="comtesse" className="text-gold hover:bg-gold/10">{t('titleComtesse')}</SelectItem>
                <SelectItem value="vicomte" className="text-gold hover:bg-gold/10">{t('titleVicomte')}</SelectItem>
                <SelectItem value="vicomtesse" className="text-gold hover:bg-gold/10">{t('titleVicomtesse')}</SelectItem>
                <SelectItem value="baron" className="text-gold hover:bg-gold/10">{t('titleBaron')}</SelectItem>
                <SelectItem value="baronne" className="text-gold hover:bg-gold/10">{t('titleBaronne')}</SelectItem>
                <SelectItem value="chevalier" className="text-gold hover:bg-gold/10">{t('titleChevalier')}</SelectItem>
                <SelectItem value="chevaliere" className="text-gold hover:bg-gold/10">{t('titleChevaliere')}</SelectItem>
                <SelectItem value="emir" className="text-gold hover:bg-gold/10">{t('titleEmir')}</SelectItem>
                <SelectItem value="emira" className="text-gold hover:bg-gold/10">{t('titleEmira')}</SelectItem>
                <SelectItem value="sultan" className="text-gold hover:bg-gold/10">{t('titleSultan')}</SelectItem>
                <SelectItem value="sultane" className="text-gold hover:bg-gold/10">{t('titleSultane')}</SelectItem>
                <SelectItem value="cheikh" className="text-gold hover:bg-gold/10">{t('titleCheikh')}</SelectItem>
                <SelectItem value="cheikha" className="text-gold hover:bg-gold/10">{t('titleCheikha')}</SelectItem>
                <SelectItem value="moulay" className="text-gold hover:bg-gold/10">{t('titleMoulay')}</SelectItem>
                <SelectItem value="lalla" className="text-gold hover:bg-gold/10">{t('titleLalla')}</SelectItem>
                <SelectItem value="sidi" className="text-gold hover:bg-gold/10">{t('titleSidi')}</SelectItem>
                <SelectItem value="empereur_japon" className="text-gold hover:bg-gold/10">{t('titleEmpereurJapon')}</SelectItem>
                <SelectItem value="imperatrice_japon" className="text-gold hover:bg-gold/10">{t('titleImperatriceJapon')}</SelectItem>
                <SelectItem value="prince_heritier_japon" className="text-gold hover:bg-gold/10">{t('titlePrinceHeritierJapon')}</SelectItem>
                <SelectItem value="princesse_heritiere_japon" className="text-gold hover:bg-gold/10">{t('titlePrincesseHeritiereJapon')}</SelectItem>
                <SelectItem value="samourai" className="text-gold hover:bg-gold/10">{t('titleSamourai')}</SelectItem>
                <SelectItem value="shogun" className="text-gold hover:bg-gold/10">{t('titleShogun')}</SelectItem>
                <SelectItem value="daimyo" className="text-gold hover:bg-gold/10">{t('titleDaimyo')}</SelectItem>
                <SelectItem value="tsar" className="text-gold hover:bg-gold/10">{t('titleTsar')}</SelectItem>
                <SelectItem value="tsarine" className="text-gold hover:bg-gold/10">{t('titleTsarine')}</SelectItem>
                <SelectItem value="grand_duc" className="text-gold hover:bg-gold/10">{t('titleGrandDuc')}</SelectItem>
                <SelectItem value="grande_duchesse" className="text-gold hover:bg-gold/10">{t('titleGrandeDuchesse')}</SelectItem>
                <SelectItem value="boyard" className="text-gold hover:bg-gold/10">{t('titleBoyard')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gold/80 text-sm font-serif">
              {t('email')}
            </Label>
            <Input
               id="email"
               type="email"
               value={formData.email}
               onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
               className={`bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold ${fieldsDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
               placeholder={t('emailPlaceholder')}
               required
               disabled={fieldsDisabled}
             />
          </div>

          {/* Mobile */}
          <div className="space-y-2">
            <Label htmlFor="mobile" className="text-gold/80 text-sm font-serif">
              {t('mobileNumber')}
            </Label>
            <Input
              id="mobile"
              type="tel"
              value={formData.mobile}
              onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
              className={`bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold ${fieldsDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder={t('mobileNumberPlaceholder')}
              required
              disabled={fieldsDisabled}
            />
          </div>

          {/* Job Function */}
          <div className="space-y-2">
            <Label htmlFor="jobFunction" className="text-gold/80 text-sm font-serif">
              {t('jobFunction')}
            </Label>
            <Input
               id="jobFunction"
               value={formData.jobFunction}
               onChange={(e) => setFormData(prev => ({ ...prev, jobFunction: e.target.value }))}
               className={`bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold ${fieldsDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
               placeholder={t('jobFunctionPlaceholder')}
               disabled={fieldsDisabled}
             />
          </div>

          {/* Activity Domain */}
          <div className="space-y-2">
            <Label htmlFor="activityDomain" className="text-gold/80 text-sm font-serif">
              {t('activityDomain')}
            </Label>
            <Select
              value={formData.activityDomain}
              onValueChange={(value) => setFormData(prev => ({ ...prev, activityDomain: value }))}
              disabled={fieldsDisabled}
            >
              <SelectTrigger className={`bg-black border-gold/30 text-gold z-40 ${fieldsDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <SelectValue placeholder={t('selectActivityDomain')} />
              </SelectTrigger>
              <SelectContent className="bg-black border-gold/30 z-50 max-h-[300px]">
                {INDUSTRIES.map((industry) => (
                  <SelectItem 
                    key={industry} 
                    value={industry}
                    className="text-gold hover:bg-gold/10 focus:bg-gold/10"
                  >
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Wealth Level - Hidden for family registration */}
          {!isFamilyRegistration && (
            <div className="space-y-2">
              <Label htmlFor="wealthAmount" className="text-gold/80 text-sm font-serif">
                {t('wealthLevel')}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="wealthAmount"
                  type="number"
                  value={formData.wealthAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, wealthAmount: e.target.value }))}
                  className={`bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold flex-1 ${fieldsDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder={t('wealthAmountPlaceholder')}
                  disabled={fieldsDisabled}
                />
                <Select
                  value={formData.wealthUnit}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, wealthUnit: value }))}
                  disabled={fieldsDisabled}
                >
                  <SelectTrigger className={`bg-black border-gold/30 text-gold w-32 z-40 ${fieldsDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-gold/30 z-50">
                    <SelectItem value="M" className="text-gold hover:bg-gold/10">{t('millions')}</SelectItem>
                    <SelectItem value="Md" className="text-gold hover:bg-gold/10">{t('billions')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={formData.wealthCurrency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, wealthCurrency: value }))}
                  disabled={fieldsDisabled}
                >
                  <SelectTrigger className={`bg-black border-gold/30 text-gold w-28 z-40 ${fieldsDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-gold/30 z-50">
                    <SelectItem value="EUR" className="text-gold hover:bg-gold/10">EUR €</SelectItem>
                    <SelectItem value="USD" className="text-gold hover:bg-gold/10">USD $</SelectItem>
                    <SelectItem value="GBP" className="text-gold hover:bg-gold/10">GBP £</SelectItem>
                    <SelectItem value="CHF" className="text-gold hover:bg-gold/10">CHF</SelectItem>
                    <SelectItem value="JPY" className="text-gold hover:bg-gold/10">JPY ¥</SelectItem>
                    <SelectItem value="CNY" className="text-gold hover:bg-gold/10">CNY ¥</SelectItem>
                    <SelectItem value="AED" className="text-gold hover:bg-gold/10">AED</SelectItem>
                    <SelectItem value="SAR" className="text-gold hover:bg-gold/10">SAR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Personal Quote - Hidden for family registration */}
          {!isFamilyRegistration && (
            <div className="space-y-2">
              <Label htmlFor="personalQuote" className="text-gold/80 text-sm font-serif">
                {t('personalQuote')}
              </Label>
              <Input
                 id="personalQuote"
                 value={formData.personalQuote}
                 onChange={(e) => setFormData(prev => ({ ...prev, personalQuote: e.target.value }))}
                 className={`bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold ${fieldsDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                 placeholder={t('personalQuotePlaceholder')}
                 disabled={fieldsDisabled}
               />
            </div>
          )}

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-gold/80 text-sm font-serif">
              {t('identifier')}
            </Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className={`bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold ${fieldsDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder={t('chooseIdentifier')}
              required
              disabled={fieldsDisabled}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gold/80 text-sm font-serif">
              {t('password')}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className={`bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold pr-10 ${fieldsDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder={t('min6Chars')}
                required
                disabled={fieldsDisabled}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gold/60 hover:text-gold" />
                ) : (
                  <Eye className="h-4 w-4 text-gold/60 hover:text-gold" />
                )}
              </Button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-gold/80 text-sm font-serif">
              {t('confirmPasswordLabel')}
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className={`bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold pr-10 ${fieldsDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder={t('confirmYourPassword')}
                required
                disabled={fieldsDisabled}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gold/60 hover:text-gold" />
                ) : (
                  <Eye className="h-4 w-4 text-gold/60 hover:text-gold" />
                )}
              </Button>
            </div>
          </div>

          {/* Founder Status - Hidden for family registration */}
          {!isFamilyRegistration && (
            <div className="flex items-center space-x-3 p-4 border border-gold/30 rounded-lg bg-black/40">
              <Checkbox
                id="isFounder"
                checked={formData.isFounder}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFounder: !!checked }))}
                className={`border-gold data-[state=checked]:bg-gold data-[state=checked]:text-black ${fieldsDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={fieldsDisabled}
              />
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-gold" />
                 <Label htmlFor="isFounder" className="text-gold/80 text-sm font-serif cursor-pointer">
                   {t('founderMember')}
                 </Label>
              </div>
            </div>
          )}


          {/* Terms and Conditions */}
          <div className="flex items-center space-x-3 p-4 border border-gold/30 rounded-lg bg-black/40">
            <Checkbox
              id="acceptTerms"
              required
              className={`border-gold data-[state=checked]:bg-gold data-[state=checked]:text-black ${fieldsDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={fieldsDisabled}
            />
            <Label htmlFor="acceptTerms" className="text-gold/80 text-sm font-serif cursor-pointer">
               {t('acceptTermsPrefix')} {" "}
               <a 
                 href="/terms" 
                 target="_blank"
                 className="underline hover:text-gold"
               >
                 {t('termsAndConditions')}
               </a>
               {" "}{t('acceptTermsVeriff')}
             </Label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="outline"
            size="lg"
            disabled={loading || fieldsDisabled || (isEnabled && siteKey && !captchaToken)}
            className={`w-full mt-8 text-gold border-gold hover:bg-gold hover:text-black transition-all duration-300 ${fieldsDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? t('loading') : fieldsDisabled ? t('referralCodeRequired') : t('continue')}
          </Button>
          {isEnabled && siteKey && (
            <div className="mt-4">
              <Captcha
                siteKey={siteKey}
                onVerify={(token) => {
                  setCaptchaToken(token);
                }}
                onError={(error) => {
                  toast.error(error || t('captchaError'));
                }}
                action="register"
              />
            </div>
          )}
        </form>
        )}
      </div>

    </div>
  );
};

export default Register;
