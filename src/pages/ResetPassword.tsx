import React, { useState, useEffect } from "react";
import { AuroraLogo } from "@/components/AuroraLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { validatePassword, getPasswordRequirements } from "@/lib/passwordValidator";
import logo from "@/assets/logo.png";
const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirm: false,
  });
  const [validToken, setValidToken] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  useEffect(() => {
    // Check if we have a valid reset token in the URL
    const checkToken = async () => {
      // First, check query params (Supabase sends tokens in query params)
      const accessToken = searchParams.get('access_token');
      const type = searchParams.get('type');
      const refreshToken = searchParams.get('refresh_token');

      if (accessToken && type === 'recovery') {
        setValidToken(true);
        // Store tokens for later use
        // Clear the query params from URL for security
        window.history.replaceState(null, '', window.location.pathname);
      } else {
        // Fallback: check hash params (some email clients might use hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashAccessToken = hashParams.get('access_token');
        const hashType = hashParams.get('type');
        
        if (hashAccessToken && hashType === 'recovery') {
          setValidToken(true);
          // Clear the hash from URL for security
          window.history.replaceState(null, '', window.location.pathname);
        } else {
          setValidToken(false);
          toast.error(t('error'));
        }
      }
    };

    checkToken();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate passwords
      if (password !== confirmPassword) {
        toast.error(t('error'));
        setLoading(false);
        return;
      }

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        toast.error(passwordValidation.errors[0] || t('error'));
        setLoading(false);
        return;
      }

      // Get the token from URL (check both query params and hash)
      let accessToken = searchParams.get('access_token');
      let refreshToken = searchParams.get('refresh_token');

      // If not in query params, check hash
      if (!accessToken) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        accessToken = hashParams.get('access_token');
        refreshToken = hashParams.get('refresh_token') || refreshToken;
      }

      if (!accessToken) {
        toast.error(t('error'));
        setLoading(false);
        return;
      }

      // Set the session with the recovery tokens
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });

      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        throw updateError;
      }

      toast.success(t('success'));
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  if (validToken === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold">{t('loading')}</div>
      </div>
    );
  }

  if (validToken === false) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-md mx-auto w-full">
          {/* <AuroraLogo size="lg" className="mx-auto mb-8" /> */}
          <img src={logo} alt="Logo" className="w-32 h-32 mx-auto mb-8" />
          <h1 className="text-4xl md:text-5xl font-serif text-gold mb-2 tracking-wide">
            AURORA
          </h1>
          <h2 className="text-2xl md:text-3xl font-serif text-gold mb-8 tracking-widest">
            SOCIETY
          </h2>

          <Card className="bg-black/40 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400">{t('error')}</CardTitle>
              <CardDescription className="text-gold/60">
                {t('error')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/forgot-password")}
                variant="outline"
                className="w-full text-gold border-gold/30 hover:bg-gold/10"
              >
                {t('forgotPassword')}
              </Button>
            </CardContent>
          </Card>
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
        <p className="text-gold/60 text-sm mb-8 tracking-widest">{t('forgotPassword').toUpperCase()}</p>
        
        <Card className="bg-black/40 border-gold/20">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-gold" />
            </div>
            <CardTitle className="text-gold">{t('setNewPassword')}</CardTitle>
            <CardDescription className="text-gold/60">
              {t('setNewPasswordDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gold/80 text-sm font-serif">
                  {t('newPassword')}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPasswords.password ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold pr-10"
                    placeholder={t('newPassword')}
                    required
                    autoFocus
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
                    type={showPasswords.confirm ? "text" : "password"}
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
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gold/60 space-y-1">
                <p className="font-medium">{t('required')}</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  {getPasswordRequirements().map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                variant="outline"
                size="lg"
                className="w-full text-gold border-gold hover:bg-gold hover:text-black transition-all duration-300"
              >
                {loading ? t('updating') : t('updatePassword')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;

