import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Capacitor } from '@capacitor/core';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt = () => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    // Ne pas afficher sur les applications natives
    if (isNative) {
      return;
    }

    // Vérifier si l'application est déjà installée
    const checkIfInstalled = () => {
      // Vérifier si l'application est en mode standalone (installée)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // Vérifier aussi pour iOS
      const isIOSStandalone = (window.navigator as any).standalone === true;
      
      if (isStandalone || isIOSStandalone) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    if (checkIfInstalled()) {
      return;
    }

    // Vérifier si l'utilisateur a déjà refusé l'installation
    const installPromptDismissed = localStorage.getItem('install_prompt_dismissed');
    if (installPromptDismissed) {
      return;
    }

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Afficher le prompt immédiatement
      if (!hasChecked) {
        setHasChecked(true);
        if (!checkIfInstalled()) {
          setOpen(true);
        }
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Pour iOS Safari, afficher immédiatement
    if (!hasChecked) {
      setHasChecked(true);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      
      if (isIOS && isSafari) {
        if (!checkIfInstalled()) {
          setOpen(true);
        }
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isNative, hasChecked]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Pour iOS Safari, afficher les instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        // Instructions pour iOS
        alert(t('iosInstallInstructions'));
        setOpen(false);
        localStorage.setItem('install_prompt_dismissed', 'true');
        return;
      }
      return;
    }

    setIsInstalling(true);

    try {
      // Afficher le prompt d'installation
      await deferredPrompt.prompt();
      
      // Attendre la réponse de l'utilisateur
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        // L'utilisateur a accepté l'installation
        setOpen(false);
        setIsInstalled(true);
      } else {
        // L'utilisateur a refusé
        setOpen(false);
        localStorage.setItem('install_prompt_dismissed', 'true');
      }
    } catch (error) {
      console.error('Erreur lors de l\'installation:', error);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('install_prompt_dismissed', 'true');
    setOpen(false);
  };

  // Ne pas afficher si déjà installée ou sur application native
  if (isInstalled || isNative || !open) {
    return null;
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  const showIOSInstructions = isIOS && isSafari && !deferredPrompt;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-card-surface border-gold/30 max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gold/10 rounded-full">
              <Smartphone className="w-8 h-8 text-gold" />
            </div>
          </div>
          <DialogTitle className="text-gold text-xl">
            {t('installAppTitle')}
          </DialogTitle>
          <DialogDescription className="text-gold/60 space-y-2 mt-2">
            <p>
              {t('installAppDescription')}
            </p>
            {showIOSInstructions && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg text-left text-sm space-y-2">
                <p className="font-medium">{t('iosInstallSteps')}:</p>
                <ol className="list-decimal list-inside space-y-1 text-gold/80">
                  <li>{t('iosInstallStep1')}</li>
                  <li>{t('iosInstallStep2')}</li>
                  <li>{t('iosInstallStep3')}</li>
                </ol>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 text-gold/80 mt-3">
              <Download className="w-4 h-4" />
              <span className="text-sm">{t('installAppBenefits')}</span>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <div className="text-sm text-gold/60 space-y-2">
            <p>✓ {t('installBenefit1')}</p>
            <p>✓ {t('installBenefit2')}</p>
            <p>✓ {t('installBenefit3')}</p>
            <p>✓ {t('installBenefit4')}</p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={handleInstall}
            disabled={isInstalling}
            className="w-full bg-gold hover:bg-gold/90 text-black font-medium"
          >
            {isInstalling ? (
              <>
                <Download className="w-4 h-4 mr-2 animate-pulse" />
                {t('installing')}
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {showIOSInstructions ? t('gotIt') : t('installNow')}
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={handleDismiss}
            className="w-full text-gold/60 hover:text-gold hover:bg-gold/10"
          >
            {t('maybeLater')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
