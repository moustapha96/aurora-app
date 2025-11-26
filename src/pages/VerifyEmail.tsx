import React, { useState, useEffect } from "react";
import { AuroraLogo } from "@/components/AuroraLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, CheckCircle2, XCircle, RefreshCw, ArrowLeft, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string>("");
  const { t } = useLanguage();

  useEffect(() => {
    checkVerificationStatus();
    handleEmailVerification();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        setUser(null);
        setEmailVerified(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);
      setEmail(currentUser.email || "");
      
      // Check if email is verified
      const isVerified = currentUser.email_confirmed_at !== null;
      setEmailVerified(isVerified);
    } catch (error: any) {
      console.error('Error checking verification status:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerification = async () => {
    // Check if we have a token in the URL (from email link)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (accessToken && type === 'signup') {
      try {
        // Verify the email by setting the session
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || '',
        });

        if (error) {
          console.error('Verification error:', error);
          toast.error(t('error'));
          return;
        }

        // Clear the hash from URL
        window.history.replaceState(null, '', window.location.pathname);

        // Refresh user data
        await checkVerificationStatus();
        toast.success(t('verifyEmailSuccess'));
      } catch (error: any) {
        console.error('Error verifying email:', error);
        toast.error(t('error'));
      }
    }
  };

  const handleResendEmail = async () => {
    try {
      setResending(true);

      if (!user) {
        toast.error(t('error'));
        return;
      }

      // Resend verification email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email || email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
        }
      });

      if (error) {
        console.error('Resend error:', error);
        throw error;
      }

      toast.success(t('success'));
    } catch (error: any) {
      console.error('Error resending email:', error);
      toast.error(t('error'));
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <Loader2 className="w-8 h-8 text-gold animate-spin mb-4" />
        <div className="text-gold">{t('loading')}</div>
      </div>
    );
  }

  if (!user) {
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

          <Card className="bg-black/40 border-gold/20">
            <CardHeader>
              <div className="mx-auto mb-4 w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-gold" />
              </div>
              <CardTitle className="text-gold">{t('error')}</CardTitle>
              <CardDescription className="text-gold/60">
                {t('verifyEmailDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={() => navigate("/login")}
                  variant="outline"
                  className="w-full text-gold border-gold/30 hover:bg-gold/10"
                >
                  {t('login')}
                </Button>
                <Button
                  onClick={() => navigate("/register")}
                  variant="ghost"
                  className="w-full text-gold/60 hover:text-gold"
                >
                  {t('register')}
                </Button>
              </div>
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
        <p className="text-gold/60 text-sm mb-8 tracking-widest">{t('verifyEmail').toUpperCase()}</p>
        
        <Card className="bg-black/40 border-gold/20">
          <CardHeader>
            {emailVerified ? (
              <>
                <div className="mx-auto mb-4 w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <CardTitle className="text-green-400">{t('verifyEmailSuccess')}</CardTitle>
                <CardDescription className="text-gold/60">
                  {t('verifyEmailSuccess')}
                </CardDescription>
              </>
            ) : (
              <>
                <div className="mx-auto mb-4 w-16 h-16 bg-yellow-900/20 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-yellow-400" />
                </div>
                <CardTitle className="text-yellow-400">{t('verifyEmail')}</CardTitle>
                <CardDescription className="text-gold/60">
                  {t('verifyEmailDescription')}
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {emailVerified ? (
              <>
                <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <p className="text-green-200 text-sm">
                    <strong className="text-green-400">{t('email')}:</strong> {email}
                  </p>
                  <p className="text-green-200/60 text-xs mt-2">
                    {user.email_confirmed_at ? new Date(user.email_confirmed_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
                
                <Button
                  onClick={() => navigate("/member-card")}
                  variant="outline"
                  className="w-full text-gold border-gold hover:bg-gold hover:text-black"
                >
                  {t('continue')}
                </Button>
              </>
            ) : (
              <>
                <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-200 text-sm mb-2">
                    <strong className="text-yellow-400">{t('email')}:</strong> {email}
                  </p>
                  <p className="text-yellow-200/60 text-xs">
                    {t('verifyEmailDescription')}
                  </p>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={handleResendEmail}
                    disabled={resending}
                    variant="outline"
                    className="w-full text-gold border-gold/30 hover:bg-gold/10"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('sending')}
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {t('resendVerification')}
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => navigate("/login")}
                    variant="ghost"
                    className="w-full text-gold/60 hover:text-gold"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('backToLogin')}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;

