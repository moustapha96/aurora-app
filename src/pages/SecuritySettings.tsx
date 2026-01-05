import { useState, useEffect } from "react";
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
import { PageNavigation } from "@/components/BackButton";
import { usePlatformContext } from "@/contexts/PlatformContext";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
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

// Composant interne qui utilise les hooks normalement
const SecuritySettingsContent: React.FC = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
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
  
  // Platform context - hooks must be called at top level (React Rules of Hooks)
  const { isWeb, isNative, isIOS, isAndroid } = usePlatformContext();
  
  // WebAuthn for web
  const {
    isSupported: webAuthnSupported,
    isPlatformAvailable: webAuthnAvailable,
    isEnabled: webAuthnEnabled,
    credentials: webAuthnCredentials = [],
    isLoading: webAuthnLoading,
    register: registerWebAuthn,
    removeCredential: removeWebAuthnCredential,
    biometricType,
    capabilities: webAuthnCapabilities,
  } = useWebAuthn();
  
  // Native biometric for mobile
  const {
    isAvailable: nativeBiometricAvailable,
    isEnabled: nativeBiometricEnabled,
    biometryType: nativeBiometryType,
    loading: nativeBiometricLoading,
    enable: enableNativeBiometric,
    disable: disableNativeBiometric,
    refresh: refreshBiometricStatus,
  } = useBiometricAuth();

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
        biometricName: t('biometricFaceID') + ' / ' + t('biometricTouchID'),
        biometricIcon: <ScanFace className="w-5 h-5" />
      };
    }
    
    // Détection native Android (app Capacitor)
    if (isAndroid) {
      return {
        type: 'android',
        name: 'Appareil Android',
        icon: <Smartphone className="w-5 h-5" />,
        biometricName: t('webAuthEmpreinteDigitale'),
        biometricIcon: <Fingerprint className="w-5 h-5" />
      };
    }

    // Détection web - Windows
    if (ua.includes('windows')) {
      return {
        type: 'windows',
        name: 'Windows',
        icon: <Monitor className="w-5 h-5" />,
        biometricName: t('webAuthWindowsHello'),
        biometricIcon: <ScanFace className="w-5 h-5" />
      };
    }
    
    // Détection web - Mac / iPhone / iPad (navigateur)
    if (ua.includes('mac') || ua.includes('ipad') || ua.includes('iphone')) {
      return {
        type: 'macos',
        name: 'Mac / iPhone / iPad',
        icon: <Laptop className="w-5 h-5" />,
        biometricName: t('biometricTouchID') + ' / ' + t('biometricFaceID'),
        biometricIcon: <Fingerprint className="w-5 h-5" />
      };
    }
    
    // Détection web - Linux
    if (ua.includes('linux') && !ua.includes('android')) {
      return {
        type: 'linux',
        name: 'Linux',
        icon: <Monitor className="w-5 h-5" />,
        biometricName: t('webAuthAuthenticator'),
        biometricIcon: <Fingerprint className="w-5 h-5" />
      };
    }
    
    // Par défaut pour les autres cas
    return {
      type: 'unknown',
      name: t('deviceUnknown'),
      icon: <Monitor className="w-5 h-5" />,
      biometricName: t('biometric'),
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
      t('deviceDetected'),
      `${deviceInfo.name} • ${deviceInfo.biometricName} • ${isNative ? t('nativeApp') : t('webApp')}`
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
        title: t('authActivated'),
        description: t('authActivatedDesc').replace('{biometric}', deviceInfo.biometricName),
      });
    } else {
      debugToast('WebAuthn erreur', result.error || t('errorActivateAuth'), 'destructive');
      toast({
        title: t('errorTitle'),
        description: result.error || t('errorActivateAuth'),
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
        title: t('deviceRemoved'),
        description: t('deviceRemovedDesc'),
      });
    } else {
      toast({
        title: t('errorTitle'),
        description: t('errorRemoveDevice'),
        variant: "destructive",
      });
    }
    setDeletingId(null);
  };

  const handleEnableNativeBiometric = async () => {
    setEnablingNative(true);
    try {
      const result = await enableNativeBiometric();
      if (result.success) {
        toast({
          title: t('biometricEnabledTitle'),
          description: t('biometricEnabledDesc').replace('{biometric}', deviceInfo.biometricName),
        });
      } else {
        debugToast('Native biométrie erreur', result.error || t('errorActivateBiometric'), 'destructive');
        toast({
          title: t('errorTitle'),
          description: result.error || t('errorActivateBiometric'),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      debugToast('Native biométrie exception', error?.message || t('errorActivateBiometric'), 'destructive');
      toast({
        title: t('errorTitle'),
        description: error.message || t('errorActivateBiometric'),
        variant: "destructive",
      });
    }
    setEnablingNative(false);
  };

  const handleDisableNativeBiometric = async () => {
    setEnablingNative(true);
    try {
      await disableNativeBiometric();
      toast({
        title: t('biometricDisabledTitle'),
        description: t('biometricDisabledDesc'),
      });
    } catch (error: any) {
      toast({
        title: t('errorTitle'),
        description: error.message || t('errorDeactivateBiometric'),
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
      <PageNavigation to="/settings" />
      
      <main className="container mx-auto px-4 pt-32 sm:pt-36 pb-8 max-w-2xl safe-area-inset">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('securityBiometricTitle')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t('securityManageAuth')}</p>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Device Detection Card */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                {deviceInfo.icon}
                {t('deviceDetected')}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {t('deviceAutoConfig')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {deviceInfo.icon}
                  <div>
                    <p className="font-medium text-sm sm:text-base">{deviceInfo.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {deviceInfo.biometricName} {isNative ? `(${t('deviceNativeApp')})` : `(${t('deviceWeb')})`}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 self-start sm:self-auto">
                  {isNative ? t('deviceMobile') : t('deviceWeb')}
                </Badge>
              </div>
              
              {/* Debug info for mobile */}
              {isNative && (
                <div className="mt-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-xs text-green-600 font-medium">✓ {t('deviceNativeDetected')}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('biometric')}: {nativeBiometricAvailable ? t('biometricAvailable') : t('biometricNotAvailable')} | 
                    {t('biometricType')}: {nativeBiometryType === 'face' ? t('biometricFaceID') : nativeBiometryType === 'fingerprint' ? t('biometricFingerprint') : t('biometricNone')}
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
                  <span>{t('webAuthTitle')}</span>
                  {webAuthnEnabled && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                      {t('webAuthEnabled')}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {webAuthnSupported 
                    ? t('webAuthUseBiometric').replace('{biometric}', deviceInfo.biometricName)
                    : t('webAuthNotSupported')
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
                {/* Détection iframe - WebAuthn ne fonctionne pas dans les iframes */}
                {window.self !== window.top ? (
                  <div className="flex items-start gap-2 p-3 sm:p-4 bg-yellow-500/10 rounded-lg text-yellow-600 text-xs sm:text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{t('webAuthPreviewMode')}</p>
                      <p className="mt-1">{t('webAuthPreviewDesc').replace('{biometric}', deviceInfo.biometricName)}</p>
                    </div>
                  </div>
                ) : !webAuthnSupported ? (
                  <div className="flex items-start gap-2 p-3 sm:p-4 bg-destructive/10 rounded-lg text-destructive text-xs sm:text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{t('webAuthUseModernBrowser')}</span>
                  </div>
                ) : !webAuthnAvailable ? (
                  <div className="flex items-start gap-2 p-3 sm:p-4 bg-yellow-500/10 rounded-lg text-yellow-600 text-xs sm:text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{t('webAuthNoAuthenticator').replace('{biometric}', deviceInfo.biometricName)}</span>
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
                          {t('webAuthMethodAvailable')}: {biometricType === 'faceId' ? t('webAuthRecognitionFaciale') : biometricType === 'fingerprint' ? t('webAuthEmpreinteDigitale') : biometricType === 'touchId' ? t('webAuthTouchID') : biometricType === 'windowsHello' ? t('webAuthWindowsHello') : t('webAuthAuthenticator')}
                        </p>
                      </div>
                    )}

                    {/* Registered devices */}
                    {webAuthnCredentials.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">{t('registeredDevicesTitle')}</h4>
                        {webAuthnCredentials.map((cred) => (
                          <div 
                            key={cred.id} 
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {getDeviceIcon(cred.device_name)}
                              <div>
                                <p className="text-sm font-medium">{cred.device_name || t('deviceDefault')}</p>
                                <p className="text-xs text-muted-foreground">
                                  {t('deviceAddedOn')} {format(new Date(cred.created_at), "d MMMM yyyy", { locale: fr })}
                                  {cred.last_used_at && (
                                    <> • {t('deviceUsedOn')} {format(new Date(cred.last_used_at), "d MMM", { locale: fr })}</>
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
                                  <AlertDialogTitle>{t('deleteDeviceTitle')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('deleteDeviceDesc').replace('{device}', cred.device_name || t('deviceDefault'))}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveWebAuthnCredential(cred.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {t('deleteDevice')}
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
                          {t('configuringDevice')}
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          {webAuthnCredentials.length > 0 
                            ? t('addAnotherDevice') 
                            : t('activateBiometricDevice').replace('{biometric}', deviceInfo.biometricName)
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
                      {t('webAuthEnabled')}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {nativeBiometricAvailable 
                    ? t('nativeBiometricUnlock').replace('{biometric}', deviceInfo.biometricName)
                    : t('nativeBiometricNotConfigured').replace('{biometric}', deviceInfo.biometricName)
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
                {!nativeBiometricAvailable ? (
                  <div className="flex items-start gap-2 p-3 sm:p-4 bg-yellow-500/10 rounded-lg text-yellow-600 text-xs sm:text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{t('nativeBiometricConfigure').replace('{biometric}', deviceInfo.biometricName)}</span>
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
                            {nativeBiometricEnabled ? t('biometricEnabled') : t('biometricDisabled')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {nativeBiometryType === 'face' ? t('biometricFaceID') : 
                             nativeBiometryType === 'fingerprint' ? t('webAuthEmpreinteDigitale') : 
                             t('biometricAuthType')}
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
                            {t('activatingBiometric')}
                          </>
                        ) : (
                          <>
                            {deviceInfo.biometricIcon}
                            {t('activateBiometricNative').replace('{biometric}', deviceInfo.biometricName)}
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
                {t('securityTipsTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-2 sm:space-y-3">
              <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>{t('securityTip1')}</span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>{t('securityTip2')}</span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>{t('securityTip3')}</span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>{t('securityTip4')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

// Composant wrapper avec gestion d'erreur
const SecuritySettings: React.FC = () => {
  const { t } = useLanguage();
  const [error, setError] = useState<Error | null>(null);

  // Error boundary manuel avec useEffect
  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      console.error('SecuritySettings error:', event.error);
      setError(event.error);
    };

    const unhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('SecuritySettings unhandled rejection:', event.reason);
      setError(new Error(event.reason?.message || t('unexpectedError')));
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', unhandledRejection);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', unhandledRejection);
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <PageNavigation to="/settings" />
        <main className="container mx-auto px-4 pt-32 sm:pt-36 pb-8 max-w-2xl safe-area-inset">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                {t('errorTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {error.message || t('errorLoadingPage')}
              </p>
              <Button 
                onClick={() => {
                  setError(null);
                  window.location.reload();
                }}
                className="w-full"
              >
                {t('retry')}
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.history.back()}
                className="w-full"
              >
                {t('back')}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  try {
    return <SecuritySettingsContent />;
  } catch (err: any) {
    console.error('Error rendering SecuritySettings:', err);
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <PageNavigation to="/settings" />
        <main className="container mx-auto px-4 pt-32 sm:pt-36 pb-8 max-w-2xl safe-area-inset">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                {t('errorTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {err?.message || t('errorLoadingPage')}
              </p>
              <Button 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                {t('reloadPage')}
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.history.back()}
                className="w-full"
              >
                {t('back')}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
};

export default SecuritySettings;
