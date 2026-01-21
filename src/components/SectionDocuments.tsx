import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Upload, 
  Trash2, 
  Download, 
  Loader2, 
  Eye,
  File as FileIcon,
  FileImage,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Info
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type DocumentSection = 'family' | 'business' | 'personal' | 'network';

interface SectionDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  description: string | null;
  created_at: string;
}

interface DocumentVerification {
  id: string;
  document_id: string;
  status: string;
  rejection_reason?: string;
  verified_at?: string;
  verification_result?: {
    reason?: string;
    confidence?: number;
    details?: string;
  };
  created_at: string;
}

interface SectionDocumentsProps {
  section: DocumentSection;
  isOwnProfile: boolean;
  title?: string;
  description?: string;
}

const SECTION_CONFIG: Record<DocumentSection, {
  tableName: string;
  bucketName: string;
  defaultTitle: string;
  defaultDescription: string;
  icon: React.ReactNode;
}> = {
  family: {
    tableName: 'family_documents',
    bucketName: 'family-documents',
    defaultTitle: 'Documents lignée',
    defaultDescription: 'Documents privés liés à votre lignée',
    icon: <FileText className="w-5 h-5 text-primary" />
  },
  business: {
    tableName: 'business_documents',
    bucketName: 'business-documents',
    defaultTitle: 'Documents professionnels',
    defaultDescription: 'CV, lettres de recommandation, certifications professionnelles',
    icon: <FileText className="w-5 h-5 text-blue-500" />
  },
  personal: {
    tableName: 'personal_documents',
    bucketName: 'personal-documents',
    defaultTitle: 'Documents passions',
    defaultDescription: 'Documents liés à vos passions et centres d\'intérêt',
    icon: <FileText className="w-5 h-5 text-purple-500" />
  },
  network: {
    tableName: 'network_documents',
    bucketName: 'network-documents',
    defaultTitle: 'Documents réseau',
    defaultDescription: 'Attestations de clubs, certificats d\'adhésion',
    icon: <FileText className="w-5 h-5 text-green-500" />
  }
};

