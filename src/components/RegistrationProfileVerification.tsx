import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface RegistrationProfileVerificationProps {
  imageBase64: string | null;
  onVerificationComplete: (isValid: boolean, reason: string) => void;
}

type VerificationStatus = 'idle' | 'analyzing' | 'valid' | 'invalid' | 'warning';

export const RegistrationProfileVerification = ({
  imageBase64,
  onVerificationComplete
}: RegistrationProfileVerificationProps) => {
  const { t } = useLanguage();
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [reason, setReason] = useState<string>('');
  const [details, setDetails] = useState<{
    hasFace: boolean;
    isAppropriate: boolean;
    qualityOk: boolean;
  } | null>(null);

  const analyzeImage = async () => {
    if (!imageBase64) {
      return;
    }

    setStatus('analyzing');
    setReason('');
    setDetails(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-profile-image', {
        body: { imageBase64 }
      });

      if (error) {
        console.error('Error analyzing profile image:', error);
        setStatus('warning');
        setReason(t('cannotVerifyImage'));
        onVerificationComplete(true, t('verificationNotAvailable'));
        return;
      }

      setDetails({
        hasFace: data.hasFace,
        isAppropriate: data.isAppropriate,
        qualityOk: data.qualityOk
      });

      if (data.isValid) {
        setStatus('valid');
        setReason(data.reason || t('photoValid'));
        onVerificationComplete(true, data.reason);
      } else {
        setStatus('invalid');
        setReason(data.reason || t('photoNonCompliant'));
        onVerificationComplete(false, data.reason);
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus('warning');
      setReason(t('errorDuringAnalysisPhoto'));
      onVerificationComplete(true, t('verificationError'));
    }
  };

  const renderStatusBadge = () => {
    switch (status) {
      case 'analyzing':
        return (
          <Badge variant="outline" className="border-blue-400 text-blue-400 bg-blue-400/10">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            {t('analyzing')}
          </Badge>
        );
      case 'valid':
        return (
          <Badge variant="outline" className="border-green-400 text-green-400 bg-green-400/10">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {t('photoValid')}
          </Badge>
        );
      case 'invalid':
        return (
          <Badge variant="outline" className="border-red-400 text-red-400 bg-red-400/10">
            <XCircle className="w-3 h-3 mr-1" />
            {t('photoNonCompliant')}
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="outline" className="border-yellow-400 text-yellow-400 bg-yellow-400/10">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {t('partialVerification')}
          </Badge>
        );
      default:
        return null;
    }
  };

  if (!imageBase64) {
    return null;
  }

  return (
    <div className="mt-3 space-y-3">
      {status === 'idle' && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={analyzeImage}
          className="border-gold/30 text-gold hover:bg-gold/10"
        >
          <User className="w-4 h-4 mr-2" />
          {t('verifyPhoto')}
        </Button>
      )}

      {status === 'analyzing' && (
        <div className="flex items-center gap-2 text-gold/60 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t('analyzingPhoto')}
        </div>
      )}

      {status !== 'idle' && status !== 'analyzing' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {renderStatusBadge()}
          </div>
          
          {reason && (
            <p className={`text-sm ${status === 'valid' ? 'text-green-400/80' : status === 'invalid' ? 'text-red-400/80' : 'text-yellow-400/80'}`}>
              {reason}
            </p>
          )}

          {details && (
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge 
                variant="outline" 
                className={details.hasFace ? 'border-green-400/50 text-green-400/80' : 'border-red-400/50 text-red-400/80'}
              >
                {details.hasFace ? '✓' : '✗'} {t('faceDetected')}
              </Badge>
              <Badge 
                variant="outline" 
                className={details.isAppropriate ? 'border-green-400/50 text-green-400/80' : 'border-red-400/50 text-red-400/80'}
              >
                {details.isAppropriate ? '✓' : '✗'} {t('appropriateContent')}
              </Badge>
              <Badge 
                variant="outline" 
                className={details.qualityOk ? 'border-green-400/50 text-green-400/80' : 'border-red-400/50 text-red-400/80'}
              >
                {details.qualityOk ? '✓' : '✗'} {t('qualityOk')}
              </Badge>
            </div>
          )}

          {status === 'invalid' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setStatus('idle');
                setReason('');
                setDetails(null);
              }}
              className="mt-2 border-gold/30 text-gold hover:bg-gold/10"
            >
              {t('retry')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
