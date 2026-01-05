import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  Loader2,
  FileImage,
  FileSpreadsheet,
  File
} from 'lucide-react';
import { VerificationBadge, VerificationStatus } from '@/components/VerificationBadge';

interface DocumentWithStatus {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  verification_status: string;
  rejection_reason?: string;
  verified_at?: string;
}

export const UserDocumentsList = () => {
  const [documents, setDocuments] = useState<DocumentWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      // Get user's family documents
      const { data: familyDocs, error: familyError } = await supabase
        .from('family_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (familyError) throw familyError;

      // Get verification statuses
      const { data: verifications, error: verifyError } = await supabase
        .from('document_verifications')
        .select('document_id, status, rejection_reason, verified_at');

      if (verifyError) throw verifyError;

      // Map verifications to documents
      const verificationMap = new Map(
        verifications?.map(v => [v.document_id, v]) || []
      );

      const docsWithStatus = (familyDocs || []).map(doc => ({
        id: doc.id,
        file_name: doc.file_name,
        file_type: doc.file_type,
        file_size: doc.file_size,
        created_at: doc.created_at,
        verification_status: verificationMap.get(doc.id)?.status || 'not_verified',
        rejection_reason: verificationMap.get(doc.id)?.rejection_reason,
        verified_at: verificationMap.get(doc.id)?.verified_at
      }));

      setDocuments(docsWithStatus);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="w-5 h-5" />;
    if (type.includes('spreadsheet') || type.includes('excel')) return <FileSpreadsheet className="w-5 h-5" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const mapStatus = (status: string): VerificationStatus => {
    const validStatuses: VerificationStatus[] = ['verified', 'pending', 'rejected', 'initiated', 'review_needed', 'not_verified'];
    return validStatuses.includes(status as VerificationStatus) 
      ? status as VerificationStatus 
      : 'not_verified';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Statut de vos documents
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Suivez le statut de vérification de vos documents
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {getFileIcon(doc.file_type)}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{doc.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                </p>
                {doc.rejection_reason && (
                  <p className="text-xs text-red-400 mt-1">
                    Raison: {doc.rejection_reason}
                  </p>
                )}
                {doc.verified_at && doc.verification_status === 'verified' && (
                  <p className="text-xs text-green-400 mt-1">
                    Vérifié le {new Date(doc.verified_at).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
            <div className="ml-4">
              <VerificationBadge status={mapStatus(doc.verification_status)} type="document" size="md" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