export const SectionDocuments = ({ 
  section, 
  isOwnProfile, 
  title,
  description 
}: SectionDocumentsProps) => {
  const { toast } = useToast();
  const config = SECTION_CONFIG[section];
  const [documents, setDocuments] = useState<SectionDocument[]>([]);
  const [verifications, setVerifications] = useState<Map<string, DocumentVerification>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>("");
  const [previewName, setPreviewName] = useState<string>("");
  const [selectedDocForDetails, setSelectedDocForDetails] = useState<SectionDocument | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [section]);

  const loadDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load documents using dynamic query based on section
      let docsData: SectionDocument[] = [];
      
      if (section === 'family') {
        const { data, error } = await supabase
          .from('family_documents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        docsData = (data || []) as SectionDocument[];
      } else if (section === 'business') {
        const { data, error } = await supabase
          .from('business_documents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        docsData = (data || []) as SectionDocument[];
      } else if (section === 'personal') {
        const { data, error } = await supabase
          .from('personal_documents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        docsData = (data || []) as SectionDocument[];
      } else if (section === 'network') {
        const { data, error } = await supabase
          .from('network_documents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        docsData = (data || []) as SectionDocument[];
      }

      setDocuments(docsData);

      // Load verifications for these documents
      if (docsData.length > 0) {
        const docIds = docsData.map((d) => d.id);
        const { data: verifData } = await supabase
          .from('document_verifications')
          .select('*')
          .eq('document_type', `${section}_document`)
          .in('document_id', docIds);

        if (verifData) {
          const verifMap = new Map<string, DocumentVerification>();
          verifData.forEach(v => verifMap.set(v.document_id, v as DocumentVerification));
          setVerifications(verifMap);
        }
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      for (const file of Array.from(files)) {
        const filePath = `${user.id}/${Date.now()}-${file.name}`;
        
        // Ensure proper MIME type
        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
        const mimeTypes: Record<string, string> = {
          'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
          'gif': 'image/gif', 'webp': 'image/webp', 'pdf': 'application/pdf',
          'doc': 'application/msword', 'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'xls': 'application/vnd.ms-excel', 'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'txt': 'text/plain'
        };
        const contentType = mimeTypes[fileExt] || file.type || 'application/octet-stream';
        const properFile = new File([file], file.name, { type: contentType, lastModified: Date.now() });
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from(config.bucketName)
          .upload(filePath, properFile, { contentType });

        if (uploadError) throw uploadError;

        // Save metadata
        const { error: dbError } = await supabase
          .from(config.tableName as any)
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size
          });

        if (dbError) throw dbError;
      }

      toast({
        title: "Documents ajoutés",
        description: `${files.length} document(s) ajouté(s) avec succès`
      });
      loadDocuments();
    } catch (error) {
      console.error('Error uploading:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le document",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (doc: SectionDocument) => {
    try {
      // Delete from storage
      await supabase.storage
        .from(config.bucketName)
        .remove([doc.file_path]);

      // Delete metadata
      const { error } = await supabase
        .from(config.tableName as any)
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      toast({
        title: "Document supprimé",
        description: "Le document a été supprimé avec succès"
      });
      loadDocuments();
    } catch (error) {
      console.error('Error deleting:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le document",
        variant: "destructive"
      });
    }
  };

  const handlePreview = async (doc: SectionDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from(config.bucketName)
        .createSignedUrl(doc.file_path, 3600);

      if (error) throw error;

      setPreviewUrl(data.signedUrl);
      setPreviewType(doc.file_type);
      setPreviewName(doc.file_name);
    } catch (error) {
      console.error('Error getting preview:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'afficher le document",
        variant: "destructive"
      });
    }
  };

  const handleDownload = async (doc: SectionDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from(config.bucketName)
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le document",
        variant: "destructive"
      });
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="w-5 h-5" />;
    if (type.includes('spreadsheet') || type.includes('excel')) return <FileSpreadsheet className="w-5 h-5" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5" />;
    return <FileIcon className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const canPreviewInBrowser = (type: string) => {
    return type.startsWith('image/') || type === 'application/pdf';
  };

  const getVerificationBadge = (docId: string) => {
    const verification = verifications.get(docId);
    if (!verification) {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <Clock className="w-3 h-3 mr-1" />
          Non vérifié
        </Badge>
      );
    }

    switch (verification.status) {
      case 'verified':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Vérifié
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeté
          </Badge>
        );
      case 'review_needed':
        return (
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
            <AlertCircle className="w-3 h-3 mr-1" />
            À réviser
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            {verification.status}
          </Badge>
        );
    }
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

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            {config.icon}
            {title || config.defaultTitle}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {description || config.defaultDescription}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {isOwnProfile && (
            <div className="flex items-center gap-2">
              <Label htmlFor={`doc-upload-${section}`} className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span className="text-sm">Ajouter un document</span>
                </div>
              </Label>
              <Input
                id={`doc-upload-${section}`}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
            </div>
          )}

          {documents.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              Aucun document
            </p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(doc.file_type)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getVerificationBadge(doc.id)}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedDocForDetails(doc)}
                        title="Détails de vérification"
                      >
                        <Info className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {canPreviewInBrowser(doc.file_type) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePreview(doc)}
                        title="Visualiser"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(doc)}
                      title="Télécharger"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {isOwnProfile && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(doc)}
                        className="text-destructive hover:text-destructive"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewName}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {previewType.startsWith('image/') ? (
              <img 
                src={previewUrl || ''} 
                alt={previewName}
                className="max-w-full h-auto mx-auto"
              />
            ) : previewType === 'application/pdf' ? (
              <iframe
                src={previewUrl || ''}
                className="w-full h-[70vh]"
                title={previewName}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Verification Details Dialog */}
      <VerificationDetailsDialog
        document={selectedDocForDetails}
        verification={selectedDocForDetails ? verifications.get(selectedDocForDetails.id) : undefined}
        section={section}
        onClose={() => setSelectedDocForDetails(null)}
      />
    </>
  );
};

