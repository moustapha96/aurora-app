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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const registrationSchema = z.object({
  username: z.string().min(3, "L'identifiant doit contenir au moins 3 caractères").max(50),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  email: z.string().email("Email invalide"),
});

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
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast.error("Veuillez entrer votre email");
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success("Un email de réinitialisation a été envoyé");
      setShowResetDialog(false);
      setResetEmail("");
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
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
        toast.error("Les mots de passe ne correspondent pas");
        setLoading(false);
        return;
      }

      // Récupérer les données d'inscription
      const registrationDataStr = sessionStorage.getItem('registrationData');
      const avatarBase64 = sessionStorage.getItem('registrationAvatar');
      
      console.log('Session data exists:', !!registrationDataStr);
      
      if (!registrationDataStr) {
        toast.error("Données d'inscription manquantes");
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

        // Upload avatar if present
        if (avatarBase64) {
          try {
            // Convert base64 to blob
            const response = await fetch(avatarBase64);
            const blob = await response.blob();
            const fileName = `${authData.user.id}-${Date.now()}.jpg`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(filePath, blob, { upsert: true });

            if (!uploadError) {
              const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);
              avatarUrl = urlData.publicUrl;
            }
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
        toast.success("Compte créé avec succès! Vous pouvez maintenant vous connecter.");
        navigate("/login");
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(`Erreur lors de l'inscription: ${error.message}`);
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
          toast.success("Connexion réussie!");
          navigate("/member-card");
        } else if (result.error && result.error !== 'Authentification annulée') {
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
      toast.success("Connexion réussie!");
      navigate("/member-card");
    } else {
      toast.error(result.error || "Échec de l'authentification biométrique");
    }
    setBiometricAuthLoading(false);
  };

  // Handle WebAuthn login (web biometric)
  const handleWebAuthnLogin = async () => {
    if (!username) {
      toast.error("Veuillez entrer votre email d'abord");
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
        toast.error("Veuillez d'abord vous connecter avec votre mot de passe pour activer la biométrie");
        setWebAuthnLoading(false);
        return;
      }

      const isEnabled = await checkWebAuthnEnabled(user.id);
      
      if (!isEnabled) {
        toast.info("La connexion biométrique n'est pas activée pour ce compte. Activez-la dans les paramètres.");
        setWebAuthnLoading(false);
        return;
      }

      const result = await authenticateWebAuthn(user.id);
      
      if (result.success) {
        toast.success("Connexion réussie!");
        navigate("/member-card");
      } else {
        toast.error(result.error || "Échec de l'authentification");
      }
    } catch (error: any) {
      console.error('WebAuthn login error:', error);
      toast.error("Erreur lors de l'authentification biométrique");
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting login with email:', username);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      // Update stored tokens for biometric auth
      await BiometricService.updateStoredTokens();

      console.log('Login successful for user:', data.user?.id);
      toast.success("Connexion réussie!");
      navigate("/member-card");
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error(`Erreur de connexion: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (isCompleteMode) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        {/* Language Selector */}
        <div className="absolute top-6 right-6">
          <Select value={language} onValueChange={(value) => setLanguage(value as any)}>
            <SelectTrigger className="w-[180px] border-gold/30 bg-black text-gold hover:border-gold z-50">
              <Globe className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black border-gold/30 z-50">
              {languages.map((lang) => (
                <SelectItem 
                  key={lang.code} 
                  value={lang.code}
                  className="text-gold hover:bg-gold/10 focus:bg-gold/10"
                >
                  {lang.flag} {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-center max-w-md mx-auto w-full">
          <AuroraLogo size="lg" className="mx-auto mb-8" />
          
          <h1 className="text-4xl md:text-5xl font-serif text-gold mb-2 tracking-wide">
            AURORA
          </h1>
          <h2 className="text-2xl md:text-3xl font-serif text-gold mb-8 tracking-widest">
            SOCIETY
          </h2>
          <p className="text-gold/60 text-sm mb-8 tracking-widest">FINALISER L'INSCRIPTION</p>
          
          <form onSubmit={handleCompleteRegistration} className="space-y-6 bg-black/40 border border-gold/20 rounded-lg p-8">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gold/80 text-sm font-serif">
                Identifiant ( Email)
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold"
                placeholder="Choisissez votre identifiant"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gold/80 text-sm font-serif">
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold pr-10"
                  placeholder="Choisissez votre mot de passe"
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
                      ✓ Minimum 6 caractères
                    </li>
                    <li className={/[A-Z]/.test(password) ? 'text-green-500' : 'text-gold/40'}>
                      ✓ Une majuscule
                    </li>
                    <li className={/[0-9]/.test(password) ? 'text-green-500' : 'text-gold/40'}>
                      ✓ Un chiffre
                    </li>
                    <li className={/[!@#$%^&*]/.test(password) ? 'text-green-500' : 'text-gold/40'}>
                      ✓ Un caractère spécial (!@#$%^&*)
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gold/80 text-sm font-serif">
                Confirmer le mot de passe
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
                  placeholder="Confirmez votre mot de passe"
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
                <p className="text-red-500 text-xs">Les mots de passe ne correspondent pas</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-green-500 text-xs">✓ Les mots de passe correspondent</p>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              variant="outline"
              size="lg"
              className="w-full text-gold border-gold hover:bg-gold hover:text-black transition-all duration-300"
            >
              {loading ? "Création..." : "Créer mon compte"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      {/* Language Selector */}
      <div className="absolute top-6 right-6">
        <Select value={language} onValueChange={(value) => setLanguage(value as any)}>
          <SelectTrigger className="w-[180px] border-gold/30 bg-black text-gold hover:border-gold z-50">
            <Globe className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-black border-gold/30 z-50">
            {languages.map((lang) => (
              <SelectItem 
                key={lang.code} 
                value={lang.code}
                className="text-gold hover:bg-gold/10 focus:bg-gold/10"
              >
                {lang.flag} {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="text-center max-w-md mx-auto w-full">
        <AuroraLogo size="lg" className="mx-auto mb-8" />
        
        <h1 className="text-4xl md:text-5xl font-serif text-gold mb-2 tracking-wide">
          AURORA
        </h1>
        <h2 className="text-2xl md:text-3xl font-serif text-gold mb-8 tracking-widest">
          SOCIETY
        </h2>
        <p className="text-gold/60 text-sm mb-8 tracking-widest">CONNEXION</p>
        
        <form onSubmit={handleLogin} className="space-y-6 bg-black/40 border border-gold/20 rounded-lg p-8">
          <div className="space-y-2">
            <Label htmlFor="loginEmail" className="text-gold/80 text-sm font-serif">
              Email ( Identifiant )
            </Label>
            <Input
              id="loginEmail"
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold"
              placeholder="Votre email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loginPassword" className="text-gold/80 text-sm font-serif">
              Mot de passe
            </Label>
            <div className="relative">
              <Input
                id="loginPassword"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold pr-10"
                placeholder="Votre mot de passe"
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
            Mot de passe oublié ?
          </Button>

          <Button 
            type="submit" 
            disabled={loading || biometricAuthLoading}
            variant="outline"
            size="lg"
            className="w-full text-gold border-gold hover:bg-gold hover:text-black transition-all duration-300"
          >
            {loading ? "Connexion..." : t('login')}
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
                  Authentification...
                </>
              ) : (
                <>
                  {biometryType === 'face' ? (
                    <ScanFace className="h-5 w-5" />
                  ) : (
                    <Fingerprint className="h-5 w-5" />
                  )}
                  {biometryType === 'face' ? 'Se connecter avec Face ID' : 'Se connecter avec empreinte'}
                </>
              )}
            </Button>
          )}

          {/* WebAuthn Login Button (Web - Touch ID, Windows Hello, etc.) */}
          {!isNative && webAuthnAvailable && (
            <Button
              type="button"
              onClick={handleWebAuthnLogin}
              disabled={webAuthnLoading || loading}
              variant="outline"
              size="lg"
              className="w-full text-gold border-gold/50 hover:bg-gold/10 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {webAuthnLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  {getWebAuthnIcon()}
                  Se connecter avec {getBiometricName(webAuthnType)}
                </>
              )}
            </Button>
          )}
        </form>
        
        <div className="mt-8 text-gold/60 text-sm text-center">
          <p>{t('exclusiveCircle')}</p>
          <p>{t('chosenMembers')}</p>
        </div>

        <Button
          onClick={() => navigate("/register")}
          variant="link"
          className="mt-4 text-gold/60 hover:text-gold"
        >
          Pas encore membre ? S'inscrire
        </Button>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="bg-black border-gold/30">
          <DialogHeader>
            <DialogTitle className="text-gold font-serif">Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription className="text-gold/60">
              Entrez votre email pour recevoir un lien de réinitialisation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resetEmail" className="text-gold/80 text-sm font-serif">
                Email
              </Label>
              <Input
                id="resetEmail"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold"
                placeholder="Votre email"
              />
            </div>
            <Button
              onClick={handlePasswordReset}
              disabled={resetLoading}
              className="w-full text-gold border-gold hover:bg-gold hover:text-black"
              variant="outline"
            >
              {resetLoading ? "Envoi..." : "Envoyer le lien"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
