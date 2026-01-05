import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, Check } from "lucide-react";
import { AuroraLogo } from "@/components/AuroraLogo";
import { useLanguage } from "@/contexts/LanguageContext";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if we have a recovery session (from password reset link)
      if (session) {
        setIsValidSession(true);
      } else {
        toast({
          title: t('invalidLink'),
          description: t('requestNewLink'),
          variant: "destructive",
        });
        setTimeout(() => navigate("/login"), 2000);
      }
      setIsChecking(false);
    };

    checkSession();
  }, [navigate, toast, t]);

  const getPasswordStrength = () => {
    if (password.length === 0) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast({
        title: t('passwordTooShort'),
        description: t('passwordTooShortDesc'),
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: t('passwordMismatch'),
        description: t('passwordMismatchDesc'),
        variant: "destructive",
      });
      return;
    }

    if (passwordStrength < 3) {
      toast({
        title: t('passwordTooWeak'),
        description: t('passwordTooWeakDesc'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast({
          title: t('error'),
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Sign out to clear the recovery session
        await supabase.auth.signOut();
        
        toast({
          title: t('passwordUpdated'),
          description: t('passwordUpdatedDesc'),
        });
        
        navigate("/login");
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: t('saveError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-gold">{t('verifying')}</div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p>{t('redirectingToLogin')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <AuroraLogo size="lg" />
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-display text-gold">{t('newPassword')}</h1>
          <p className="text-white/60 text-sm">
            {t('createSecurePassword')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleResetPassword} className="space-y-6">
          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/80">
              {t('newPasswordLabel')}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-white/5 border-white/10 text-white"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        level <= passwordStrength
                          ? passwordStrength <= 2
                            ? "bg-red-500"
                            : passwordStrength <= 3
                            ? "bg-yellow-500"
                            : "bg-green-500"
                          : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-white/40">
                  {passwordStrength <= 2 && t('weak')}
                  {passwordStrength === 3 && t('medium')}
                  {passwordStrength >= 4 && t('strong')}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-white/80">
              {t('confirmNewPassword')}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 pr-10 bg-white/5 border-white/10 text-white"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {/* Match Indicator */}
            {confirmPassword.length > 0 && (
              <div className="flex items-center gap-1">
                {password === confirmPassword ? (
                  <>
                    <Check className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500">{t('passwordsMatch')}</span>
                  </>
                ) : (
                  <span className="text-xs text-red-500">{t('passwordsDontMatch')}</span>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || password.length < 8 || password !== confirmPassword}
            className="w-full bg-gold hover:bg-gold/90 text-black font-medium"
          >
            {isLoading ? t('updating') : t('updatePassword')}
          </Button>
        </form>

        {/* Back to Login */}
        <div className="text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-white/60 hover:text-gold text-sm transition-colors"
          >
            {t('backToLogin')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
