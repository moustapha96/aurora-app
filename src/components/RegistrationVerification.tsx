import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Camera, Loader2, ExternalLink, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';

interface RegistrationVerificationProps {
  onComplete: (verificationId: string, status: string) => void;
  onSkip?: () => void;
  firstName: string;
  lastName: string;
  email: string;
}

type VerificationStep = 'intro' | 'initiating' | 'redirecting' | 'checking' | 'success' | 'error';

export function RegistrationVerification({ 
  onComplete, 
  onSkip,
  firstName,
  lastName,
  email
}: RegistrationVerificationProps) {
  const [step, setStep] = useState<VerificationStep>('intro');
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  // Check if returning from Jumio
  useEffect(() => {
    const verificationResult = searchParams.get('verification');
    const token = searchParams.get('token');
    
    if (verificationResult && token) {
      setStep('checking');
      checkVerificationStatus(token);
    }
  }, [searchParams]);

  const checkVerificationStatus = async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('jumio-verification', {
        body: { 
          action: 'check-registration',
          registrationToken: token
        }
      });

      if (error) {
        console.error('Error checking verification:', error);
        setError('Erreur lors de la vérification du statut');
        setStep('error');
        return;
      }

      console.log('Verification status:', data);
      setVerificationStatus(data.status);

      if (data.status === 'verified') {
        setStep('success');
        // Store verification data
        sessionStorage.setItem('verificationId', data.verificationId);
        sessionStorage.setItem('verificationStatus', 'verified');
        setTimeout(() => {
          onComplete(data.verificationId, 'verified');
        }, 2000);
      } else if (data.status === 'rejected') {
        setStep('error');
        setError('Votre document n\'a pas pu être vérifié. Veuillez réessayer.');
      } else if (data.status === 'initiated' || data.status === 'pending') {
        // Still processing
        setStep('checking');
        // Poll for status update
        setTimeout(() => checkVerificationStatus(token), 3000);
      } else {
        setStep('error');
        setError('Statut de vérification inconnu');
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Erreur inconnue');
      setStep('error');
    }
  };

  const initiateJumioVerification = async () => {
    setStep('initiating');
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('jumio-verification', {
        body: { 
          action: 'initiate-registration',
          registrationData: {
            firstName,
            lastName,
            email
          }
        }
      });

      if (error) {
        console.error('Error initiating verification:', error);
        setError(error.message || 'Erreur lors de l\'initialisation');
        setStep('error');
        return;
      }

      if (data?.success && data?.redirectUrl) {
        // Store the registration token for later
        sessionStorage.setItem('registrationToken', data.registrationToken);
        sessionStorage.setItem('verificationId', data.verificationId);
        
        setStep('redirecting');
        toast.success('Redirection vers la vérification d\'identité...');
        
        // Redirect to Jumio
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 1500);
      } else {
        setError(data?.error || 'Erreur inconnue');
        setStep('error');
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Erreur inconnue');
      setStep('error');
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'intro':
        return (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto bg-gold/20 p-4 rounded-full w-fit mb-4">
                <Shield className="w-12 h-12 text-gold" />
              </div>
              <CardTitle className="text-lg text-gold font-serif">
                Accès Confidentiel Vérifié
              </CardTitle>
              <CardDescription className="text-gold/60">
                Cette étape confidentielle permet d'activer votre accès au cercle Aurora et à l'ensemble de ses privilèges sécurisés.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-4 space-y-3">
                <h3 className="text-gold font-medium">Ce dont vous aurez besoin :</h3>
                <ul className="space-y-2 text-gold/80 text-sm">
                  <li className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-gold" />
                    Accès à votre caméra (téléphone ou ordinateur)
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gold" />
                    Une pièce d'identité valide (CNI, passeport, permis de conduire)
                  </li>
                </ul>
              </div>

              <Alert className="bg-gold/10 border-gold/30">
                <AlertTriangle className="h-4 w-4 text-gold" />
                <AlertDescription className="text-gold/80 text-sm">
                  Vous serez redirigé vers notre partenaire de vérification sécurisé. 
                  Vos données sont traitées de manière confidentielle.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Button
                  onClick={initiateJumioVerification}
                  className="w-full bg-gold text-black hover:bg-gold/90 font-medium"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Commencer la vérification
                </Button>
                
                {onSkip && (
                  <Button
                    variant="ghost"
                    onClick={onSkip}
                    className="w-full text-gold/60 hover:text-gold hover:bg-gold/10"
                  >
                    Passer cette étape (votre compte sera limité)
                  </Button>
                )}
              </div>
            </CardContent>
          </>
        );

      case 'initiating':
        return (
          <CardContent className="py-12 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto" />
            <p className="text-gold/80">Préparation de la vérification...</p>
          </CardContent>
        );

      case 'redirecting':
        return (
          <CardContent className="py-12 text-center space-y-4">
            <ExternalLink className="w-12 h-12 text-gold mx-auto animate-pulse" />
            <p className="text-gold">Redirection vers la vérification...</p>
            <p className="text-gold/60 text-sm">
              Si vous n'êtes pas redirigé automatiquement, veuillez patienter.
            </p>
          </CardContent>
        );

      case 'checking':
        return (
          <CardContent className="py-12 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto" />
            <p className="text-gold">Vérification en cours...</p>
            <p className="text-gold/60 text-sm">
              Nous vérifions votre identité. Cela peut prendre quelques instants.
            </p>
          </CardContent>
        );

      case 'success':
        return (
          <CardContent className="py-12 text-center space-y-4">
            <div className="mx-auto bg-green-500/20 p-4 rounded-full w-fit">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-xl text-gold font-serif">Identité vérifiée !</h3>
            <p className="text-gold/60">
              Votre identité a été confirmée avec succès. Finalisation de votre inscription...
            </p>
          </CardContent>
        );

      case 'error':
        return (
          <CardContent className="py-8 space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto bg-red-500/20 p-4 rounded-full w-fit">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
              <h3 className="text-xl text-gold font-serif">Échec de la vérification</h3>
              <p className="text-gold/60 text-sm">{error}</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  setStep('intro');
                  setError(null);
                }}
                className="w-full bg-gold text-black hover:bg-gold/90"
              >
                Réessayer
              </Button>
              
              {onSkip && (
                <Button
                  variant="ghost"
                  onClick={onSkip}
                  className="w-full text-gold/60 hover:text-gold hover:bg-gold/10"
                >
                  Continuer sans vérification
                </Button>
              )}
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

// Also export as default for compatibility
export default RegistrationVerification;
