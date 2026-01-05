import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Sparkles, Phone, Edit3, ArrowRight, Loader2, FileText, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface BusinessOnboardingProps {
  onComplete: (mode: string, data?: any) => void;
  profileData?: {
    first_name: string;
    last_name: string;
    job_function?: string;
    activity_domain?: string;
  };
}

type OnboardingMode = "import" | "ai" | "concierge" | "manual" | null;
type OnboardingStep = "choose" | "import" | "ai-questions" | "ai-generating" | "concierge" | "preview" | "edit";

export const BusinessOnboarding: React.FC<BusinessOnboardingProps> = ({ onComplete, profileData }) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [selectedMode, setSelectedMode] = useState<OnboardingMode>(null);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("choose");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);

  // AI Questions
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [tone, setTone] = useState("institutionnel");

  // Import
  const [importSources, setImportSources] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Concierge
  const [conciergeMessage, setConciergeMessage] = useState("");

  const modes = [
    {
      id: "import" as OnboardingMode,
      icon: Upload,
      title: t('businessImportInfo'),
      description: t('businessImportDescription'),
    },
    {
      id: "ai" as OnboardingMode,
      icon: Sparkles,
      title: t('businessAIGenerate'),
      description: t('businessAIDescription'),
    },
    {
      id: "concierge" as OnboardingMode,
      icon: Phone,
      title: t('businessConciergeRequest'),
      description: t('businessConciergeDescription'),
    },
    {
      id: "manual" as OnboardingMode,
      icon: Edit3,
      title: t('businessManualComplete'),
      description: t('businessManualDescription'),
    },
  ];

  const handleModeSelect = (mode: OnboardingMode) => {
    setSelectedMode(mode);
    // Navigation directe au clic sur le pavé
    if (mode === "import") {
      setCurrentStep("import");
    } else if (mode === "ai") {
      setCurrentStep("ai-questions");
    } else if (mode === "concierge") {
      setCurrentStep("concierge");
    } else if (mode === "manual") {
      onComplete("manual");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: t('businessUnsupportedFormat'),
          description: t('businessUploadPDFWordText'),
          variant: "destructive",
        });
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleImport = async () => {
    if (!uploadedFile && !importSources.trim()) {
      toast({
        title: t('businessInformationRequired'),
        description: t('businessUploadCVOrLinkedIn'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setCurrentStep("ai-generating");

    try {
      let cvText = "";

      // If file uploaded, read its content
      if (uploadedFile) {
        if (uploadedFile.type === 'text/plain') {
          cvText = await uploadedFile.text();
        } else {
          // For PDF/DOCX, we'll send basic file info + any URL
          cvText = `Document uploadé: ${uploadedFile.name}\n`;
          // Read as base64 and include partial content
          const arrayBuffer = await uploadedFile.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          let text = '';
          for (let i = 0; i < Math.min(bytes.length, 10000); i++) {
            const char = bytes[i];
            if (char >= 32 && char <= 126) {
              text += String.fromCharCode(char);
            } else if (char === 10 || char === 13) {
              text += '\n';
            }
          }
          cvText += text;
        }
      }

      // Add LinkedIn URL if provided
      if (importSources.trim()) {
        cvText += `\nURL LinkedIn/Site: ${importSources}`;
      }

      console.log("Calling parse-cv-business with content length:", cvText.length);

      const { data, error } = await supabase.functions.invoke("parse-cv-business", {
        body: {
          cvText,
          linkedinUrl: importSources.trim() || undefined,
        },
      });

      if (error) throw error;

      if (data.success && data.data) {
        setGeneratedData(data.data);
        setCurrentStep("preview");
        toast({
          title: t('businessImportSuccess'),
          description: t('businessInformationAnalyzed'),
        });
      } else {
        throw new Error(data.error || t('businessImportError'));
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: t('businessImportErrorTitle'),
        description: error.message || t('businessCannotAnalyzeInfo'),
        variant: "destructive",
      });
      setCurrentStep("import");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIGenerate = async () => {
    setIsLoading(true);
    setCurrentStep("ai-generating");

    try {
      const { data, error } = await supabase.functions.invoke("business-ai-suggest", {
        body: {
          type: "full_profile",
          context: {
            q1,
            q2,
            tone,
            name: profileData ? `${profileData.first_name} ${profileData.last_name}` : "",
            domain: profileData?.activity_domain,
          },
        },
      });

      if (error) throw error;

      let parsed;
      try {
        const jsonMatch = data.suggestion.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { bio_executive: data.suggestion };
      } catch {
        parsed = { bio_executive: data.suggestion };
      }

      setGeneratedData(parsed);
      setCurrentStep("preview");
    } catch (error) {
      console.error("AI generation error:", error);
      toast({
        title: t('error'),
        description: t('businessCannotGenerateProfile'),
        variant: "destructive",
      });
      setCurrentStep("ai-questions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidate = () => {
    onComplete(selectedMode || "manual", generatedData);
  };

  const handleConciergeSubmit = async () => {
    toast({
      title: t('businessRequestSent'),
      description: t('businessConciergePreparing'),
    });
    onComplete("concierge", { pending: true, message: conciergeMessage });
  };

  // Step: Choose Mode
  if (currentStep === "choose") {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-serif text-gold mb-4">{t('businessWelcomeToBusinessUniverse')}</h2>
          <p className="text-gold/70 max-w-xl mx-auto">
            {t('businessCreateElegantVersion')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modes.map((mode) => (
            <Card
              key={mode.id}
              className="cursor-pointer transition-all hover:border-gold/50 hover:bg-gold/10 border-gold/20 bg-black/50 group"
              onClick={() => handleModeSelect(mode.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-gold/10 group-hover:bg-gold/20 transition-colors">
                    <mode.icon className="w-6 h-6 text-gold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gold mb-1">{mode.title}</h3>
                    <p className="text-sm text-gold/60">{mode.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gold/40 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Step: AI Questions
  if (currentStep === "ai-questions") {
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-serif text-gold mb-4">{t('business3SmartQuestions')}</h2>
          <p className="text-gold/70">{t('businessAnswerQuicklyAuroraDoesRest')}</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-gold">{t('businessQuestion1')}</Label>
            <Input
              value={q1}
              onChange={(e) => setQ1(e.target.value)}
              placeholder={t('businessQuestion1Placeholder')}
              className="bg-black/50 border-gold/30 text-gold placeholder:text-gold/30"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gold">{t('businessQuestion2')}</Label>
            <Textarea
              value={q2}
              onChange={(e) => setQ2(e.target.value)}
              placeholder={t('businessQuestion2Placeholder')}
              className="bg-black/50 border-gold/30 text-gold placeholder:text-gold/30 min-h-[100px]"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-gold">{t('businessQuestion3')}</Label>
            <RadioGroup value={tone} onValueChange={setTone} className="flex gap-4">
              {[t('businessToneDiscrete'), t('businessToneInstitutional'), t('businessToneInspiring')].map((toneLabel, index) => {
                const toneValue = ["discret", "institutionnel", "inspirant"][index];
                return (
                  <div key={toneValue} className="flex items-center space-x-2">
                    <RadioGroupItem value={toneValue} id={toneValue} className="border-gold text-gold" />
                    <Label htmlFor={toneValue} className="text-gold/80 capitalize cursor-pointer">
                      {toneLabel}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep("choose")}
            className="border-gold/30 text-gold hover:bg-gold/10"
          >
            {t('back')}
          </Button>
          <Button
            onClick={handleAIGenerate}
            disabled={!q1 || !q2}
            className="bg-gold text-black hover:bg-gold/90"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {t('businessGenerateMyProfile')}
          </Button>
        </div>
      </div>
    );
  }

  // Step: AI Generating
  if (currentStep === "ai-generating") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-gold animate-spin mb-6" />
        <p className="text-gold/70">{t('businessAnalyzingAndCreatingProfile')}</p>
      </div>
    );
  }

  // Step: Preview
  if (currentStep === "preview" && generatedData) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-serif text-gold mb-4">{t('businessPreviewYourBusinessSection')}</h2>
          <p className="text-gold/70">{t('businessReviewAndValidateProfile')}</p>
        </div>

        <div className="space-y-6 bg-black/50 border border-gold/20 rounded-lg p-6">
          {generatedData.bio_executive && (
            <div>
              <h4 className="text-lg font-serif text-gold mb-2">{t('businessBioExecutive')}</h4>
              <p className="text-gold/70">{generatedData.bio_executive}</p>
            </div>
          )}
          {generatedData.achievements_text && (
            <div>
              <h4 className="text-lg font-serif text-gold mb-2">{t('businessAchievements')}</h4>
              <p className="text-gold/70 whitespace-pre-line">{generatedData.achievements_text}</p>
            </div>
          )}
          {generatedData.vision_text && (
            <div>
              <h4 className="text-lg font-serif text-gold mb-2">{t('businessVision')}</h4>
              <p className="text-gold/70">{generatedData.vision_text}</p>
            </div>
          )}
          {generatedData.timeline && generatedData.timeline.length > 0 && (
            <div>
              <h4 className="text-lg font-serif text-gold mb-2">{t('businessCareerPath')}</h4>
              <div className="space-y-2">
                {generatedData.timeline.map((item: any, index: number) => (
                  <div key={index} className="text-gold/70">
                    <span className="text-gold">{item.year}</span> - {item.title} @ {item.company}
                  </div>
                ))}
              </div>
            </div>
          )}
          {generatedData.press && generatedData.press.length > 0 && (
            <div>
              <h4 className="text-lg font-serif text-gold mb-2">{t('businessPressDistinctions')}</h4>
              <div className="space-y-2">
                {generatedData.press.map((item: any, index: number) => (
                  <div key={index} className="text-gold/70">
                    {item.title} - <span className="text-gold/50">{item.source} ({item.year})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep("edit")}
            className="border-gold/30 text-gold hover:bg-gold/10"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            {t('edit')}
          </Button>
          <Button onClick={handleValidate} className="bg-gold text-black hover:bg-gold/90">
            {t('businessValidateAll')}
          </Button>
        </div>
      </div>
    );
  }

  // Step: Edit generated data
  if (currentStep === "edit" && generatedData) {
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-serif text-gold mb-4">{t('businessEditYourInformation')}</h2>
          <p className="text-gold/70">{t('businessAdjustGeneratedContent')}</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-gold">{t('businessBioExecutive')}</Label>
            <Textarea
              value={generatedData.bio_executive || ""}
              onChange={(e) => setGeneratedData({ ...generatedData, bio_executive: e.target.value })}
              className="bg-black/50 border-gold/30 text-gold placeholder:text-gold/30 min-h-[120px]"
              placeholder={t('businessYourBioExecutive')}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gold">{t('businessAchievements')}</Label>
            <Textarea
              value={generatedData.achievements_text || ""}
              onChange={(e) => setGeneratedData({ ...generatedData, achievements_text: e.target.value })}
              className="bg-black/50 border-gold/30 text-gold placeholder:text-gold/30 min-h-[100px]"
              placeholder={t('businessYourMajorAchievements')}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gold">{t('businessVision')}</Label>
            <Textarea
              value={generatedData.vision_text || ""}
              onChange={(e) => setGeneratedData({ ...generatedData, vision_text: e.target.value })}
              className="bg-black/50 border-gold/30 text-gold placeholder:text-gold/30 min-h-[100px]"
              placeholder={t('businessYourVision')}
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep("preview")}
            className="border-gold/30 text-gold hover:bg-gold/10"
          >
            {t('businessBackToPreview')}
          </Button>
          <Button onClick={handleValidate} className="bg-gold text-black hover:bg-gold/90">
            {t('businessValidateModifications')}
          </Button>
        </div>
      </div>
    );
  }

  // Step: Concierge
  if (currentStep === "concierge") {
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-serif text-gold mb-4">{t('businessConciergeBusiness')}</h2>
          <p className="text-gold/70">
            {t('businessConciergeDescription')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gold">{t('businessIndicateYourSources')}</Label>
            <Textarea
              value={conciergeMessage}
              onChange={(e) => setConciergeMessage(e.target.value)}
              placeholder={t('businessLinkedInExample')}
              className="bg-black/50 border-gold/30 text-gold placeholder:text-gold/30 min-h-[120px]"
            />
          </div>

          <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/10">
            <Upload className="w-4 h-4 mr-2" />
            {t('businessAddAttachments')}
          </Button>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep("choose")}
            className="border-gold/30 text-gold hover:bg-gold/10"
          >
            {t('back')}
          </Button>
          <Button
            onClick={handleConciergeSubmit}
            disabled={!conciergeMessage}
            className="bg-gold text-black hover:bg-gold/90"
          >
            <Phone className="w-4 h-4 mr-2" />
            {t('businessEntrustToConcierge')}
          </Button>
        </div>
      </div>
    );
  }

  // Step: Import
  if (currentStep === "import") {
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-serif text-gold mb-4">{t('businessSmartImport')}</h2>
          <p className="text-gold/70">{t('businessUploadCVOrLinkedInDescription')}</p>
        </div>

        <div className="space-y-6">
          {/* File Upload Zone */}
          <div className="space-y-2">
            <Label className="text-gold">{t('businessUploadYourCV')}</Label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
            />
            {uploadedFile ? (
              <div className="flex items-center gap-3 p-4 bg-gold/10 border border-gold/30 rounded-lg">
                <FileText className="w-8 h-8 text-gold" />
                <div className="flex-1">
                  <p className="text-gold font-medium">{uploadedFile.name}</p>
                  <p className="text-gold/50 text-sm">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUploadedFile(null)}
                  className="text-gold/60 hover:text-gold"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gold/30 rounded-lg p-8 text-center cursor-pointer hover:border-gold/50 transition-colors"
              >
                <Upload className="w-10 h-10 text-gold/50 mx-auto mb-3" />
                <p className="text-gold/70">{t('businessClickToUploadCV')}</p>
                <p className="text-gold/40 text-sm mt-1">{t('businessPDFWordTextMax5MB')}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gold/20" />
            <span className="text-gold/50 text-sm">{t('or')}</span>
            <div className="flex-1 h-px bg-gold/20" />
          </div>

          {/* LinkedIn URL */}
          <div className="space-y-2">
            <Label className="text-gold">{t('businessLinkedInProfileURL')}</Label>
            <Input
              value={importSources}
              onChange={(e) => setImportSources(e.target.value)}
              placeholder={t('businessLinkedInPlaceholder')}
              className="bg-black/50 border-gold/30 text-gold placeholder:text-gold/30"
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep("choose")}
            className="border-gold/30 text-gold hover:bg-gold/10"
          >
            {t('back')}
          </Button>
          <Button
            onClick={handleImport}
            disabled={isLoading || (!uploadedFile && !importSources.trim())}
            className="bg-gold text-black hover:bg-gold/90"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {t('businessAnalyzeAndImport')}
          </Button>
        </div>
      </div>
    );
  }

  return null;
};