// Popup de détails de vérification
interface VerificationDetailsDialogProps {
  document: SectionDocument | null;
  verification: DocumentVerification | undefined;
  section: DocumentSection;
  onClose: () => void;
}

const VerificationDetailsDialog = ({ 
  document, 
  verification, 
  section,
  onClose 
}: VerificationDetailsDialogProps) => {
  const [userInfo, setUserInfo] = useState<{ first_name: string; last_name: string } | null>(null);

  useEffect(() => {
    if (document) {
      loadUserInfo();
    }
  }, [document]);

  const loadUserInfo = async () => {
    if (!document) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setUserInfo(data);
      }
    }
  };

  const getSectionLabel = (section: DocumentSection) => {
    const labels: Record<DocumentSection, string> = {
      family: 'Lignée',
      business: 'Business',
      personal: 'Passions',
      network: 'Réseau'
    };
    return labels[section];
  };

  const getStatusInfo = (status?: string) => {
    switch (status) {
      case 'verified':
        return { label: 'Vérifié', color: 'text-green-400', icon: <CheckCircle className="w-5 h-5 text-green-400" /> };
      case 'pending':
        return { label: 'En attente de vérification', color: 'text-yellow-400', icon: <Clock className="w-5 h-5 text-yellow-400" /> };
      case 'rejected':
        return { label: 'Rejeté', color: 'text-red-400', icon: <XCircle className="w-5 h-5 text-red-400" /> };
      case 'review_needed':
        return { label: 'Révision nécessaire', color: 'text-orange-400', icon: <AlertCircle className="w-5 h-5 text-orange-400" /> };
      default:
        return { label: 'Non vérifié', color: 'text-muted-foreground', icon: <Clock className="w-5 h-5 text-muted-foreground" /> };
    }
  };

  if (!document) return null;

  const statusInfo = getStatusInfo(verification?.status);

  return (
    <Dialog open={!!document} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Détails du document
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Document Info */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Nom du fichier</p>
              <p className="font-medium truncate">{document.file_name}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Section</p>
                <Badge variant="outline">{getSectionLabel(section)}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Utilisateur</p>
                <p className="text-sm">
                  {userInfo ? `${userInfo.first_name} ${userInfo.last_name}` : '-'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Date d'ajout</p>
              <p className="text-sm">
                {new Date(document.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          {/* Verification Status */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              {statusInfo.icon}
              <span className={`font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>

            {verification && (
              <>
                {verification.verified_at && (
                  <div>
                    <p className="text-xs text-muted-foreground">Date de vérification</p>
                    <p className="text-sm">
                      {new Date(verification.verified_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}

                {verification.verification_result?.reason && (
                  <div>
                    <p className="text-xs text-muted-foreground">Résultat de l'analyse</p>
                    <p className="text-sm">{verification.verification_result.reason}</p>
                  </div>
                )}

                {verification.verification_result?.confidence !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">Confiance</p>
                    <p className="text-sm">{(verification.verification_result.confidence * 100).toFixed(0)}%</p>
                  </div>
                )}

                {verification.rejection_reason && (
                  <div>
                    <p className="text-xs text-muted-foreground">Raison du rejet</p>
                    <p className="text-sm text-red-400">{verification.rejection_reason}</p>
                  </div>
                )}

                {verification.verification_result?.details && (
                  <div>
                    <p className="text-xs text-muted-foreground">Détails</p>
                    <p className="text-sm text-muted-foreground">{verification.verification_result.details}</p>
                  </div>
                )}
              </>
            )}

            {!verification && (
              <p className="text-sm text-muted-foreground">
                Ce document n'a pas encore été vérifié par notre équipe.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
