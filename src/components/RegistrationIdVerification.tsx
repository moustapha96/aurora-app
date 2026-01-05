import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Scan, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  Upload
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface RegistrationIdVerificationProps {
  onVerificationComplete: (verified: boolean, extractedData?: { firstName: string; lastName: string }) => void;
  onDataExtracted: (data: { firstName: string; lastName: string }) => void;
}

type VerificationStatus = 'idle' | 'uploading' | 'analyzing' | 'verified' | 'failed' | 'partial';

export function RegistrationIdVerification({ 
  onVerificationComplete,
  onDataExtracted
}: RegistrationIdVerificationProps) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<{ firstName: string; lastName: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error(t('unsupportedFormat'));
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('fileTooLarge'));
      return;
    }

    setSelectedFile(file);
    setStatus('uploading');
    setErrorMessage(null);

    // Process the file
    await analyzeIdDocument(file);
  };

  const analyzeIdDocument = async (file: File) => {
    setStatus('analyzing');
    toast.info(t('analyzingIdDocument'));

    try {
      // Convert to base64
      const base64 = await fileToBase64(file);
      
      console.log('Calling analyze-id-card function...');
      
      // Call edge function to analyze ID card
      const { data, error } = await supabase.functions.invoke('analyze-id-card', {
        body: { imageBase64: base64 }
      });

      console.log('Analysis response:', { data, error });

      if (error) {
        console.error('Analysis error:', error);
        throw new Error(error.message || t('errorDuringAnalysis'));
      }

      if (data.firstName && data.lastName) {
        // Full verification success
        setExtractedData({ firstName: data.firstName, lastName: data.lastName });
        setStatus('verified');
        onDataExtracted({ firstName: data.firstName, lastName: data.lastName });
        onVerificationComplete(true, { firstName: data.firstName, lastName: data.lastName });
        toast.success(t('documentVerifiedSuccess'));
      } else if (data.firstName || data.lastName) {
        // Partial extraction
        const partialData = { 
          firstName: data.firstName || '', 
          lastName: data.lastName || '' 
        };
        setExtractedData(partialData);
        setStatus('partial');
        onDataExtracted(partialData);
        onVerificationComplete(false, partialData);
        toast.warning(t('partialExtraction'));
      } else {
        // No data extracted
        setStatus('failed');
        setErrorMessage(t('failedToExtract'));
        onVerificationComplete(false);
        toast.error(t('analysisFailed'));
      }
    } catch (err: any) {
      console.error('Error analyzing document:', err);
      setStatus('failed');
      setErrorMessage(err.message || t('errorDuringAnalysis'));
      onVerificationComplete(false);
      toast.error(t('errorDuringAnalysis'));
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleRetry = () => {
    setStatus('idle');
    setSelectedFile(null);
    setExtractedData(null);
    setErrorMessage(null);
  };

  const renderStatusBadge = () => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t('verified')}
          </Badge>
        );
      case 'partial':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {t('partial')}
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            {t('failed')}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* File Upload */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gold/80 text-sm font-serif">{t('idDocument')}</span>
          {renderStatusBadge()}
        </div>
        
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileSelect}
          id="id-document-upload"
          className="hidden"
          disabled={status === 'uploading' || status === 'analyzing'}
        />
        
        {status === 'idle' && (
          <Button
            type="button"
            onClick={() => document.getElementById('id-document-upload')?.click()}
            variant="outline"
            className="w-full border-gold/30 text-gold hover:bg-gold/10"
          >
            <Scan className="w-4 h-4 mr-2" />
            {t('scanIdDocument')}
          </Button>
        )}

        {(status === 'uploading' || status === 'analyzing') && (
          <div className="flex items-center justify-center gap-3 p-4 border border-gold/20 rounded-lg bg-gold/5">
            <Loader2 className="w-5 h-5 text-gold animate-spin" />
            <span className="text-gold/80">
              {status === 'uploading' ? t('uploadingDocument') : t('analyzing')}
            </span>
          </div>
        )}

        {status === 'verified' && extractedData && (
          <Alert className="bg-green-500/10 border-green-500/30">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-400">
              <div className="space-y-1">
                <p className="font-medium">{t('documentVerifiedSuccessFull')}</p>
                <p className="text-sm opacity-80">
                  {t('identityDetected')}: {extractedData.firstName} {extractedData.lastName}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {status === 'partial' && extractedData && (
          <Alert className="bg-yellow-500/10 border-yellow-500/30">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-400">
              <div className="space-y-2">
                <p className="font-medium">{t('partialExtraction')}</p>
                <p className="text-sm opacity-80">
                  {t('extractedData')}: {extractedData.firstName || '?'} {extractedData.lastName || '?'}
                </p>
                <p className="text-sm opacity-80">
                  {t('completeMissingFields')}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {status === 'failed' && (
          <div className="space-y-3">
            <Alert className="bg-red-500/10 border-red-500/30">
              <XCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-400">
                <div className="space-y-1">
                  <p className="font-medium">{t('verificationFailed')}</p>
                  <p className="text-sm opacity-80">{errorMessage}</p>
                </div>
              </AlertDescription>
            </Alert>
            <Button
              type="button"
              onClick={handleRetry}
              variant="outline"
              className="w-full border-gold/30 text-gold hover:bg-gold/10"
            >
              <Upload className="w-4 h-4 mr-2" />
              {t('retryWithAnotherDocument')}
            </Button>
          </div>
        )}

        {selectedFile && (status === 'verified' || status === 'partial') && (
          <div className="flex items-center gap-2 p-2 border border-gold/20 rounded bg-gold/5">
            <FileText className="w-4 h-4 text-gold/60" />
            <span className="text-sm text-gold/80 truncate">{selectedFile.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              className="ml-auto text-gold/60 hover:text-gold text-xs"
            >
              {t('change')}
            </Button>
          </div>
        )}
      </div>

      {/* Help text */}
      {status === 'idle' && (
        <p className="text-xs text-gold/50">
          {t('acceptedFormats')} {t('identityVerificationRequired')}
        </p>
      )}
    </div>
  );
}

export default RegistrationIdVerification;
