import React, { useEffect, useState } from 'react';
import { BiometricService, BiometryType } from '@/services/biometricService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, Fingerprint, ScanFace, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export const BiometricSetup: React.FC = () => {
  const { t } = useLanguage();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [biometryType, setBiometryType] = useState<BiometryType>('none');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    setChecking(true);
    try {
      const native = BiometricService.isNativePlatform();
      setIsNative(native);

      if (!native) {
        setChecking(false);
        return;
      }

      const available = await BiometricService.isAvailable();
      setIsAvailable(available);

      if (available) {
        const type = await BiometricService.getBiometryType();
        setBiometryType(type);
        
        const enabled = await BiometricService.isBiometricEnabled();
        setIsEnabled(enabled);
      }
    } catch (error) {
      console.error('Error checking biometric status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleEnable = async () => {
    setLoading(true);
    try {
      const result = await BiometricService.enableBiometric();
      
      if (result.success) {
        setIsEnabled(true);
        toast.success(t('biometricEnabled') || 'Authentification biométrique activée');
      } else {
        toast.error(result.error || t('biometricError') || 'Erreur lors de l\'activation');
      }
    } catch (error: any) {
      toast.error(error.message || t('biometricError') || 'Erreur lors de l\'activation');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      await BiometricService.disableBiometric();
      setIsEnabled(false);
      toast.success(t('biometricDisabled') || 'Authentification biométrique désactivée');
    } catch (error: any) {
      toast.error(error.message || t('biometricError') || 'Erreur lors de la désactivation');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="ml-2">{t('loading') || 'Chargement...'}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not on native platform
  if (!isNative) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            {t('biometricAuth') || 'Authentification biométrique'}
          </CardTitle>
          <CardDescription>
            {t('biometricMobileOnly') || 'L\'authentification biométrique est disponible uniquement sur l\'application mobile iOS/Android.'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Biometry not available
  if (!isAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            {t('biometricNotAvailable') || 'Biométrie non disponible'}
          </CardTitle>
          <CardDescription>
            {t('biometricNotAvailableDesc') || 'Votre appareil ne supporte pas l\'authentification biométrique ou elle n\'est pas configurée.'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const IconComponent = biometryType === 'face' ? ScanFace : Fingerprint;
  const typeName = biometryType === 'face' 
    ? (t('faceId') || 'Face ID')
    : (t('touchId') || 'Touch ID / Empreinte digitale');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconComponent className="h-5 w-5" />
          {t('biometricAuth') || 'Authentification biométrique'}
        </CardTitle>
        <CardDescription>
          {t('biometricDesc') || `Utilisez ${typeName} pour vous connecter rapidement et en toute sécurité.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEnabled ? (
          <>
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="h-5 w-5" />
              <span>{t('biometricEnabledStatus') || `${typeName} activé`}</span>
            </div>
            <Button 
              onClick={handleDisable} 
              disabled={loading} 
              variant="destructive" 
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('loading') || 'Chargement...'}
                </>
              ) : (
                t('disableBiometric') || 'Désactiver la biométrie'
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-muted-foreground">
              <XCircle className="h-5 w-5" />
              <span>{t('biometricDisabledStatus') || 'Authentification biométrique désactivée'}</span>
            </div>
            <Button 
              onClick={handleEnable} 
              disabled={loading} 
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('loading') || 'Chargement...'}
                </>
              ) : (
                t('enableBiometric') || `Activer ${typeName}`
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
