import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Camera, Loader2, ExternalLink, CheckCircle, XCircle, AlertTriangle, LogIn, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface RegistrationVerificationProps {
  onComplete: (verificationId: string, status: string) => void;
}

type VerificationStep = 'intro' | 'initiating' | 'redirecting' | 'checking' | 'success' | 'pending' | 'error' | 'loading' | 'existing_pending';

export function RegistrationVerification({ 
  onComplete
}: RegistrationVerificationProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<VerificationStep>('loading');
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [existingVerification, setExistingVerification] = useState<any>(null);

  // Fonction pour démarrer le compte à rebours de redirection
  const startRedirectCountdown = () => {
    let countdown = 5;
    setRedirectCountdown(countdown);
    const interval = setInterval(() => {
      countdown -= 1;
      setRedirectCountdown(countdown);
      if (countdown <= 0) {
        clearInterval(interval);
        // Déconnecter l'utilisateur avant de rediriger
        supabase.auth.signOut().then(() => {
          navigate('/login', { replace: true });
        });
      }
    }, 1000);
  };

  // Vérifier s'il existe déjà une session Veriff pour cet utilisateur
  const checkExistingVerification = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session) {
        // Pas de session, vérifier s'il y a un email en attente
        const pendingEmail = sessionStorage.getItem('pendingVerificationEmail');
        if (pendingEmail) {
          setStep('intro');
          return;
        }
        setStep('intro');
        return;
      }

      const userId = sessionData.session.user.id;

      // Vérifier si une vérification existe déjà
      const { data: verification, error } = await supabase
        .from('identity_verifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error checking existing verification:', error);
        setStep('intro');
        return;
      }

      if (verification) {
        setExistingVerification(verification);
        
        if (verification.status === 'verified') {
          // Déjà vérifié - mettre à jour le profil et rediriger
          await supabase
            .from('profiles')
            .update({ identity_verified: true, identity_verified_at: new Date().toISOString() })
            .eq('id', userId);
          
          setStep('success');
          startRedirectCountdown();
        } else if (verification.status === 'initiated' || verification.status === 'pending') {
          // Session existante en attente
          setStep('existing_pending');
        } else if (verification.status === 'rejected') {
          // Rejetée - permettre de réessayer
          setStep('intro');
        } else {
          setStep('intro');
        }
      } else {
        setStep('intro');
      }
    } catch (err) {
      console.error('Error checking verification:', err);
      setStep('intro');
    }
  };

  // Check if returning from Veriff or check existing verification
  useEffect(() => {
    const verificationResult = searchParams.get('verification');
    const token = searchParams.get('token');
    
    if (verificationResult && token) {
      setStep('checking');
      checkVerificationStatus(token);
    } else {
      // Vérifier s'il existe une vérification en cours
      checkExistingVerification();
    }
  }, [searchParams]);

  const checkVerificationStatus = async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('veriff-verification', {
        body: { 
          action: 'check-registration',
          registrationToken: token
        }
      });

      if (error) {
        console.error('Error checking verification:', error);
        // Même en cas d'erreur, on redirige vers login après affichage du message
        setError(t('errorDuringVerification'));
        setStep('error');
        return;
      }

      console.log('Verification status:', data);
      setVerificationStatus(data.status);

      if (data.status === 'verified') {
        setStep('success');
        sessionStorage.setItem('verificationId', data.verificationId);
        sessionStorage.setItem('verificationStatus', 'verified');
        toast.success(t('identityVerified') + " " + t('redirectingToLogin'));
        startRedirectCountdown();
      } else if (data.status === 'rejected') {
        setStep('error');
        setError(t('documentNotVerified'));
        // Rediriger vers login après 5 secondes même en cas de rejet
        setTimeout(() => {
          supabase.auth.signOut().then(() => {
            navigate('/login', { replace: true });
          });
        }, 5000);
      } else if (data.status === 'initiated' || data.status === 'pending') {
        // Vérification en cours - afficher un message et rediriger vers login
        setStep('pending');
        sessionStorage.setItem('verificationId', data.verificationId);
        sessionStorage.setItem('verificationStatus', 'pending');
        toast.info(t('verificationInProgress') + ". " + t('notificationEmail'));
        startRedirectCountdown();
      } else if (data.status === 'not_found') {
        setStep('error');
        setError(t('verificationNotFound'));
      } else {
        // Statut inconnu - rediriger quand même vers login
        setStep('pending');
        toast.info(t('verificationSubmitted'));
        startRedirectCountdown();
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || t('unknownError'));
      setStep('error');
    }
  };

  const initiateVeriffVerification = async () => {
    setStep('initiating');
    setError(null);

    try {
      // Vérifier d'abord si l'utilisateur est authentifié
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session) {
        console.log('No active session found, redirecting to login');
        setError(t('sessionExpired'));
        setStep('error');
        toast.error(t('sessionExpired'));
        return;
      }

      console.log('Session active, user:', sessionData.session.user.id);

      const { data, error } = await supabase.functions.invoke('veriff-verification', {
        body: { 
          action: 'create-session-registration'
        }
      });

      if (error) {
        console.error('Error initiating verification:', error);
        // Vérifier si c'est une erreur de session expirée
        if (error.message?.includes('SESSION_EXPIRED') || error.message?.includes('401')) {
          setError(t('reconnectToContinue'));
        } else {
          setError(error.message || t('errorDuringInit'));
        }
        setStep('error');
        return;
      }

      if (data?.success && data?.redirectUrl) {
        sessionStorage.setItem('registrationToken', data.registrationToken);
        sessionStorage.setItem('verificationId', data.verificationId);
        
        setStep('redirecting');
        toast.success(t('redirectingToIdentityVerification'));
        
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 1500);
      } else {
        setError(data?.error || 'Erreur inconnue');
        setStep('error');
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || t('unknownError'));
      setStep('error');
    }
  };

  // Fonction pour rafraîchir le statut et relancer Veriff si nécessaire
  const handleRefreshOrRelaunch = async () => {
    setStep('initiating');
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session) {
        setError('Votre session a expiré. Veuillez vous reconnecter.');
        setStep('error');
        return;
      }

      const userId = sessionData.session.user.id;

      // Appeler l'edge function pour vérifier le statut via webhook ou API
      const { data, error } = await supabase.functions.invoke('veriff-verification', {
        body: { 
          action: 'check-status',
          userId
        }
      });

      if (error) {
        console.error('Error checking status:', error);
      }

      // Recharger la vérification depuis la DB
      const { data: verification } = await supabase
        .from('identity_verifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (verification?.status === 'verified') {
        await supabase
          .from('profiles')
          .update({ identity_verified: true, identity_verified_at: new Date().toISOString() })
          .eq('id', userId);
        
        setStep('success');
        toast.success(t('identityVerified'));
        startRedirectCountdown();
      } else if (verification?.status === 'rejected') {
        setExistingVerification(verification);
        setStep('intro');
        toast.info(t('previousVerificationRejected'));
      } else {
        setExistingVerification(verification);
        setStep('existing_pending');
        toast.info(t('verificationStillProcessing'));
      }
    } catch (err) {
      console.error('Error refreshing status:', err);
      setStep('existing_pending');
    }
  };

  // Fonction pour supprimer la vérification existante et recommencer
  const handleDeleteAndRestart = async () => {
    if (!existingVerification) return;
    
    setStep('initiating');
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session) {
        setError('Votre session a expiré. Veuillez vous reconnecter.');
        setStep('error');
        return;
      }

      const userId = sessionData.session.user.id;

      // Supprimer la vérification existante
      await supabase
        .from('identity_verifications')
        .delete()
        .eq('user_id', userId);

      setExistingVerification(null);
      setStep('intro');
      toast.success(t('canRetry'));
    } catch (err) {
      console.error('Error deleting verification:', err);
      setStep('existing_pending');
      toast.error(t('errorDeleting'));
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'loading':
        return (
          <CardContent className="py-12 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto" />
            <p className="text-gold/80">{t('loading')}</p>
          </CardContent>
        );

      case 'existing_pending':
        return (
          <CardContent className="py-8 space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto bg-amber-500/20 p-4 rounded-full w-fit">
                <Clock className="w-12 h-12 text-amber-500" />
              </div>
              <h3 className="text-xl text-gold font-serif">{t('verificationPending')}</h3>
              <p className="text-gold/60">
                {t('verificationAlreadyInitiated')} {t('currentlyProcessing')}
              </p>
            </div>

            <div className="bg-gold/5 border border-gold/20 rounded-lg p-4 space-y-2">
              <p className="text-gold/80 text-sm">
                <strong>{t('status')}:</strong> {existingVerification?.status === 'initiated' ? t('initiated') : t('pendingValidation')}
              </p>
              {existingVerification?.created_at && (
                <p className="text-gold/60 text-sm">
                  <strong>{t('date')}:</strong> {new Date(existingVerification.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleRefreshOrRelaunch}
                className="w-full bg-gold text-black hover:bg-gold/90 font-medium"
              >
                <Loader2 className="w-4 h-4 mr-2" />
                {t('refreshStatus')}
              </Button>
              
              <Button
                onClick={handleDeleteAndRestart}
                variant="outline"
                className="w-full border-gold/30 text-gold hover:bg-gold/10"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {t('deleteAndRestartVerification')}
              </Button>
              
              <Button
                onClick={() => {
                  supabase.auth.signOut().then(() => {
                    navigate('/login', { replace: true });
                  });
                }}
                variant="ghost"
                className="w-full text-gold/60 hover:text-gold hover:bg-transparent"
              >
                <LogIn className="w-4 h-4 mr-2" />
                {t('backToLogin')}
              </Button>
            </div>
          </CardContent>
        );

      case 'intro':
        return (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto bg-gold/20 p-4 rounded-full w-fit mb-4">
                <Shield className="w-12 h-12 text-gold" />
              </div>
              <CardTitle className="text-lg text-gold font-serif">
                {t('verifiedAccess')}
              </CardTitle>
              <CardDescription className="text-gold/60">
                {t('confidentialStep')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-4 space-y-3">
                <h3 className="text-gold font-medium">{t('whatYouNeed')}</h3>
                <ul className="space-y-2 text-gold/80 text-sm">
                  <li className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-gold" />
                    {t('cameraAccess')}
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gold" />
                    {t('validId')}
                  </li>
                </ul>
              </div>

              <Alert className="bg-gold/10 border-gold/30">
                <AlertTriangle className="h-4 w-4 text-gold" />
                <AlertDescription className="text-gold/80 text-sm">
                  {t('redirectedToVeriff')} {t('dataConfidential')}
                </AlertDescription>
              </Alert>

              <Alert className="bg-blue-500/10 border-blue-500/30">
                <Clock className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-300 text-sm">
                  <strong>{t('estimatedDuration')}</strong> {t('verificationTakes')} {t('haveIdReady')}
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Button
                  onClick={initiateVeriffVerification}
                  className="w-full bg-gold text-black hover:bg-gold/90 font-medium"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {t('startVerification')}
                </Button>
              </div>
            </CardContent>
          </>
        );

      case 'initiating':
        return (
          <CardContent className="py-12 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto" />
            <p className="text-gold/80">{t('preparingVerification')}</p>
          </CardContent>
        );

      case 'redirecting':
        return (
          <CardContent className="py-12 text-center space-y-4">
            <ExternalLink className="w-12 h-12 text-gold mx-auto animate-pulse" />
            <p className="text-gold">{t('redirectingToVeriff')}</p>
            <p className="text-gold/60 text-sm">
              {t('notRedirectedWait')}
            </p>
          </CardContent>
        );

      case 'checking':
        return (
          <CardContent className="py-12 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto" />
            <p className="text-gold">{t('checkingStatus')}</p>
            <p className="text-gold/60 text-sm">
              {t('verifyingResult')}
            </p>
          </CardContent>
        );

      case 'pending':
        return (
          <CardContent className="py-12 text-center space-y-6">
            <div className="mx-auto bg-amber-500/20 p-4 rounded-full w-fit">
              <Clock className="w-12 h-12 text-amber-500" />
            </div>
            <h3 className="text-xl text-gold font-serif">{t('verificationInProgress')}</h3>
            <p className="text-gold/60">
              {t('verificationInProgress')}. {t('notificationEmail')}
            </p>
            <div className="bg-gold/10 border border-gold/30 rounded-lg p-4">
              <p className="text-gold text-sm">
                {t('redirectingToLogin')} <span className="font-bold text-lg">{redirectCountdown}</span> {t('seconds')}
              </p>
            </div>
            <Button
              onClick={() => {
                supabase.auth.signOut().then(() => {
                  navigate('/login', { replace: true });
                });
              }}
              className="bg-gold text-black hover:bg-gold/90"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {t('loginNow')}
            </Button>
          </CardContent>
        );

      case 'success':
        return (
          <CardContent className="py-12 text-center space-y-6">
            <div className="mx-auto bg-green-500/20 p-4 rounded-full w-fit">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-xl text-gold font-serif">{t('identityVerified')}</h3>
            <p className="text-gold/60">
              {t('identityConfirmed')}
            </p>
            <div className="bg-gold/10 border border-gold/30 rounded-lg p-4">
              <p className="text-gold text-sm">
                {t('redirectingToLogin')} <span className="font-bold text-lg">{redirectCountdown}</span> {t('seconds')}
              </p>
            </div>
            <Button
              onClick={() => {
                supabase.auth.signOut().then(() => {
                  navigate('/login', { replace: true });
                });
              }}
              className="bg-gold text-black hover:bg-gold/90"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {t('loginNow')}
            </Button>
          </CardContent>
        );

      case 'error':
        return (
          <CardContent className="py-8 space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto bg-red-500/20 p-4 rounded-full w-fit">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
              <h3 className="text-xl text-gold font-serif">{t('verificationFailedTitle')}</h3>
              <p className="text-gold/60 text-sm">{error}</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  supabase.auth.signOut().then(() => {
                    navigate('/login', { replace: true });
                  });
                }}
                className="w-full bg-gold text-black hover:bg-gold/90"
              >
                <LogIn className="w-4 h-4 mr-2" />
                {t('goToLogin')}
              </Button>
              <Button
                onClick={() => {
                  setStep('intro');
                  setError(null);
                }}
                variant="outline"
                className="w-full border-gold/30 text-gold hover:bg-gold/10"
              >
                {t('retryVerification')}
              </Button>
            </div>
          </CardContent>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="bg-black/40 border-gold/20">
      {renderContent()}
    </Card>
  );
}

export default RegistrationVerification;
