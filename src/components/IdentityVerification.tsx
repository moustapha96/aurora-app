import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Fingerprint, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw,
  Upload,
  FileImage,
  Eye,
  Camera,
  Trash2
} from 'lucide-react';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import { toast } from 'sonner';
import { VerificationBadge, VerificationStatus } from '@/components/VerificationBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface IdentityVerificationProps {
  /** Callback appelé quand le statut de vérification change (pour rafraîchir le profil parent) */
  onVerificationChange?: () => void;
}

export function IdentityVerification({ onVerificationChange }: IdentityVerificationProps) {
  const { t } = useLanguage();
  const { 
    verificationStatus, 
    profileVerification, 
    loading, 
    initiating,
    uploading,
    analyzing,
    refreshing,
    testModeEnabled,
    initiateVerification,
    uploadDocument,
    refreshAndUpdateStatus,
    deleteDocumentAndReset
  } = useIdentityVerification();

  const [showDocument, setShowDocument] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDeleteAndRetry = async () => {
    setDeleting(true);
    const result = await deleteDocumentAndReset();
    setDeleting(false);
    
    if (result.success) {
      if (testModeEnabled && profileVerification.verified) {
        toast.success(t('verificationResetTestMode'));
        onVerificationChange?.();
      } else {
        toast.success(t('documentDeletedPleaseUploadNew'));
      }
    } else {
      toast.error(result.error || t('errorDeleting'));
    }
  };

  // Helper to display extracted name
  const extractedName = verificationStatus.firstNameExtracted || verificationStatus.lastNameExtracted
    ? `${verificationStatus.firstNameExtracted || ''} ${verificationStatus.lastNameExtracted || ''}`.trim()
    : null;

  const hasVeriffSession = Boolean(verificationStatus.sessionId);
  const isStaleRequest = verificationStatus.createdAt
    ? Date.now() - new Date(verificationStatus.createdAt).getTime() > 2 * 60 * 60 * 1000
    : false;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error(t('unsupportedFormatUseJpgPngWebpPdf'));
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('fileTooLargeMax10MB'));
      return;
    }

    const result = await uploadDocument(file);
    if (result.success) {
      if (result.extractedName?.firstName || result.extractedName?.lastName) {
        const name = `${result.extractedName.firstName || ''} ${result.extractedName.lastName || ''}`.trim();
        toast.success(`${t('documentSavedIdentityDetected')} ${name}`);
      } else {
        toast.success(t('documentSavedSuccessfully'));
      }
    } else {
      toast.error(result.error || t('uploadError'));
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartVerification = async () => {
    // Check if document exists first
    if (!verificationStatus.documentUrl) {
      toast.error(t('pleaseUploadIdFirst'));
      return;
    }

    const result = await initiateVerification();
    
    if (result.success && result.redirectUrl) {
      toast.success(t('redirectingToVerification'));
      
      // On mobile, use direct navigation instead of popup (which is often blocked)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Direct navigation for mobile - works better in WebViews and mobile browsers
        window.location.href = result.redirectUrl;
      } else {
        // Desktop can use new tab
        window.open(result.redirectUrl, '_blank');
      }
    } else {
      toast.error(result.error || t('errorInitializingVerification'));
    }
  };

  const getVerificationStatusValue = (): VerificationStatus => {
    if (profileVerification.verified) {
      return 'verified';
    }
    
    switch (verificationStatus.status) {
      case 'initiated':
        return 'initiated';
      case 'pending':
        return 'pending';
      case 'rejected':
        return 'rejected';
      case 'review_needed':
        return 'review_needed';
      default:
        return 'not_verified';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">{t('loading')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{t('identityVerification')}</CardTitle>
            </div>
            <VerificationBadge status={getVerificationStatusValue()} type="identity" size="md" />
          </div>
          <CardDescription>
            {t('verifyIdentityToAccessAllFeatures')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profileVerification.verified ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                <div className="flex items-center gap-2 text-green-500 mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">{t('identityVerified')}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('identityVerifiedSuccessfully')}
                  {profileVerification.verifiedAt && (
                    <> {t('on')} {new Date(profileVerification.verifiedAt).toLocaleDateString(navigator.language || 'en-US')}</>
                  )}
                  .
                </p>
                {verificationStatus.documentType && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('document')}: {verificationStatus.documentType}
                    {verificationStatus.documentCountry && ` (${verificationStatus.documentCountry})`}
                  </p>
                )}
              </div>

              {/* Show document if exists */}
              {verificationStatus.documentUrl && (
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileImage className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">{t('identityDocumentSaved')}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowDocument(true)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {t('view')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Test mode: allow resetting verification */}
              {testModeEnabled && (
                <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
                  <div className="flex items-center gap-2 text-purple-500 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">{t('testModeEnabled')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {t('canResetVerificationForTesting')}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDeleteAndRetry}
                    disabled={deleting}
                    className="border-purple-500/30 text-purple-500 hover:bg-purple-500/10"
                  >
                    {deleting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        {t('resetting')}
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('resetVerification')}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : verificationStatus.status === 'initiated' || verificationStatus.status === 'pending' ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
                <div className="flex items-center gap-2 text-yellow-500 mb-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">{t('verificationInProgress')}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {hasVeriffSession
                    ? t('verificationProcessingClickForResult')
                    : t('documentSavedVeriffNotLaunched')}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {hasVeriffSession ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const result = await refreshAndUpdateStatus();
                        if (result.success) {
                          if (result.status === 'verified') {
                            toast.success(t('verificationApprovedIdentityConfirmed'));
                            onVerificationChange?.();
                          } else if (result.status === 'rejected') {
                            toast.error(t('verificationRejectedDeleteAndAddNew'));
                          } else if (result.status === 'pending' || result.status === 'initiated') {
                            if (isStaleRequest) {
                              toast.warning(t('verificationStuckDeleteAndRestart'));
                            } else {
                              toast.info(t('verificationStillProcessingRetryLater'));
                            }
                          } else if (result.status === 'review_needed') {
                            toast.warning(t('verificationManualReviewAdminWillExamine'));
                          } else {
                            toast.info(`${t('currentStatus')}: ${result.status || t('unknown')}. ${t('pleaseWaitOrRetry')}`);
                          }
                        } else {
                          toast.error(result.error || t('verificationError'));
                        }
                      }}
                      disabled={refreshing || deleting}
                    >
                      {refreshing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          {t('verifying')}
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          {t('getResult')}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartVerification}
                      disabled={initiating || deleting}
                    >
                      {initiating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          {t('launching')}
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {t('startVerification')}
                        </>
                      )}
                    </Button>
                  )}

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteAndRetry}
                    disabled={deleting || refreshing || initiating}
                  >
                    {deleting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        {t('deleting')}
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('deleteAndRetry')}
                      </>
                    )}
                  </Button>
                </div>

                {isStaleRequest && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {t('requestSeemsBlockedDeleteAndRestart')}
                  </p>
                )}
              </div>

              {/* Show document if exists */}
              {verificationStatus.documentUrl && (
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileImage className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">{t('documentSubmitted')}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowDocument(true)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {t('view')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : verificationStatus.status === 'rejected' || verificationStatus.status === 'review_needed' ? (
            <div className="space-y-4">
              <div className={`rounded-lg p-4 ${
                verificationStatus.status === 'rejected' 
                  ? 'bg-red-500/10 border border-red-500/20' 
                  : 'bg-orange-500/10 border border-orange-500/20'
              }`}>
                <div className={`flex items-center gap-2 mb-2 ${
                  verificationStatus.status === 'rejected' ? 'text-red-500' : 'text-orange-500'
                }`}>
                  {verificationStatus.status === 'rejected' ? (
                    <XCircle className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  <span className="font-medium">
                    {verificationStatus.status === 'rejected' 
                      ? t('verificationRejected') 
                      : t('verificationIncomplete')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {verificationStatus.status === 'rejected' 
                    ? t('verificationNotValidatedDeleteAndUploadNew')
                    : t('additionalInfoNeededRestartWithNewDocument')}
                </p>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDeleteAndRetry}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer et réessayer
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Document upload section */}
              <div className="rounded-lg border border-border p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  {t('identityDocumentCNI')}
                </h4>
                
                {verificationStatus.documentUrl ? (
                  <div className="space-y-3">
                    {/* Extracted name display */}
                    {extractedName && (
                      <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-green-500">
                          {t('identityDetected')}: {extractedName}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileImage className="h-5 w-5 text-green-500" />
                        <span className="text-sm font-medium">{t('documentSaved')}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowDocument(true)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {t('view')}
                      </Button>
                    </div>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="text-muted-foreground"
                    >
                      {uploading ? t('uploading') : t('replaceDocument')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {t('pleaseUploadIdDocumentToStartVerification')}
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || analyzing}
                    >
                      {uploading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          {t('uploading')}
                        </>
                      ) : analyzing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          {t('analyzing')}
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {t('uploadDocument')}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="font-medium mb-2">{t('whyVerifyIdentity')}</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>{t('fullAccessToAllFeatures')}</li>
                  <li>{t('verifiedMemberBadgeOnProfile')}</li>
                  <li>{t('increasedTrustFromOtherMembers')}</li>
                  <li>{t('protectionAgainstIdentityTheft')}</li>
                </ul>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="font-medium mb-2">{t('acceptedDocuments')}</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>{t('passport')}</li>
                  <li>{t('nationalIdCard')}</li>
                  <li>{t('driversLicense')}</li>
                </ul>
              </div>

              <Button 
                onClick={handleStartVerification} 
                disabled={initiating || !verificationStatus.documentUrl}
                className="w-full"
              >
                {initiating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {t('initializing')}
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t('startVerification')}
                  </>
                )}
              </Button>

              {!verificationStatus.documentUrl && (
                <p className="text-xs text-yellow-500 text-center">
                  {t('uploadDocumentFirstToStartVerification')}
                </p>
              )}

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm">{t('veriffCertificationsTitle')}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('veriffCertificationsDescription')}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document preview dialog */}
      <Dialog open={showDocument} onOpenChange={setShowDocument}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('identityDocument')}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {/* Extracted name in dialog */}
            {extractedName && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">
                  {t('identityDetected')}: {extractedName}
                </span>
              </div>
            )}
            {verificationStatus.documentUrl && (
              verificationStatus.documentUrl.toLowerCase().endsWith('.pdf') ? (
                <div className="flex flex-col items-center gap-4 p-8 border rounded-lg">
                  <FileImage className="h-16 w-16 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{t('pdfDocument')}</p>
                  <Button asChild variant="outline">
                    <a href={verificationStatus.documentUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t('openPdf')}
                    </a>
                  </Button>
                </div>
              ) : (
                <img 
                  src={verificationStatus.documentUrl} 
                  alt={t('identityDocument')}
                  className="w-full rounded-lg border"
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
