import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileDown, Sparkles, Crown, PenLine, ArrowLeft, Linkedin, FileText, Loader2, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface NetworkOnboardingProps {
  onSelect: (mode: string, importedData?: any) => void;
}

export const NetworkOnboarding = ({ onSelect }: NetworkOnboardingProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [showImportStep, setShowImportStep] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modes = [
    {
      id: "import",
      icon: FileDown,
      title: t("importData"),
      description: t("importDataDesc")
    },
    {
      id: "ai",
      icon: Sparkles,
      title: t("aiAurora"),
      description: t("aiAuroraDesc")
    },
    {
      id: "concierge",
      icon: Crown,
      title: t("privateConcierge"),
      description: t("privateConciergeDesc")
    },
    {
      id: "manual",
      icon: PenLine,
      title: t("manualEntry"),
      description: t("manualEntryDesc")
    }
  ];

  const handleSelect = (modeId: string) => {
    setSelectedMode(modeId);
  };

  const handleConfirm = () => {
    if (selectedMode === "import") {
      setShowImportStep(true);
    } else if (selectedMode) {
      onSelect(selectedMode);
    }
  };

  const handleLinkedInImport = async () => {
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      toast.info(t("linkedInImportComing"));
      onSelect("manual");
    }, 1500);
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Simple text extraction from PDF - look for text streams
          let text = '';
          const decoder = new TextDecoder('utf-8', { fatal: false });
          const content = decoder.decode(uint8Array);
          
          // Extract text between parentheses (PDF text objects)
          const textMatches = content.match(/\(([^)]+)\)/g);
          if (textMatches) {
            text = textMatches
              .map(match => match.slice(1, -1))
              .filter(t => t.length > 2 && !/^[\d\s.]+$/.test(t))
              .join(' ');
          }
          
          // Also try to extract text from streams
          const streamMatches = content.match(/BT[\s\S]*?ET/g);
          if (streamMatches) {
            for (const stream of streamMatches) {
              const tjMatches = stream.match(/\(([^)]+)\)\s*Tj/g);
              if (tjMatches) {
                text += ' ' + tjMatches.map(m => m.replace(/\)\s*Tj$/, '').slice(1)).join(' ');
              }
            }
          }

          // Clean up the text
          text = text
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '')
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\s+/g, ' ')
            .trim();

          if (text.length < 50) {
            // If we couldn't extract much text, send the raw content
            // The AI can still try to make sense of it
            resolve(content.substring(0, 50000));
          } else {
            resolve(text);
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const extractTextFromDocx = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          const decoder = new TextDecoder('utf-8', { fatal: false });
          const content = decoder.decode(uint8Array);
          
          // Extract text from XML content in DOCX
          const textMatches = content.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
          if (textMatches) {
            const text = textMatches
              .map(match => match.replace(/<[^>]+>/g, ''))
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();
            resolve(text);
          } else {
            // Fallback: just extract any readable text
            const cleanContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            resolve(cleanContent.substring(0, 50000));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleCVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      toast.error(t("unsupportedFormat"));
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("fileTooLargeMax10MB"));
      return;
    }

    setIsImporting(true);
    setImportStatus(t("readingFile"));

    try {
      // Extract text from the file
      let cvText = '';
      
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setImportStatus(t("extractingPDFText"));
        cvText = await extractTextFromPDF(file);
      } else {
        setImportStatus(t("extractingWordText"));
        cvText = await extractTextFromDocx(file);
      }

      if (!cvText || cvText.length < 20) {
        toast.error(t("cannotExtractTextFromFile"));
        setIsImporting(false);
        return;
      }

      setImportStatus(t("aiAnalysisInProgress"));

      // Call the edge function to analyze the CV
      const { data, error } = await supabase.functions.invoke('parse-cv-network', {
        body: { cvText: cvText.substring(0, 30000) } // Limit text length
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || t("errorDuringAnalysis"));
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setImportStatus(t("importingData"));

      const extractedData = data?.data;
      
      // Count extracted items
      const totalItems = 
        (extractedData?.media?.length || 0) +
        (extractedData?.events?.length || 0) +
        (extractedData?.influence?.length || 0) +
        (extractedData?.philanthropy?.length || 0) +
        (extractedData?.clubs?.length || 0) +
        (extractedData?.ambitions?.length || 0);

      if (totalItems > 0) {
        toast.success(`${totalItems} ${t("itemsExtractedFromCV")}`);
        onSelect("import", extractedData);
      } else {
        toast.info(t("noNetworkInfoDetectedInCV"));
        onSelect("manual");
      }
    } catch (error: any) {
      console.error("CV upload error:", error);
      toast.error(error.message || t("errorAnalyzingCV"));
      onSelect("manual");
    } finally {
      setIsImporting(false);
      setImportStatus("");
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSkipImport = () => {
    onSelect("manual");
  };

  // Import step UI
  if (showImportStep) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowImportStep(false)}
            className="gap-2"
            disabled={isImporting}
          >
            <ArrowLeft className="w-4 h-4" />
            {t("back")}
          </Button>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif text-primary mb-4">
            {t("importYourData")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("chooseImportMethodToAccelerate")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* LinkedIn Import */}
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-lg ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={handleLinkedInImport}
          >
            <CardContent className="p-8 text-center">
              {isImporting ? (
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
              ) : (
                <div className="w-16 h-16 mx-auto mb-4 bg-[#0077B5] rounded-full flex items-center justify-center">
                  <Linkedin className="w-8 h-8 text-white" />
                </div>
              )}
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t("importFromLinkedIn")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("connectLinkedInToImportNetwork")}
              </p>
            </CardContent>
          </Card>

          {/* CV Upload */}
          <Card className={`cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-lg relative ${isImporting ? 'ring-2 ring-primary' : ''}`}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleCVUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={isImporting}
            />
            <CardContent className="p-8 text-center">
              {isImporting ? (
                <div className="space-y-4">
                  <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                  <p className="text-sm text-primary font-medium">{importStatus}</p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {t("uploadCV")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("uploadCVToExtractNetworkInfo")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("acceptedFormatsPDFDOCDOCX")}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleSkipImport}
            disabled={isImporting}
          >
            {t("skipThisStep")}
          </Button>
        </div>
      </div>
    );
  }

  // Mode selection UI
  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/profile')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
      </div>
      
      <div className="text-center mb-12">
        <h2 className="text-3xl font-serif text-primary mb-4">
          {t("configureNetwork")}
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {t("configureNetworkDesc")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {modes.map((mode) => (
          <Card
            key={mode.id}
            className={`cursor-pointer transition-all duration-300 hover:border-primary/50 ${
              selectedMode === mode.id
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border"
            }`}
            onClick={() => handleSelect(mode.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${
                  selectedMode === mode.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary"
                }`}>
                  <mode.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {mode.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {mode.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleConfirm}
          disabled={!selectedMode}
          className="px-8"
          size="lg"
        >
          {t("continue")}
        </Button>
      </div>
    </div>
  );
};
