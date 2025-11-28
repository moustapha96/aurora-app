import React, { useState, useEffect } from "react";
import { AuroraLogo } from "@/components/AuroraLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRegistration } from "@/contexts/RegistrationContext";
import { useSettings } from "@/contexts/SettingsContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdmin } from "@/hooks/useAdmin";
import { convertToEuros } from "@/lib/currencyConverter";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { validatePassword } from "@/lib/passwordValidator";
import { checkRateLimit, formatRetryMessage, resetRateLimit } from "@/lib/rateLimiting";
import { initializeSession } from "@/lib/sessionManager";

// Schema will be created inside component to access t function

const Login = () => {
  const [searchParams] = useSearchParams();
  const isCompleteMode = searchParams.get('mode') === 'complete';
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false,
    loginPassword: false,
  });
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { registrationData, avatarPreview, idCardPreview, clearRegistrationData } = useRegistration();
  const { refetch: checkAdmin } = useAdmin();
  const { settings } = useSettings();

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Starting registration completion...');
      
      if (password !== confirmPassword) {
        toast.error(t('error'));
        setLoading(false);
        return;
      }

      // Récupérer les données d'inscription depuis le contexte
      if (!registrationData) {
        toast.error(t('error'));
        navigate("/register");
        setLoading(false);
        return;
      }
      console.log('Registration data:', { 
        email: registrationData.email, 
        firstName: registrationData.firstName, 
        lastName: registrationData.lastName 
      });

      // Validate password using settings
      const passwordValidation = validatePassword(password, {
        minLength: settings.passwordMinLength,
        requireUppercase: settings.passwordRequireUppercase,
        requireNumbers: settings.passwordRequireNumbers,
        requireSpecialChars: settings.passwordRequireSpecialChars,
      });
      if (!passwordValidation.isValid) {
        toast.error(passwordValidation.errors[0] || t('error'));
        setLoading(false);
        return;
      }

      // Validate inputs
      const registrationSchema = z.object({
        username: z.string().min(3, t('error')).max(50),
        password: z.string().refine((password) => {
          const validation = validatePassword(password, {
            minLength: settings.passwordMinLength,
            requireUppercase: settings.passwordRequireUppercase,
            requireNumbers: settings.passwordRequireNumbers,
            requireSpecialChars: settings.passwordRequireSpecialChars,
          });
          return validation.isValid;
        }, {
          message: t('error'),
        }),
        email: z.string().email(t('error')),
      });

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
          emailRedirectTo: settings.requireEmailVerification 
            ? `${window.location.origin}/verify-email`
            : `${window.location.origin}/member-card`,
          data: {
            username: username
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      console.log('Auth user created:', authData.user?.id);

      if (authData.user) {
        let avatarUrl = null;
        let idCardUrl = null;

        // Upload avatar if present
        if (avatarPreview) {
          try {
            // Convert base64 to blob
            const response = await fetch(avatarPreview);
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

        // Upload ID card if present
        if (idCardPreview) {
          try {
            // Convert base64 to blob
            const response = await fetch(idCardPreview);
            const blob = await response.blob();
            const fileName = `${authData.user.id}-id-card-${Date.now()}.jpg`;
            const filePath = `id-cards/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('id-cards')
              .upload(filePath, blob, { upsert: true });

            if (!uploadError) {
              const { data: urlData } = supabase.storage
                .from('id-cards')
                .getPublicUrl(filePath);
              idCardUrl = urlData.publicUrl;
            }
          } catch (uploadErr) {
            console.error('Error uploading ID card:', uploadErr);
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

        // Créer le profil en utilisant la fonction SQL (bypass RLS)
        console.log('Creating profile with data:', {
          id: authData.user.id,
          firstName: registrationData.firstName,
          lastName: registrationData.lastName,
          username: username
        });

        const { error: profileError } = await supabase.rpc('create_profile', {
          p_id: authData.user.id,
          p_first_name: registrationData.firstName,
          p_last_name: registrationData.lastName,
          p_honorific_title: registrationData.honorificTitle || null,
          p_mobile_phone: registrationData.mobile,
          p_job_function: registrationData.jobFunction || null,
          p_activity_domain: registrationData.activityDomain || null,
          p_personal_quote: registrationData.personalQuote || null,
          p_username: username,
          p_referral_code: registrationData.referralCode || null,
          p_is_founder: registrationData.isFounder || false,
          p_wealth_billions: wealthInBillions,
          p_wealth_currency: registrationData.wealthCurrency || 'EUR',
          p_wealth_unit: registrationData.wealthUnit || null,
          p_wealth_amount: registrationData.wealthAmount || null,
          p_avatar_url: avatarUrl,
          p_id_card_url: idCardUrl,
        });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw profileError;
        }

        console.log('Profile created successfully');

        // Send email notification if enabled
        if (settings.emailOnNewUser) {
          try {
            const { sendNewUserEmail } = await import('@/lib/emailService');
            await sendNewUserEmail(
              registrationData.email,
              `${registrationData.firstName} ${registrationData.lastName}`
            );
          } catch (emailError) {
            console.error('Error sending new user email:', emailError);
            // Don't block registration if email fails
          }
        }

        // Clear registration data from context
        clearRegistrationData();
        console.log('Registration completed successfully');
        
        // Handle email verification requirement
        if (settings.requireEmailVerification && !authData.user?.email_confirmed_at) {
          toast.success(t('accountCreated'));
          navigate("/verify-email");
          return;
        }
        
        // Check if user is admin and redirect accordingly
        if (authData.user) {
          try {
            const { data: isAdmin } = await supabase.rpc('has_role', {
              _user_id: authData.user.id,
              _role: 'admin'
            });
            
            if (isAdmin === true) {
              toast.success(t('accountCreatedSuccess'));
              checkAdmin();
              navigate("/admin/dashboard");
              return;
            }
          } catch (error) {
            console.error('Error checking admin role:', error);
            // Continue with normal redirect if check fails
          }
        }
        
        toast.success(t('accountCreatedSuccess'));
        navigate("/member-card");
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(`${t('registrationError')}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting login with email:', username);
      
      // Check rate limit before attempting login (using settings)
      const rateLimitCheck = await checkRateLimit(username.toLowerCase().trim(), 'login');
      
      if (!rateLimitCheck.allowed) {
        const retryMessage = formatRetryMessage(rateLimitCheck.retryAfter);
        const lockoutMessage = settings.lockoutDuration 
          ? t('accountLocked').replace('{minutes}', settings.lockoutDuration.toString())
          : '';
        const errorMessage = rateLimitCheck.message || lockoutMessage ||
          (retryMessage 
            ? `${t('tooManyAttempts') || 'Too many login attempts'}. ${retryMessage}`
            : t('tooManyAttempts') || t('tryAgainLater') || 'Too many login attempts. Please try again later.');
        toast.error(errorMessage);
        setLoading(false);
        return;
      }
      
      // Check 2FA requirement
      if (settings.require2FA) {
        // TODO: Implement 2FA check
        // For now, we'll just log it
        console.log('2FA is required but not yet implemented');
      }

      // Show remaining attempts warning if close to limit
      if (rateLimitCheck.remainingAttempts !== undefined && rateLimitCheck.remainingAttempts <= 2) {
        const attemptsText = rateLimitCheck.remainingAttempts === 1 
          ? t('remainingAttempts')?.replace('{count}', '1') || '1 attempt remaining'
          : t('remainingAttempts')?.replace('{count}', rateLimitCheck.remainingAttempts.toString()) || `${rateLimitCheck.remainingAttempts} attempts remaining`;
        toast.warning(attemptsText);
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (error) {
        console.error('Login error:', error);
        // Rate limit is already checked, so failed login is just an auth error
        // The rate limit will be incremented on the next attempt
        throw error;
      }

      console.log('Login successful for user:', data.user?.id);
      
      // Reset rate limit on successful login
      await resetRateLimit(username.toLowerCase().trim(), 'login');
      
      // Initialize session management
      initializeSession({ sessionTimeout: settings.sessionTimeout });
      
      // Check if user is admin and redirect accordingly
      if (data.user) {
        try {
          const { data: isAdmin } = await supabase.rpc('has_role', {
            _user_id: data.user.id,
            _role: 'admin'
          });
          
          if (isAdmin === true) {
            toast.success(t('loginSuccess') || t('success'));
            // Refresh admin status
            checkAdmin();
            navigate("/admin/dashboard");
            return;
          }
        } catch (error) {
          console.error('Error checking admin role:', error);
          // Continue with normal redirect if check fails
        }
      }
      
      toast.success(t('loginSuccess') || t('success'));
      navigate("/member-card");
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Show appropriate error message
      if (error.message?.includes('Invalid login credentials') || error.message?.includes('Invalid credentials')) {
        toast.error(t('invalidCredentials') || 'Invalid email or password');
      } else if (error.message?.includes('Email not confirmed')) {
        toast.error(t('emailNotConfirmed') || 'Please verify your email address');
      } else {
        toast.error(t('loginError') || t('error') || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (isCompleteMode) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-md mx-auto w-full">
          <AuroraLogo size="lg" className="mx-auto mb-8" />
          
          <h1 className="text-4xl md:text-5xl font-serif text-gold mb-2 tracking-wide">
            AURORA
          </h1>
          <h2 className="text-2xl md:text-3xl font-serif text-gold mb-8 tracking-widest">
            SOCIETY
          </h2>
          <p className="text-gold/60 text-sm mb-8 tracking-widest">{t('completeRegistration')?.toUpperCase() || 'FINALISER L\'INSCRIPTION'}</p>
          
          <form onSubmit={handleCompleteRegistration} className="space-y-6 bg-black/40 border border-gold/20 rounded-lg p-8">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gold/80 text-sm font-serif">
                {t('username')}
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold"
                placeholder={t('chooseUsername') || t('username')}
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
                  type={showPasswords.password ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold pr-10"
                  placeholder={t('choosePassword') || t('password')}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full text-gold/60 hover:text-gold"
                  onClick={() => setShowPasswords({ ...showPasswords, password: !showPasswords.password })}
                >
                  {showPasswords.password ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gold/80 text-sm font-serif">
                {t('confirmPassword')}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold pr-10"
                  placeholder={t('confirmPassword')}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full text-gold/60 hover:text-gold"
                  onClick={() => setShowPasswords({ ...showPasswords, confirmPassword: !showPasswords.confirmPassword })}
                >
                  {showPasswords.confirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <div className="text-xs text-gold/60 space-y-1">
                <p className="font-medium">{t('passwordRequirements')}:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  {[
                    `${t('passwordMinLength')}: ${settings.passwordMinLength || 6}`,
                    settings.passwordRequireUppercase ? t('passwordUppercase') : null,
                    t('passwordLowercase'),
                    settings.passwordRequireNumbers ? t('passwordDigit') : null,
                    settings.passwordRequireSpecialChars ? t('passwordSpecial') : null,
                  ].filter(Boolean).map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              variant="outline"
              size="lg"
              className="w-full text-gold border-gold hover:bg-gold hover:text-black transition-all duration-300"
            >
              {loading ? t('loading') : t('createAccount')}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md mx-auto w-full">
        <AuroraLogo size="lg" className="mx-auto mb-8" />
        
        <h1 className="text-4xl md:text-5xl font-serif text-gold mb-2 tracking-wide">
          AURORA
        </h1>
        <h2 className="text-2xl md:text-3xl font-serif text-gold mb-8 tracking-widest">
          SOCIETY
        </h2>
        <p className="text-gold/60 text-sm mb-8 tracking-widest">{t('login')?.toUpperCase() || 'CONNEXION'}</p>
        
        <form onSubmit={handleLogin} className="space-y-6 bg-black/40 border border-gold/20 rounded-lg p-8">
          <div className="space-y-2">
            <Label htmlFor="loginEmail" className="text-gold/80 text-sm font-serif">
              {t('email')}
            </Label>
            <Input
              id="loginEmail"
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold"
              placeholder={t('yourEmail') || t('email')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loginPassword" className="text-gold/80 text-sm font-serif">
              {t('password')}
            </Label>
            <div className="relative">
              <Input
                id="loginPassword"
                type={showPasswords.loginPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold pr-10"
                placeholder={t('yourPassword') || t('password')}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full text-gold/60 hover:text-gold"
                onClick={() => setShowPasswords({ ...showPasswords, loginPassword: !showPasswords.loginPassword })}
              >
                {showPasswords.loginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            variant="outline"
            size="lg"
            className="w-full text-gold border-gold hover:bg-gold hover:text-black transition-all duration-300"
          >
            {loading ? t('connecting') || t('loading') : t('login')}
          </Button>
        </form>
        
        <div className="mt-8 text-gold/60 text-sm text-center">
          <p>{t('exclusiveCircle') || ''}</p>
          <p>{t('chosenMembers') || ''}</p>
        </div>

        <div className="mt-4 space-y-2">
          <Button
            onClick={() => navigate("/forgot-password")}
            variant="link"
            className="w-full text-gold/60 hover:text-gold text-sm"
          >
            {t('forgotPassword')}
          </Button>
          <Button
            onClick={() => navigate("/register")}
            variant="link"
            className="w-full text-gold/60 hover:text-gold text-sm"
          >
            {t('notMemberYet') || t('register')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
