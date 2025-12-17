import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Shield, 
  Fingerprint,
  ScanFace,
  Monitor,
  Smartphone,
  Laptop,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Trash2,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { usePlatformContext } from "@/contexts/PlatformContext";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { BiometricService } from "@/services/biometricService";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeviceInfo {
  type: 'windows' | 'macos' | 'ios' | 'android' | 'linux' | 'unknown';
  name: string;
  icon: React.ReactNode;
  biometricName: string;
  biometricIcon: React.ReactNode;
}

const SecuritySettings: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const debugEnabled = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1';
  const debugToast = (title: string, description: string, variant?: 'default' | 'destructive') => {
    if (!debugEnabled) return;
    toast({
      title,
      description,
      variant,
    });
  };
  
  // Message de test
  console.log('SecuritySettings - Composant rendu');
  console.log('UserAgent:', navigator.userAgent);
  
  // Safe platform context with fallback - compatible iOS/Android/Web
  const platformContext = (() => {
    try {
      return usePlatformContext();
    } catch (e) {
      console.error('Platform context error:', e);
      return { isWeb: true, isNative: false, isIOS: false, isAndroid: false, platform: 'web' as const };
    }
  })();
  const { isWeb, isNative, isIOS, isAndroid } = platformContext;
  
  // WebAuthn for web - with safe defaults for mobile compatibility
  const webAuthnResult = (() => {
    try {
      return useWebAuthn();
    } catch (e) {
      console.error('WebAuthn hook error:', e);
      return null;
    }
  })();
  
  const {
    isSupported: webAuthnSupported = false,
    isPlatformAvailable: webAuthnAvailable = false,
    isEnabled: webAuthnEnabled = false,
    credentials: webAuthnCredentials = [],
    isLoading: webAuthnLoading = false,
    register: registerWebAuthn = async () => ({ success: false, error: 'WebAuthn non disponible' }),
    removeCredential: removeWebAuthnCredential = async () => false,
    biometricType = 'none' as const,
    capabilities: webAuthnCapabilities = null,
  } = webAuthnResult || {};
  
  // Native biometric for mobile - with safe defaults for web compatibility
  const biometricResult = (() => {
    try {
      return useBiometricAuth();
    } catch (e) {
      console.error('Biometric hook error:', e);
      return null;
    }
  })();
  
  const {
    isAvailable: nativeBiometricAvailable = false,
    isEnabled: nativeBiometricEnabled = false,
    biometryType: nativeBiometryType = 'none' as const,
    loading: nativeBiometricLoading = false,
  } = biometricResult || {};

  const [isRegistering, setIsRegistering] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [enablingNative, setEnablingNative] = useState(false);

  const detectDevice = (): DeviceInfo => {
    const ua = navigator.userAgent.toLowerCase();
    
    // Détection native iOS (app Capacitor)
    if (isIOS) {
      return {
        type: 'ios',
        name: 'iPhone / iPad',
        icon: <Smartphone className="w-5 h-5" />,
        biometricName: 'Face ID / Touch ID',
        biometricIcon: <ScanFace className="w-5 h-5" />
      };
    }
    
    // Détection native Android (app Capacitor)
    if (isAndroid) {
      return {
        type: 'android',
        name: 'Appareil Android',
        icon: <Smartphone className="w-5 h-5" />,
        biometricName: 'Empreinte digitale',
        biometricIcon: <Fingerprint className="w-5 h-5" />
      };
    }

    // Détection web - Windows
    if (ua.includes('windows')) {
      return {
        type: 'windows',
        name: 'Windows',
        icon: <Monitor className="w-5 h-5" />,
        biometricName: 'Windows Hello',
        biometricIcon: <ScanFace className="w-5 h-5" />
      };
    }
    
    // Détection web - Mac / iPhone / iPad (navigateur)
    if (ua.includes('mac') || ua.includes('ipad') || ua.includes('iphone')) {
      return {
        type: 'macos',
        name: 'Mac / iPhone / iPad',
        icon: <Laptop className="w-5 h-5" />,
        biometricName: 'Touch ID / Face ID',
        biometricIcon: <Fingerprint className="w-5 h-5" />
      };
    }
    
    // Détection web - Linux
    if (ua.includes('linux') && !ua.includes('android')) {
      return {
        type: 'linux',
        name: 'Linux',
        icon: <Monitor className="w-5 h-5" />,
        biometricName: 'Authentificateur',
        biometricIcon: <Fingerprint className="w-5 h-5" />
      };
    }
    
    // Par défaut pour les autres cas
    return {
      type: 'unknown',
      name: 'Appareil inconnu',
      icon: <Monitor className="w-5 h-5" />,
      biometricName: 'Biométrie',
      biometricIcon: <Fingerprint className="w-5 h-5" />
    };
  };

  const deviceInfo = detectDevice();

  useEffect(() => {
    debugToast(
      'SecuritySettings (debug)',
      `platformContext: web=${isWeb} native=${isNative} ios=${isIOS} android=${isAndroid}`
    );
  }, [debugEnabled, isWeb, isNative, isIOS, isAndroid]);

  useEffect(() => {
    debugToast(
      'Device détecté',
      `${deviceInfo.name} • ${deviceInfo.biometricName} • ${isNative ? 'App native' : 'Web'}`
    );
  }, [debugEnabled, deviceInfo.name, deviceInfo.biometricName, isNative]);

  useEffect(() => {
    if (!debugEnabled) return;
    debugToast(
      'WebAuthn état',
      `supported=${webAuthnSupported} available=${webAuthnAvailable} enabled=${webAuthnEnabled} creds=${webAuthnCredentials.length} loading=${webAuthnLoading}`
    );
  }, [debugEnabled, webAuthnSupported, webAuthnAvailable, webAuthnEnabled, webAuthnCredentials.length, webAuthnLoading]);

  useEffect(() => {
    if (!debugEnabled) return;
    debugToast(
      'Native biométrie état',
      `available=${nativeBiometricAvailable} enabled=${nativeBiometricEnabled} type=${nativeBiometryType} loading=${nativeBiometricLoading}`
    );
  }, [debugEnabled, nativeBiometricAvailable, nativeBiometricEnabled, nativeBiometryType, nativeBiometricLoading]);

  const handleRegisterWebAuthn = async () => {
    setIsRegistering(true);
    const result = await registerWebAuthn();
    
    if (result.success) {
      toast({
        title: "Authentification activée",
        description: `${deviceInfo.biometricName} est maintenant configuré pour ce compte`,
      });
    } else {
      debugToast('WebAuthn erreur', result.error || "Impossible d'activer l'authentification biométrique", 'destructive');
      toast({
        title: "Erreur",
        description: result.error || "Impossible d'activer l'authentification biométrique",
        variant: "destructive",
      });
    }
    setIsRegistering(false);
  };

  const handleRemoveWebAuthnCredential = async (credentialId: string) => {
    setDeletingId(credentialId);
    const success = await removeWebAuthnCredential(credentialId);
    
    if (success) {
      toast({
        title: "Appareil supprimé",
        description: "L'authentification biométrique a été désactivée pour cet appareil",
      });
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'appareil",
        variant: "destructive",
      });
    }
    setDeletingId(null);
  };

  const handleEnableNativeBiometric = async () => {
    setEnablingNative(true);
    try {
      const result = await BiometricService.enableBiometric();
      if (result.success) {
        toast({
          title: "Biométrie activée",
          description: `${deviceInfo.biometricName} est maintenant activé`,
        });
      } else {
        debugToast('Native biométrie erreur', result.error || 'Impossible d\'activer la biométrie', 'destructive');
        toast({
          title: "Erreur",
          description: result.error || "Impossible d'activer la biométrie",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      debugToast('Native biométrie exception', error?.message || 'Erreur lors de l\'activation', 'destructive');
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'activation",
        variant: "destructive",
      });
    }
    setEnablingNative(false);
  };

  const handleDisableNativeBiometric = async () => {
    setEnablingNative(true);
    try {
      await BiometricService.disableBiometric();
      toast({
        title: "Biométrie désactivée",
        description: "L'authentification biométrique a été désactivée",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la désactivation",
        variant: "destructive",
      });
    }
    setEnablingNative(false);
  };

  const getDeviceIcon = (deviceName: string | null) => {
    if (!deviceName) return <Smartphone className="w-5 h-5" />;
    const name = deviceName.toLowerCase();
    if (name.includes('windows')) return <Monitor className="w-5 h-5" />;
    if (name.includes('mac') || name.includes('touch id')) return <Laptop className="w-5 h-5" />;
    if (name.includes('face id')) return <ScanFace className="w-5 h-5" />;
    if (name.includes('android')) return <Smartphone className="w-5 h-5" />;
    return <Smartphone className="w-5 h-5" />;
  };

  const isLoading = webAuthnLoading || nativeBiometricLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-20 sm:pt-24 pb-8 max-w-2xl safe-area-inset">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-20 sm:pt-24 pb-8 max-w-2xl safe-area-inset">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">Sécurité Biométrique</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Gérez vos méthodes d'authentification</p>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Device Detection Card */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                {deviceInfo.icon}
                Appareil Détecté
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Configuration automatique basée sur votre appareil
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {deviceInfo.icon}
                  <div>
                    <p className="font-medium text-sm sm:text-base">{deviceInfo.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {deviceInfo.biometricName} {isNative ? '(App native)' : '(Web)'}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 self-start sm:self-auto">
                  {isNative ? 'Mobile' : 'Web'}
                </Badge>
              </div>
              
              {/* Debug info for mobile */}
              {isNative && (
                <div className="mt-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-xs text-green-600 font-medium">✓ Application native détectée</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Biométrie: {nativeBiometricAvailable ? 'Disponible' : 'Non disponible'} | 
                    Type: {nativeBiometryType === 'face' ? 'Face ID' : nativeBiometryType === 'fingerprint' ? 'Empreinte' : 'Aucun'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Web Authentication (WebAuthn) */}
          {isWeb && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
                  <Shield className="w-5 h-5 text-primary shrink-0" />
                  <span>Authentification Web</span>
                  {webAuthnEnabled && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                      Activée
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {webAuthnSupported 
                    ? `Utilisez ${deviceInfo.biometricName} pour vous connecter.`
                    : "WebAuthn n'est pas supporté sur ce navigateur."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
                {!webAuthnSupported ? (
                  <div className="flex items-start gap-2 p-3 sm:p-4 bg-destructive/10 rounded-lg text-destructive text-xs sm:text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Utilisez un navigateur moderne (Chrome, Safari, Firefox, Edge)</span>
                  </div>
                ) : !webAuthnAvailable ? (
                  <div className="flex items-start gap-2 p-3 sm:p-4 bg-yellow-500/10 rounded-lg text-yellow-600 text-xs sm:text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Aucun authentificateur détecté. Configurez {deviceInfo.biometricName} sur votre appareil.</span>
                  </div>
                ) : (
                  <>
                    {/* Capabilities info */}
                    {webAuthnCapabilities && (
                      <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          {deviceInfo.biometricIcon}
                          <span className="font-medium">{webAuthnCapabilities.deviceName}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Méthode disponible: {biometricType === 'faceId' ? 'Reconnaissance faciale' : biometricType === 'fingerprint' ? 'Empreinte digitale' : biometricType === 'touchId' ? 'Touch ID' : biometricType === 'windowsHello' ? 'Windows Hello' : 'Authentificateur'}
                        </p>
                      </div>
                    )}

                    {/* Registered devices */}
                    {webAuthnCredentials.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Appareils enregistrés</h4>
                        {webAuthnCredentials.map((cred) => (
                          <div 
                            key={cred.id} 
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {getDeviceIcon(cred.device_name)}
                              <div>
                                <p className="text-sm font-medium">{cred.device_name || "Appareil"}</p>
                                <p className="text-xs text-muted-foreground">
                                  Ajouté le {format(new Date(cred.created_at), "d MMMM yyyy", { locale: fr })}
                                  {cred.last_used_at && (
                                    <> • Utilisé le {format(new Date(cred.last_used_at), "d MMM", { locale: fr })}</>
                                  )}
                                </p>
                              </div>
                            </div>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  disabled={deletingId === cred.id}
                                >
                                  {deletingId === cred.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer cet appareil ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Vous ne pourrez plus utiliser l'authentification biométrique depuis {cred.device_name || "cet appareil"}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveWebAuthnCredential(cred.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add device button */}
                    <Button
                      onClick={handleRegisterWebAuthn}
                      disabled={isRegistering}
                      variant={webAuthnCredentials.length > 0 ? "outline" : "default"}
                      className="w-full gap-2"
                    >
                      {isRegistering ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Configuration en cours...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          {webAuthnCredentials.length > 0 
                            ? "Ajouter un autre appareil" 
                            : `Activer ${deviceInfo.biometricName}`
                          }
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Native Biometric Authentication */}
          {isNative && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
                  {deviceInfo.biometricIcon}
                  <span>{deviceInfo.biometricName}</span>
                  {nativeBiometricEnabled && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                      Activée
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {nativeBiometricAvailable 
                    ? `Déverrouillez l'application avec ${deviceInfo.biometricName}.`
                    : `${deviceInfo.biometricName} n'est pas configuré sur cet appareil.`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
                {!nativeBiometricAvailable ? (
                  <div className="flex items-start gap-2 p-3 sm:p-4 bg-yellow-500/10 rounded-lg text-yellow-600 text-xs sm:text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Configurez {deviceInfo.biometricName} dans les paramètres de votre appareil.</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {nativeBiometricEnabled ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium">
                            {nativeBiometricEnabled ? 'Biométrie activée' : 'Biométrie désactivée'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {nativeBiometryType === 'face' ? 'Face ID' : 
                             nativeBiometryType === 'fingerprint' ? 'Empreinte digitale' : 
                             'Authentification biométrique'}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={nativeBiometricEnabled}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleEnableNativeBiometric();
                          } else {
                            handleDisableNativeBiometric();
                          }
                        }}
                        disabled={enablingNative}
                      />
                    </div>

                    {!nativeBiometricEnabled && (
                      <Button
                        onClick={handleEnableNativeBiometric}
                        disabled={enablingNative}
                        className="w-full gap-2"
                      >
                        {enablingNative ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Activation en cours...
                          </>
                        ) : (
                          <>
                            {deviceInfo.biometricIcon}
                            Activer {deviceInfo.biometricName}
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Security Tips */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Shield className="w-5 h-5" />
                Conseils de sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-2 sm:space-y-3">
              <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>Connexion rapide et sécurisée</span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>Données biométriques stockées sur votre appareil</span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>Possibilité d'enregistrer plusieurs appareils</span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>Mot de passe disponible en cas de besoin</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SecuritySettings;
