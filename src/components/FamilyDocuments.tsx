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
  File as FileIcon,
  FileImage,
  FileSpreadsheet
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB pour stockage base64 en base

/** Indique si le contenu est déjà une URL utilisable (data: ou http). */
function isInlineUrl(pathOrUrl: string): boolean {
  return pathOrUrl.startsWith("data:") || pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://");
}

/** Normalise une URL (data: ou http) pour affichage (retire retours à la ligne). */
function getDocumentDisplayUrl(url: string): string {
  if (!url || typeof url !== "string") return "";
  const s = String(url).trim();
  if (s.startsWith("data:")) return s.replace(/\r?\n/g, "");
  return s;
}

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
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null); // pour PDF iframe (évite CSP)
  const [previewType, setPreviewType] = useState<string>("");
  const [previewName, setPreviewName] = useState<string>("");
  const [previewDoc, setPreviewDoc] = useState<FamilyDocument | null>(null);

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

  const getMimeType = (file: File): string => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif', 'webp': 'image/webp', 'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'doc': 'application/msword', 'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel', 'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain', 'csv': 'text/csv',
      'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'ogg': 'audio/ogg', 'm4a': 'audio/mp4',
      'mp4': 'video/mp4', 'webm': 'video/webm',
      'zip': 'application/zip', 'rar': 'application/x-rar-compressed'
    };
    return mimeTypes[ext] || file.type || 'application/octet-stream';
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Impossible de lire le fichier"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthenticated"));

      let added = 0;
      for (const file of Array.from(files)) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          toast({
            title: t("error"),
            description: (t("fileTooLarge") || "Fichier trop volumineux").replace("{max}", "5") + " MB",
            variant: "destructive"
          });
          continue;
        }
        const contentType = getMimeType(file);
        const dataUrl = await fileToDataUrl(file);
        const normalizedDataUrl = dataUrl.replace(/\r?\n/g, "");

        const { error: dbError } = await supabase.from('family_documents').insert({
          user_id: user.id,
          file_name: file.name,
          file_path: normalizedDataUrl,
          file_type: contentType,
          file_size: file.size
        });

        if (dbError) throw dbError;
        added++;
      }

      if (added > 0) {
        toast({
          title: t("documentsAdded"),
          description: `${added} ${t("documentsAddedSuccessfully")}`
        });
        loadDocuments();
      }
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
      if (!isInlineUrl(doc.file_path)) {
        await supabase.storage.from('family-documents').remove([doc.file_path]);
      }
      const { error } = await supabase.from('family_documents').delete().eq('id', doc.id);
      if (error) throw error;
      toast({ title: t("documentDeleted"), description: t("documentDeletedSuccessfully") });
      loadDocuments();
    } catch (error) {
      console.error('Error deleting:', error);
      toast({ title: t("error"), description: t("cannotDeleteDocument"), variant: "destructive" });
    }
  };

  const handlePreview = async (doc: FamilyDocument) => {
    try {
      setPreviewDoc(doc);
      setPreviewType(doc.file_type || "");
      setPreviewName(doc.file_name || "");
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
        setPreviewBlobUrl(null);
      }

      if (isInlineUrl(doc.file_path)) {
        const displayUrl = getDocumentDisplayUrl(doc.file_path);
        setPreviewUrl(displayUrl);
        if (displayUrl && (doc.file_type || "").toLowerCase() === "application/pdf") {
          try {
            const res = await fetch(displayUrl);
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            setPreviewBlobUrl(blobUrl);
          } catch {
            setPreviewUrl(displayUrl);
          }
        }
        return;
      }

      const { data, error } = await supabase.storage
        .from('family-documents')
        .createSignedUrl(doc.file_path, 3600);
      if (error) throw error;
      setPreviewUrl(data?.signedUrl || null);
    } catch (error) {
      console.error('Error getting preview:', error);
      setPreviewDoc(null);
      setPreviewUrl(null);
      setPreviewBlobUrl(null);
      toast({ title: t("error"), description: t("cannotDisplayDocument"), variant: "destructive" });
    }
  };

  const handleDownload = async (doc: FamilyDocument) => {
    try {
      if (doc.file_path.startsWith('data:')) {
        const src = getDocumentDisplayUrl(doc.file_path);
        const res = await fetch(src);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }
      const { data, error } = await supabase.storage.from('family-documents').download(doc.file_path);
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
      toast({ title: t("error"), description: t("cannotDownloadDocument"), variant: "destructive" });
    }
  };

  const getFileIcon = (type: string) => {
    if (!type) return <FileIcon className="w-5 h-5" />;
    const t = type.toLowerCase();
    if (t.startsWith('image/')) return <FileImage className="w-5 h-5" />;
    if (t.includes('spreadsheet') || t.includes('excel') || t.includes('sheet')) return <FileSpreadsheet className="w-5 h-5" />;
    if (t.includes('pdf')) return <FileText className="w-5 h-5" />;
    if (t.startsWith('audio/') || t.includes('audio')) return <FileIcon className="w-5 h-5" />;
    return <FileIcon className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const canPreviewInBrowser = (type: string) => {
    if (!type) return false;
    const t = type.toLowerCase();
    return t.startsWith('image/') || t === 'application/pdf';
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
                accept="*/*"
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
      <Dialog
        open={!!previewUrl || !!previewBlobUrl}
        onOpenChange={(open) => {
          if (!open) {
            if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
            setPreviewUrl(null);
            setPreviewBlobUrl(null);
            setPreviewDoc(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{previewName}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto min-h-0 flex items-center justify-center">
            {previewUrl && (previewType || "").toLowerCase().startsWith("image/") ? (
              <img
                src={getDocumentDisplayUrl(previewUrl)}
                alt={previewName}
                className="max-w-full h-auto mx-auto object-contain"
                crossOrigin={(previewUrl || "").startsWith("http") ? "anonymous" : undefined}
                onError={() => toast({ title: t("error"), description: t("cannotDisplayDocument"), variant: "destructive" })}
              />
            ) : (previewBlobUrl || previewUrl) && (previewType || "").toLowerCase() === "application/pdf" ? (
              <iframe
                src={previewBlobUrl || getDocumentDisplayUrl(previewUrl || "")}
                className="w-full min-h-[70vh] border-0 rounded flex-1"
                title={previewName}
              />
            ) : previewUrl || previewBlobUrl ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <p className="text-sm text-muted-foreground text-center px-4">
                  {t("previewNotAvailableForFileType") || "Aperçu non disponible pour ce type de fichier."}
                </p>
                {previewDoc && (
                  <Button
                    onClick={() => handleDownload(previewDoc)}
                    variant="outline"
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {t("download")}
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};