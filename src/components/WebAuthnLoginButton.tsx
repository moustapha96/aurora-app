import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Fingerprint, ScanFace, Monitor, Loader2 } from "lucide-react";
import { 
  getBiometricCapabilities, 
  getBiometricName, 
  authenticateWebAuthn,
  BiometricType 
} from "@/services/webAuthnService";

interface WebAuthnLoginButtonProps {
  userId: string;
  onSuccess: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export const WebAuthnLoginButton = ({ 
  userId, 
  onSuccess, 
  onError,
  className 
}: WebAuthnLoginButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>('unknown');
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const checkCapabilities = async () => {
      const capabilities = await getBiometricCapabilities();
      setBiometricType(capabilities.biometricType);
      setIsAvailable(capabilities.isPlatformAvailable);
    };
    checkCapabilities();
  }, []);

  const handleClick = async () => {
    setLoading(true);
    
    const result = await authenticateWebAuthn(userId);
    
    if (result.success) {
      onSuccess();
    } else {
      onError?.(result.error || "Échec de l'authentification");
    }
    
    setLoading(false);
  };

  const getIcon = () => {
    switch (biometricType) {
      case 'faceId':
        return <ScanFace className="w-5 h-5" />;
      case 'windowsHello':
        return <Monitor className="w-5 h-5" />;
      default:
        return <Fingerprint className="w-5 h-5" />;
    }
  };

  if (!isAvailable) return null;

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={loading}
      className={`gap-2 border-gold/30 text-gold hover:bg-gold/10 ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Vérification...
        </>
      ) : (
        <>
          {getIcon()}
          {getBiometricName(biometricType)}
        </>
      )}
    </Button>
  );
};
