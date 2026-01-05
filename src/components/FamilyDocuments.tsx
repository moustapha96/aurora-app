import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  FileText, 
  Upload, 
  Trash2, 
  Download, 
  Loader2, 
  Eye,
  File,
  FileImage,
  FileSpreadsheet
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FamilyDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  description: string | null;
  created_at: string;
}

interface FamilyDocumentsProps {
  isOwnProfile: boolean;
}

export const FamilyDocuments = ({ isOwnProfile }: FamilyDocumentsProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<FamilyDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>("");
  const [previewName, setPreviewName] = useState<string>("");

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('family_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
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
      if (!user) throw new Error(t("notAuthenticated"));

      for (const file of Array.from(files)) {
        const filePath = `${user.id}/${Date.now()}-${file.name}`;
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('family-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Save metadata
        const { error: dbError } = await supabase
          .from('family_documents')
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
        title: t("documentsAdded"),
        description: `${files.length} ${t("documentsAddedSuccessfully")}`
      });
      loadDocuments();
    } catch (error) {
      console.error('Error uploading:', error);
      toast({
        title: t("error"),
        description: t("cannotAddDocument"),
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (doc: FamilyDocument) => {
    try {
      // Delete from storage
      await supabase.storage
        .from('family-documents')
        .remove([doc.file_path]);

      // Delete metadata
      const { error } = await supabase
        .from('family_documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      toast({
        title: t("documentDeleted"),
        description: t("documentDeletedSuccessfully")
      });
      loadDocuments();
    } catch (error) {
      console.error('Error deleting:', error);
      toast({
        title: t("error"),
        description: t("cannotDeleteDocument"),
        variant: "destructive"
      });
    }
  };

  const handlePreview = async (doc: FamilyDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('family-documents')
        .createSignedUrl(doc.file_path, 3600); // 1 hour expiry

      if (error) throw error;

      setPreviewUrl(data.signedUrl);
      setPreviewType(doc.file_type);
      setPreviewName(doc.file_name);
    } catch (error) {
      console.error('Error getting preview:', error);
      toast({
        title: t("error"),
        description: t("cannotDisplayDocument"),
        variant: "destructive"
      });
    }
  };

  const handleDownload = async (doc: FamilyDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('family-documents')
        .download(doc.file_path);

      if (error) throw error;

      // Create download link
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
        title: t("error"),
        description: t("cannotDownloadDocument"),
        variant: "destructive"
      });
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="w-5 h-5" />;
    if (type.includes('spreadsheet') || type.includes('excel')) return <FileSpreadsheet className="w-5 h-5" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const canPreviewInBrowser = (type: string) => {
    return type.startsWith('image/') || type === 'application/pdf';
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
            <FileText className="w-5 h-5 text-primary" />
            {t("privateDocuments")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("privateDocumentsDesc")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {isOwnProfile && (
            <div className="flex items-center gap-2">
              <Label htmlFor="doc-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span className="text-sm">{t("addDocument")}</span>
                </div>
              </Label>
              <Input
                id="doc-upload"
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
              {t("noPrivateDocuments")}
            </p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(doc.file_type)}
                    <div>
                      <p className="text-sm font-medium">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {canPreviewInBrowser(doc.file_type) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePreview(doc)}
                        title={t("view")}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(doc)}
                        title={t("download")}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {isOwnProfile && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(doc)}
                        className="text-destructive hover:text-destructive"
                        title={t("delete")}
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
    </>
  );
};
