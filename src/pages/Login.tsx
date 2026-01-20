import React, { useState, useEffect } from "react";
import { AuroraLogo } from "@/components/AuroraLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage, languages } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { convertToEuros } from "@/lib/currencyConverter";
import { z } from "zod";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Globe, Eye, EyeOff, ScanFace, Fingerprint, Loader2, Monitor } from "lucide-react";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { BiometricService } from "@/services/biometricService";
import { 
  getBiometricCapabilities, 
  getBiometricName, 
  authenticateWebAuthn,
  checkWebAuthnEnabled,
  BiometricType 
} from "@/services/webAuthnService";
import { Captcha, useCaptchaConfig } from "@/components/Captcha";
import { TwoFactorVerification } from "@/components/TwoFactorVerification";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const registrationSchema = z.object({
  username: z.string().min(3, "").max(50), // Validation message handled by UI
  password: z.string().min(6, ""), // Validation message handled by UI
  email: z.string().email(""), // Validation message handled by UI
});

// Types for verification status dialog
type VerificationDialogState = {
  open: boolean;
  status: 'pending' | 'rejected' | 'pending_sponsor' | 'rejected_sponsor' | null;
  message: string;
  rejectionReason?: string;
};

const Login = () => {
  const [searchParams] = useSearchParams();
  const isCompleteMode = searchParams.get('mode') === 'complete';
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  // State for pending biometric verification after password login
  const [pendingBiometricAuth, setPendingBiometricAuth] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  // State for verification status dialog
  const [verificationDialog, setVerificationDialog] = useState<VerificationDialogState>({
    open: false,
    status: null,
    message: ''
  });
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  // State for 2FA verification
  const [pending2FA, setPending2FA] = useState(false);
  const [pending2FAUserId, setPending2FAUserId] = useState<string | null>(null);
  const [pending2FAEmail, setPending2FAEmail] = useState<string>("");
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { siteKey, isEnabled } = useCaptchaConfig('login');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // Fonction pour revérifier le statut
  const handleRefreshVerificationStatus = async () => {
    const pendingEmail = sessionStorage.getItem('pendingVerificationEmail');
    if (!pendingEmail) {
      toast.error(t('emailNotFoundReconnect'));
      setVerificationDialog(prev => ({ ...prev, open: false }));
      return;
    }

    setRefreshingStatus(true);
    try {
      // Se reconnecter temporairement pour récupérer le statut
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: pendingEmail,
        password: password,
      });

      if (authError || !authData.user) {
        toast.error(t('errorDuringVerification'));
        setVerificationDialog(prev => ({ ...prev, open: false }));
        return;
      }

      const userId = authData.user.id;

      // Vérifier le profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('identity_verified')
        .eq('id', userId)
        .single();

      if (profile?.identity_verified) {
        // Vérifié ! Rediriger vers la page membre
        toast.success(t('accountVerified'));
        setVerificationDialog(prev => ({ ...prev, open: false }));
        navigate("/member-card");
        return;
      }

      // Vérifier le statut de la demande
      const { data: verificationData } = await supabase
        .from('identity_verifications')
        .select('status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Déconnexion après vérification
      await supabase.auth.signOut();

      if (verificationData) {
        const status = verificationData.status;
        
        if (status === 'verified') {
          toast.success(t('accountVerified'));
          // Se reconnecter pour accéder
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: pendingEmail,
            password: password,
          });
          if (!loginError) {
            setVerificationDialog(prev => ({ ...prev, open: false }));
            navigate("/member-card");
          }
          return;
        } else if (status === 'pending' || status === 'initiated') {
          toast.info(t('requestStillProcessing'));
        } else if (status === 'rejected') {
          setVerificationDialog({
            open: true,
            status: 'rejected',
            message: t('verificationRejectedMessage')
          });
        }
      } else {
        toast.info(t('noVerificationRequestFound'));
        setVerificationDialog(prev => ({ ...prev, open: false }));
        navigate("/register?step=verification");
      }
    } catch (error) {
      console.error('Error refreshing status:', error);
      toast.error(t('errorCheckingStatus'));
    } finally {
      setRefreshingStatus(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast.error(t('enterYourEmail'));
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success(t('resetEmailSent'));
      setShowResetDialog(false);
      setResetEmail("");
    } catch (error: any) {
      toast.error(`${t('error')}: ${error.message}`);
    } finally {
      setResetLoading(false);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Starting registration completion...');
      
      if (password !== confirmPassword) {
        toast.error(t('passwordsDoNotMatch'));
        setLoading(false);
        return;
      }

      // Récupérer les données d'inscription
      const registrationDataStr = sessionStorage.getItem('registrationData');
      const avatarBase64 = sessionStorage.getItem('registrationAvatar');
      
      console.log('Session data exists:', !!registrationDataStr);
      
      if (!registrationDataStr) {
        toast.error(t('registrationDataMissing'));
        navigate("/register");
        setLoading(false);
        return;
      }

      const registrationData = JSON.parse(registrationDataStr);
      console.log('Registration data:', { 
        email: registrationData.email, 
        firstName: registrationData.firstName, 
        lastName: registrationData.lastName 
      });

      // Validate inputs
      const validationResult = registrationSchema.safeParse({
        username,
        password,
        email: registrationData.email
      });

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(e => e.message).join(', ');
        toast.error(errors);
        setLoading(false);
        return;
      }

      // Créer le compte utilisateur
      console.log('Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registrationData.email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username: username,
          },
        },
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      console.log('Auth user created:', authData.user?.id);

      if (authData.user) {
        let avatarUrl = null;

        // Upload avatar if present - use standardized path
        if (avatarBase64) {
          try {
            const { uploadAvatar } = await import('@/lib/avatarUtils');
            avatarUrl = await uploadAvatar(authData.user.id, avatarBase64);
          } catch (uploadErr) {
            console.error('Error uploading avatar:', uploadErr);
          }
        }

        // Calculer le patrimoine en milliards d'euros
        let wealthInBillions = null;
        if (registrationData.wealthAmount && registrationData.wealthUnit) {
          const amount = parseFloat(registrationData.wealthAmount);
          const currency = registrationData.wealthCurrency || 'EUR';
          const unit = registrationData.wealthUnit;
          
          // Convertir en milliards d'euros
          wealthInBillions = convertToEuros(amount, currency, unit).toString();
        }

        // Créer le profil
        console.log('Creating profile with data:', {
          id: authData.user.id,
          firstName: registrationData.firstName,
          lastName: registrationData.lastName,
          username: username
        });

        // Create public profile (without sensitive data)
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            first_name: registrationData.firstName,
            last_name: registrationData.lastName,
            honorific_title: registrationData.honorificTitle,
            job_function: registrationData.jobFunction,
            activity_domain: registrationData.activityDomain,
            personal_quote: registrationData.personalQuote,
            username: username,
            referral_code: registrationData.referralCode,
            is_founder: registrationData.isFounder || false,
            avatar_url: avatarUrl,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw profileError;
        }

        // Create private profile data (sensitive info)
        const { error: privateError } = await supabase
          .from('profiles_private')
          .insert({
            user_id: authData.user.id,
            mobile_phone: registrationData.mobile,
            wealth_billions: wealthInBillions,
            wealth_currency: registrationData.wealthCurrency || 'EUR',
            wealth_unit: registrationData.wealthUnit || null,
            wealth_amount: registrationData.wealthAmount || null,
          });

        if (privateError) {
          console.error('Private profile creation error:', privateError);
          // Don't throw - profile is created, private data can be added later
        }

        console.log('Profile created successfully');

        sessionStorage.removeItem('registrationData');
        sessionStorage.removeItem('registrationAvatar');
        console.log('Registration completed successfully');
        toast.success(t('accountCreatedSuccess'));
        navigate("/login");
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(`${t('errorDuringRegistration')}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Native biometric auth
  const { isNative, isEnabled: biometricEnabled, biometryType, loading: biometricLoading } = useBiometricAuth();
  const [biometricAuthLoading, setBiometricAuthLoading] = useState(false);

  // WebAuthn (web biometric) state
  const [webAuthnAvailable, setWebAuthnAvailable] = useState(false);
  const [webAuthnType, setWebAuthnType] = useState<BiometricType>('none');
  const [webAuthnLoading, setWebAuthnLoading] = useState(false);

  // Check WebAuthn capabilities on mount
  useEffect(() => {
    const checkWebAuthn = async () => {
      const capabilities = await getBiometricCapabilities();
      setWebAuthnAvailable(capabilities.isPlatformAvailable);
      setWebAuthnType(capabilities.biometricType);
    };
    checkWebAuthn();
  }, []);

  // Auto-trigger biometric auth on native platform
  useEffect(() => {
    let mounted = true;
    
    const tryBiometricLogin = async () => {
      // Only run on native platform with biometric enabled
      if (!isNative || !biometricEnabled || biometricLoading || isCompleteMode) {
        return;
      }
      
      if (!mounted) return;
      setBiometricAuthLoading(true);
      
      try {
        const result = await BiometricService.authenticate();
        
        if (!mounted) return;
        
        if (result.success) {
          toast.success(t('loginSuccess'));
          navigate("/member-card");
        } else if (result.error && result.error !== t('authenticationCancelled')) {
          console.log('Biometric auth failed:', result.error);
        }
      } catch (error) {
        console.error('Biometric login error:', error);
      } finally {
        if (mounted) {
          setBiometricAuthLoading(false);
        }
      }
    };

    tryBiometricLogin();
    
    return () => {
      mounted = false;
    };
  }, [isNative, biometricEnabled, biometricLoading, navigate, isCompleteMode]);

  const handleBiometricLogin = async () => {
    setBiometricAuthLoading(true);
    const result = await BiometricService.authenticate();
    
    if (result.success) {
      toast.success(t('loginSuccess'));
      navigate("/member-card");
    } else {
      toast.error(result.error || t('biometricAuthFailed'));
    }
    setBiometricAuthLoading(false);
  };

  // Handle WebAuthn login (web biometric)
  const handleWebAuthnLogin = async () => {
    if (!username) {
      toast.error(t('enterEmailFirst'));
      return;
    }

    setWebAuthnLoading(true);

    try {
      // First, we need to get the user ID from the email
      // We'll do a login attempt to check if WebAuthn is enabled for this user
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, webauthn_enabled')
        .eq('id', (await supabase.auth.getUser()).data.user?.id || '')
        .single();

      // If not logged in, try to find user by checking if they have credentials
      // This is a simplified flow - in production you might want a lookup endpoint
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error(t('loginWithPasswordFirst'));
        setWebAuthnLoading(false);
        return;
      }

      const isEnabled = await checkWebAuthnEnabled(user.id);
      
      if (!isEnabled) {
        toast.info(t('biometricNotEnabledMessage'));
        setWebAuthnLoading(false);
        return;
      }

      const result = await authenticateWebAuthn(user.id);
      
      if (result.success) {
        toast.success(t('loginSuccess'));
        navigate("/member-card");
      } else {
        toast.error(result.error || t('authenticationFailed'));
      }
    } catch (error: any) {
      console.error('WebAuthn login error:', error);
      toast.error(t('errorBiometricAuth'));
    } finally {
      setWebAuthnLoading(false);
    }
  };

  const getWebAuthnIcon = () => {
    switch (webAuthnType) {
      case 'faceId':
        return <ScanFace className="h-5 w-5" />;
      case 'windowsHello':
        return <Monitor className="h-5 w-5" />;
      default:
        return <Fingerprint className="h-5 w-5" />;
    }
  };

  // Complete login after biometric verification
  const completeLogin = async () => {
    await BiometricService.updateStoredTokens();
    toast.success(t('loginSuccess'));
    navigate("/member-card");
  };

  // Handle biometric verification step
  const handleBiometricVerification = async () => {
    if (!pendingUserId) return;
    
    setWebAuthnLoading(true);
    try {
      const result = await authenticateWebAuthn(pendingUserId);
      if (result.success) {
        setPendingBiometricAuth(false);
        await completeLogin();
      } else {
        toast.error(result.error || t('biometricAuthFailed'));
      }
    } catch (error) {
      console.error('Biometric verification error:', error);
      toast.error(t('errorBiometricVerification'));
    } finally {
      setWebAuthnLoading(false);
    }
  };

  // Cancel biometric verification and logout
  const cancelBiometricVerification = async () => {
    await supabase.auth.signOut();
    setPendingBiometricAuth(false);
    setPendingUserId(null);
    toast.info(t('connectionCancelled'));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Vérifier CAPTCHA si activé
      if (isEnabled && siteKey && !captchaToken) {
        toast.error(t('captchaRequired'));
        setLoading(false);
        return;
      }

      console.log('Attempting login with email:', username);
      
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
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      const userId = data.user?.id;
      if (!userId) {
        throw new Error(t('userNotFound'));
      }

      // Vérifier si l'utilisateur est admin
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      const isAdmin = !!adminRole;

      // Vérifier si l'identité est vérifiée OU si le compte est activé manuellement (OBLIGATOIRE sauf pour les admins)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('identity_verified, account_active')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      // Les admins peuvent se connecter même sans vérification d'identité
      // account_active permet aussi de se connecter sans vérification Veriff
      const canAccess = profile?.identity_verified || profile?.account_active;
      if (!canAccess && !isAdmin) {
        // D'abord, vérifier si le parrain a approuvé l'inscription
        const { data: referralData } = await supabase
          .from('referrals')
          .select('sponsor_approved, rejection_reason, sponsor_id')
          .eq('referred_id', userId)
          .maybeSingle();

        // Si l'utilisateur a été invité par un parrain, vérifier l'approbation
        if (referralData && referralData.sponsor_id) {
          if (referralData.sponsor_approved === false && referralData.rejection_reason) {
            // Inscription refusée par le parrain - rediriger vers la page de vérification avec message d'erreur
            await supabase.auth.signOut();
            sessionStorage.setItem('waitingForSponsorApproval', 'rejected');
            sessionStorage.setItem('rejectionReason', referralData.rejection_reason || t('noRejectionReason'));
            sessionStorage.setItem('pendingVerificationEmail', username);
            toast.error(t('sponsorApprovalRejectedMessage').replace('{reason}', referralData.rejection_reason || t('noRejectionReason')));
            setLoading(false);
            navigate('/register?step=verification');
            return;
          }

          if (!referralData.sponsor_approved) {
            // En attente de validation du parrain - rediriger vers la page de vérification
            await supabase.auth.signOut();
            sessionStorage.setItem('waitingForSponsorApproval', 'true');
            sessionStorage.setItem('pendingVerificationEmail', username);
            toast.info(t('waitingForSponsorApproval'));
            setLoading(false);
            navigate('/register?step=verification');
            return;
          }
        }

        // Parrain a validé, maintenant vérifier le statut de la vérification d'identité
        const { data: verificationData } = await supabase
          .from('identity_verifications')
          .select('status, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Déconnexion avant d'afficher le dialog
        await supabase.auth.signOut();
        sessionStorage.setItem('pendingVerificationEmail', username);

        if (verificationData) {
          const status = verificationData.status;
          
          if (status === 'pending' || status === 'initiated') {
            // Demande en attente de validation
            setVerificationDialog({
              open: true,
              status: 'pending',
              message: t('verificationInProgressMessage')
            });
            setLoading(false);
            return;
          } else if (status === 'rejected') {
            // Demande rejetée
            setVerificationDialog({
              open: true,
              status: 'rejected',
              message: t('verificationRejectedMessageFull')
            });
            setLoading(false);
            return;
          }
        }

        // Aucune demande initiée - rediriger vers la vérification
        toast.error(t('identityVerificationRequired'));
        navigate("/register?step=verification");
        setLoading(false);
        return;
      }

      // Check if 2FA is enabled for this user
      const { data: profileFor2FA } = await supabase
        .from('profiles')
        .select('two_factor_enabled')
        .eq('id', userId)
        .single();

      if (profileFor2FA?.two_factor_enabled) {
        // 2FA is required - show 2FA verification step
        setPending2FAUserId(userId);
        setPending2FAEmail(username);
        setPending2FA(true);
        setLoading(false);
        return;
      }

      // Check if user has WebAuthn enabled (web) or native biometric
      if (isNative && biometricEnabled) {
        // Native biometric is required
        setPendingUserId(userId);
        setPendingBiometricAuth(true);
        setBiometricAuthLoading(true);
        
        const result = await BiometricService.authenticate();
        setBiometricAuthLoading(false);
        
        if (result.success) {
          setPendingBiometricAuth(false);
          await completeLogin();
        } else {
          toast.error(t('biometricAuthRequired'));
        }
      } else if (!isNative && webAuthnAvailable) {
        // Check if WebAuthn is enabled for this user
        const webAuthnEnabled = await checkWebAuthnEnabled(userId);
        
        if (webAuthnEnabled) {
          // WebAuthn is required - show biometric verification step
          setPendingUserId(userId);
          setPendingBiometricAuth(true);
          setLoading(false);
          return;
        } else {
          // No biometric required, complete login
          await completeLogin();
        }
      } else {
        // No biometric method available, complete login
        await completeLogin();
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error(`${t('loginError')}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (isCompleteMode) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
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
        
        <div className="text-center max-w-md mx-auto w-full">
          <AuroraLogo size="lg" className="mx-auto mb-8" />
          
          <h1 className="text-4xl md:text-5xl font-serif text-gold mb-2 tracking-wide">
            AURORA
          </h1>
          <h2 className="text-2xl md:text-3xl font-serif text-gold mb-8 tracking-widest">
            SOCIETY
          </h2>
          <p className="text-gold/60 text-sm mb-8 tracking-widest">{t('finalizeRegistration')}</p>
          
          <form onSubmit={handleCompleteRegistration} className="space-y-6 bg-black/40 border border-gold/20 rounded-lg p-8">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gold/80 text-sm font-serif">
                {t('identifierEmail')}
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold"
                  placeholder={t('chooseIdentifier')}
                  required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gold/80 text-sm font-serif">
                {t('password')}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold pr-10"
                    placeholder={t('choosePassword')}
                    required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-gold/60 hover:text-gold hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              
              {/* Password strength indicators */}
              {password && (
                <div className="space-y-2 mt-2">
                  <div className="flex gap-1">
                    <div className={`h-1 flex-1 rounded ${password.length >= 6 ? 'bg-green-500' : 'bg-gold/20'}`} />
                    <div className={`h-1 flex-1 rounded ${password.length >= 8 && /[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gold/20'}`} />
                    <div className={`h-1 flex-1 rounded ${password.length >= 8 && /[0-9]/.test(password) && /[!@#$%^&*]/.test(password) ? 'bg-green-500' : 'bg-gold/20'}`} />
                  </div>
                  <ul className="text-xs space-y-1">
                    <li className={password.length >= 6 ? 'text-green-500' : 'text-gold/40'}>
                      ✓ {t('min6Chars')}
                    </li>
                    <li className={/[A-Z]/.test(password) ? 'text-green-500' : 'text-gold/40'}>
                      ✓ {t('oneUppercase')}
                    </li>
                    <li className={/[0-9]/.test(password) ? 'text-green-500' : 'text-gold/40'}>
                      ✓ {t('oneDigit')}
                    </li>
                    <li className={/[!@#$%^&*]/.test(password) ? 'text-green-500' : 'text-gold/40'}>
                      ✓ {t('oneSpecialChar')}
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gold/80 text-sm font-serif">
                {t('confirmPasswordLabel')}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold pr-10 ${
                      confirmPassword && password !== confirmPassword ? 'border-red-500' : ''
                    }`}
                    placeholder={t('confirmYourPassword')}
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-gold/60 hover:text-gold hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 text-xs">{t('passwordsDontMatch')}</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-green-500 text-xs">✓ {t('passwordsMatch')}</p>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              variant="outline"
              size="lg"
              className="w-full text-gold border-gold hover:bg-gold hover:text-black transition-all duration-300 flex items-center justify-center gap-2"
            >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                    {t('creating')}
                  </>
                ) : t('createAccount')}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
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
      
      <div className="text-center max-w-md mx-auto w-full">
        <AuroraLogo size="lg" className="mx-auto mb-8" />
        
        <h1 className="text-4xl md:text-5xl font-serif text-gold mb-2 tracking-wide">
          AURORA
        </h1>
        <h2 className="text-2xl md:text-3xl font-serif text-gold mb-8 tracking-widest">
          SOCIETY
        </h2>
        {pending2FA && pending2FAUserId ? (
          <TwoFactorVerification
            userId={pending2FAUserId}
            email={pending2FAEmail}
            onVerified={async () => {
              setPending2FA(false);
              setPending2FAUserId(null);
              setPending2FAEmail("");
              await completeLogin();
            }}
            onCancel={async () => {
              await supabase.auth.signOut();
              setPending2FA(false);
              setPending2FAUserId(null);
              setPending2FAEmail("");
              toast.info(t('connectionCancelled'));
            }}
          />
        ) : pendingBiometricAuth ? (
          <>
            <p className="text-gold/60 text-sm mb-8 tracking-widest">{t('biometricVerification')}</p>
            
            <div className="space-y-6 bg-black/40 border border-gold/20 rounded-lg p-8">
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center">
                  {getWebAuthnIcon()}
                </div>
                <p className="text-gold/80 text-center">
                  {t('accountRequiresBiometric')}
                  <br />
                  <span className="text-gold/60 text-sm">
                    {t('useBiometricToContinue').replace('{biometric}', getBiometricName(webAuthnType))}
                  </span>
                </p>
              </div>

              <Button 
                onClick={handleBiometricVerification}
                disabled={webAuthnLoading}
                variant="outline"
                size="lg"
                className="w-full text-gold border-gold hover:bg-gold hover:text-black transition-all duration-300 flex items-center justify-center gap-2"
              >
                {webAuthnLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t('verifying')}
                  </>
                ) : (
                  <>
                    {getWebAuthnIcon()}
                    {t('verifyWith')} {getBiometricName(webAuthnType)}
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="link"
                className="text-gold/60 hover:text-gold p-0 h-auto text-sm w-full"
                onClick={cancelBiometricVerification}
              >
                {t('cancelAndLogout')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-gold/60 text-sm mb-8 tracking-widest">{t('connectionLabel')}</p>
            
            <form onSubmit={handleLogin} className="space-y-6 bg-black/40 border border-gold/20 rounded-lg p-8">
              <div className="space-y-2">
                <Label htmlFor="loginEmail" className="text-gold/80 text-sm font-serif">
                  {t('emailIdentifier')}
                </Label>
                <Input
                  id="loginEmail"
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold"
                  placeholder={t('yourEmail')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="loginPassword" className="text-gold/80 text-sm font-serif">
                  {t('passwordLabel')}
                </Label>
                <div className="relative">
                  <Input
                    id="loginPassword"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold pr-10"
                    placeholder={t('yourPassword')}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-gold/60 hover:text-gold hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="button"
                variant="link"
                className="text-gold/60 hover:text-gold p-0 h-auto text-sm"
                onClick={() => setShowResetDialog(true)}
              >
                {t('forgotPassword')}
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
                    action="login"
                  />
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading || biometricAuthLoading || (isEnabled && siteKey && !captchaToken)}
                variant="outline"
                size="lg"
                className="w-full text-gold border-gold hover:bg-gold hover:text-black transition-all duration-300 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                    {t('connecting')}
                  </>
                ) : t('login')}
              </Button>

              {/* Native Biometric Login Button (iOS/Android) */}
              {isNative && biometricEnabled && (
                <Button
                  type="button"
                  onClick={handleBiometricLogin}
                  disabled={biometricAuthLoading}
                  variant="outline"
                  size="lg"
                  className="w-full text-gold border-gold/50 hover:bg-gold/10 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {biometricAuthLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {t('authenticating')}
                    </>
                  ) : (
                    <>
                      {biometryType === 'face' ? (
                        <ScanFace className="h-5 w-5" />
                      ) : (
                        <Fingerprint className="h-5 w-5" />
                      )}
                      {biometryType === 'face' ? t('loginWithFaceId') : t('loginWithFingerprint')}
                    </>
                  )}
                </Button>
              )}
            </form>
          </>
        )}
        
        <div className="mt-8 text-gold/60 text-sm text-center">
          <p>{t('exclusiveCircle')}</p>
          <p>{t('chosenMembers')}</p>
        </div>

        <Button
          onClick={() => navigate("/register")}
          variant="link"
          className="mt-4 text-gold/60 hover:text-gold"
        >
          {t('notMemberYet')}
        </Button>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="bg-black border-gold/30">
          <DialogHeader>
            <DialogTitle className="text-gold font-serif">{t('resetPassword')}</DialogTitle>
            <DialogDescription className="text-gold/60">
              {t('resetPasswordDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resetEmail" className="text-gold/80 text-sm font-serif">
                {t('email')}
              </Label>
              <Input
                id="resetEmail"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                  className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold"
                  placeholder={t('yourEmail')}
              />
            </div>
            <Button
              onClick={handlePasswordReset}
              disabled={resetLoading}
              className="w-full text-gold border-gold hover:bg-gold hover:text-black"
              variant="outline"
            >
              {resetLoading ? t('sending') : t('sendLink')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verification Status Dialog */}
      <Dialog open={verificationDialog.open} onOpenChange={(open) => setVerificationDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="bg-black border-gold/30">
          <DialogHeader>
            <DialogTitle className="text-gold font-serif">
              {verificationDialog.status === 'pending' 
                ? t('verificationInProgress') 
                : verificationDialog.status === 'pending_sponsor'
                ? t('sponsorApprovalPending')
                : verificationDialog.status === 'rejected_sponsor'
                ? t('sponsorApprovalRejected')
                : t('verificationRejected')}
            </DialogTitle>
            <DialogDescription className="text-gold/60">
              {verificationDialog.message}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {verificationDialog.status === 'pending' ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-gold animate-spin" />
                </div>
                <p className="text-gold/80 text-sm text-center">
                  {t('verificationPendingMessage')}
                </p>
                <Button
                  onClick={handleRefreshVerificationStatus}
                  disabled={refreshingStatus}
                  className="w-full bg-gold text-black hover:bg-gold/90"
                >
                  {refreshingStatus ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t('verifying')}
                    </>
                  ) : (
                    t('recheckStatus')
                  )}
                </Button>
                <Button
                  onClick={() => setVerificationDialog(prev => ({ ...prev, open: false }))}
                  className="w-full text-gold border-gold hover:bg-gold hover:text-black"
                  variant="outline"
                >
                  {t('close')}
                </Button>
              </div>
            ) : verificationDialog.status === 'pending_sponsor' ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
                </div>
                <p className="text-gold/80 text-sm text-center">
                  {t('contactYourSponsor')}
                </p>
                <Button
                  onClick={() => setVerificationDialog(prev => ({ ...prev, open: false }))}
                  className="w-full text-gold border-gold hover:bg-gold hover:text-black"
                  variant="outline"
                >
                  {t('close')}
                </Button>
              </div>
            ) : verificationDialog.status === 'rejected_sponsor' ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                  <span className="text-red-500 text-2xl">✕</span>
                </div>
                <Button
                  onClick={() => setVerificationDialog(prev => ({ ...prev, open: false }))}
                  className="w-full text-gold border-gold hover:bg-gold hover:text-black"
                  variant="outline"
                >
                  {t('close')}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                  <span className="text-red-500 text-2xl">✕</span>
                </div>
                <p className="text-gold/80 text-sm text-center">
                  {t('canRestartVerification')}
                </p>
                <Button
                  onClick={() => {
                    setVerificationDialog(prev => ({ ...prev, open: false }));
                    navigate("/register?step=verification");
                  }}
                  className="w-full text-gold border-gold hover:bg-gold hover:text-black"
                  variant="outline"
                >
                  {t('restartVerification')}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
