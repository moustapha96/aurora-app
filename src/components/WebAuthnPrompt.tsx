import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Fingerprint, ScanFace, Monitor, ShieldCheck, Loader2 } from "lucide-react";
import { 
  getBiometricCapabilities, 
  getBiometricName,
  registerWebAuthn,
  hasCredentialForCurrentDevice,
  BiometricType 
} from "@/services/webAuthnService";
import { toast } from "sonner";

interface WebAuthnPromptProps {
  userId: string;
  userEmail: string;
  onComplete?: () => void;
}

export const WebAuthnPrompt = ({ userId, userEmail, onComplete }: WebAuthnPromptProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>('unknown');
  const [deviceName, setDeviceName] = useState('');
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const checkAndPrompt = async () => {
      if (hasChecked) return;
      setHasChecked(true);

      const capabilities = await getBiometricCapabilities();
      
      // Only prompt if biometric is available
      if (!capabilities.isPlatformAvailable) return;

      setBiometricType(capabilities.biometricType);
      setDeviceName(capabilities.deviceName);

      // Check if this device already has credentials
      const hasCredential = await hasCredentialForCurrentDevice(userId);
      
      // Check if user dismissed this prompt before (per device)
      const dismissKey = `webauthn_prompt_dismissed_${capabilities.biometricType}`;
      const dismissed = localStorage.getItem(dismissKey);
      
      // Show prompt if no credential and not dismissed
      if (!hasCredential && !dismissed) {
        // Small delay to not interrupt the user immediately
        setTimeout(() => setOpen(true), 2000);
      }
    };

    if (userId && userEmail) {
      checkAndPrompt();
    }
  }, [userId, userEmail, hasChecked]);

  const handleEnable = async () => {
    setLoading(true);
    
    const result = await registerWebAuthn(userId, userEmail);
    
    if (result.success) {
      toast.success(`${getBiometricName(biometricType)} activé avec succès`);
      setOpen(false);
      onComplete?.();
    } else {
      toast.error(result.error || "Erreur lors de l'activation");
    }
    
    setLoading(false);
  };

  const handleDismiss = () => {
    // Remember dismissal for this device type
    const dismissKey = `webauthn_prompt_dismissed_${biometricType}`;
    localStorage.setItem(dismissKey, 'true');
    setOpen(false);
  };

  const getIcon = () => {
    switch (biometricType) {
      case 'faceId':
        return <ScanFace className="w-12 h-12 text-gold" />;
      case 'windowsHello':
        return <Monitor className="w-12 h-12 text-gold" />;
      default:
        return <Fingerprint className="w-12 h-12 text-gold" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-black border-gold/30 max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <DialogTitle className="text-gold text-xl">
            Activer {getBiometricName(biometricType)} ?
          </DialogTitle>
          <DialogDescription className="text-gold/60 space-y-2">
            <p>
              Nous avons détecté que votre appareil ({deviceName}) supporte l'authentification biométrique.
            </p>
            <p className="flex items-center justify-center gap-2 text-gold/80">
              <ShieldCheck className="w-4 h-4" />
              Connexion sécurisée et rapide
            </p>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <div className="text-sm text-gold/60 space-y-2">
            <p>✓ Vos données biométriques restent sur votre appareil</p>
            <p>✓ Connexion instantanée à chaque visite</p>
            <p>✓ Sécurité renforcée pour votre compte</p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={handleEnable}
            disabled={loading}
            className="w-full bg-gold text-black hover:bg-gold/90"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Activation...
              </>
            ) : (
              `Activer ${getBiometricName(biometricType)}`
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={handleDismiss}
            disabled={loading}
            className="w-full text-gold/60 hover:text-gold hover:bg-transparent"
          >
            Plus tard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
