import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type VerificationStatus = 'idle' | 'verifying' | 'valid' | 'invalid' | 'warning';

export interface VerificationResult {
  isValid: boolean;
  hasFace: boolean;
  isAppropriate: boolean;
  qualityOk: boolean;
  reason: string;
}

export const useProfileImageVerification = () => {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const verifyImage = async (base64Image: string): Promise<VerificationResult | null> => {
    setVerificationStatus('verifying');
    setVerificationResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-profile-image', {
        body: { imageBase64: base64Image }
      });

      if (error) {
        console.error('Profile verification error:', error);
        setVerificationStatus('warning');
        toast.warning("Vérification impossible, vous pouvez continuer.");
        return null;
      }

      const result = data as VerificationResult;
      setVerificationResult(result);

      if (result.isValid) {
        setVerificationStatus('valid');
        toast.success("Photo de profil validée !");
      } else if (result.hasFace && result.isAppropriate) {
        setVerificationStatus('warning');
        toast.warning(result.reason);
      } else {
        setVerificationStatus('invalid');
        toast.error(result.reason);
      }

      return result;
    } catch (error) {
      console.error('Profile verification error:', error);
      setVerificationStatus('warning');
      toast.warning("Vérification impossible, vous pouvez continuer.");
      return null;
    }
  };

  const resetVerification = () => {
    setVerificationStatus('idle');
    setVerificationResult(null);
  };

  return {
    verificationStatus,
    verificationResult,
    verifyImage,
    resetVerification,
    isVerifying: verificationStatus === 'verifying',
    isValid: verificationStatus === 'valid',
    isInvalid: verificationStatus === 'invalid',
    canProceed: verificationStatus === 'valid' || verificationStatus === 'warning'
  };
};
