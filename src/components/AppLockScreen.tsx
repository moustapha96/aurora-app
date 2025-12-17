import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Fingerprint, Loader2, LogOut, RefreshCw } from "lucide-react";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import auroraLogo from "@/assets/aurora-logo.png";

interface AppLockScreenProps {
  onUnlock: () => void;
}

export const AppLockScreen = ({ onUnlock }: AppLockScreenProps) => {
  const navigate = useNavigate();
  const { authenticate, isEnabled, isLoading } = useWebAuthn();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  // Auto-prompt for authentication when component mounts
  useEffect(() => {
    if (!isLoading && isEnabled) {
      handleAuthenticate();
    }
  }, [isLoading, isEnabled]);

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    setError(null);
    
    const result = await authenticate();
    
    if (result.success) {
      onUnlock();
    } else {
      setError(result.error || "Échec de l'authentification");
      setAttemptCount(prev => prev + 1);
    }
    
    setIsAuthenticating(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={auroraLogo} alt="Aurora Society" className="h-16 w-auto" />
        </div>

        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-serif">Application verrouillée</CardTitle>
            <CardDescription>
              Utilisez votre authentification biométrique pour déverrouiller l'application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Fingerprint icon */}
            <div className="flex justify-center">
              <div className={`p-6 rounded-full transition-all duration-300 ${
                isAuthenticating 
                  ? "bg-primary/20 animate-pulse" 
                  : error 
                    ? "bg-destructive/10" 
                    : "bg-primary/10"
              }`}>
                <Fingerprint className={`w-16 h-16 ${
                  isAuthenticating 
                    ? "text-primary animate-pulse" 
                    : error 
                      ? "text-destructive" 
                      : "text-primary"
                }`} />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="text-center">
                <p className="text-sm text-destructive">{error}</p>
                {attemptCount >= 3 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Trop de tentatives ? Déconnectez-vous et reconnectez-vous avec votre mot de passe.
                  </p>
                )}
              </div>
            )}

            {/* Authenticate button */}
            <Button
              onClick={handleAuthenticate}
              disabled={isAuthenticating}
              className="w-full gap-2"
              size="lg"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authentification...
                </>
              ) : (
                <>
                  <Fingerprint className="w-5 h-5" />
                  Déverrouiller
                </>
              )}
            </Button>

            {/* Retry hint */}
            {error && !isAuthenticating && (
              <Button
                onClick={handleAuthenticate}
                variant="ghost"
                className="w-full gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </Button>
            )}

            {/* Logout option */}
            <div className="pt-4 border-t border-border">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full gap-2 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
