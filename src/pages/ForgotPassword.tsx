import React, { useState } from "react";
import { AuroraLogo } from "@/components/AuroraLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error(t('error') + ": " + t('emailAddress'));
        setLoading(false);
        return;
      }

      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        throw error;
      }

      // Success - show confirmation message
      setEmailSent(true);
      toast.success(t('emailSent'));
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      // Don't reveal if email exists or not for security
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
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
                <Mail className="w-8 h-8 text-gold" />
              </div>
              <CardTitle className="text-gold text-2xl">{t('emailSent')}</CardTitle>
              <CardDescription className="text-gold/60 mt-4">
                {t('emailSentDescription')} <strong className="text-gold">{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gold/60 text-sm">
                {t('checkInbox')}
              </p>
              <p className="text-gold/40 text-xs">
                {t('checkSpam')}
              </p>
              
              <div className="pt-4 space-y-2">
                <Button
                  onClick={() => {
                    setEmailSent(false);
                    setEmail("");
                  }}
                  variant="outline"
                  className="w-full text-gold border-gold/30 hover:bg-gold/10"
                >
                  {t('resendEmail')}
                </Button>
                <Button
                  onClick={() => navigate("/login")}
                  variant="ghost"
                  className="w-full text-gold/60 hover:text-gold"
                >
                  {t('backToLogin')}
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
        <p className="text-gold/60 text-sm mb-8 tracking-widest">{t('forgotPassword').toUpperCase()}</p>
        
        <Card className="bg-black/40 border-gold/20">
          <CardHeader>
            <CardTitle className="text-gold">{t('resetPasswordTitle')}</CardTitle>
            <CardDescription className="text-gold/60">
              {t('resetPasswordDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gold/80 text-sm font-serif">
                  {t('emailAddress')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold"
                  placeholder="votre@email.com"
                  required
                  autoFocus
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                variant="outline"
                size="lg"
                className="w-full text-gold border-gold hover:bg-gold hover:text-black transition-all duration-300"
              >
                {loading ? t('sending') : t('sendResetEmail')}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gold/20">
              <Button
                onClick={() => navigate("/login")}
                variant="ghost"
                className="w-full text-gold/60 hover:text-gold"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('backToLogin')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;

