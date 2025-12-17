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
type OnboardingStep = "choose" | "import" | "ai-questions" | "ai-generating" | "concierge" | "preview";

export const BusinessOnboarding: React.FC<BusinessOnboardingProps> = ({ onComplete, profileData }) => {
  const { toast } = useToast();
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
      title: "Importer mes informations",
      description: "CV, LinkedIn, bio, site…",
    },
    {
      id: "ai" as OnboardingMode,
      icon: Sparkles,
      title: "Laisser Aurora (IA) faire une première version",
      description: "Répondez à 3 questions, nous faisons le reste.",
    },
    {
      id: "concierge" as OnboardingMode,
      icon: Phone,
      title: "Demander à mon contact personnel de s'en charger",
      description: "Conciergerie privée Aurora.",
    },
    {
      id: "manual" as OnboardingMode,
      icon: Edit3,
      title: "Compléter moi-même, module par module",
      description: "Pour les profils qui aiment le détail.",
    },
  ];

  const handleModeSelect = (mode: OnboardingMode) => {
    setSelectedMode(mode);
  };

  const handleContinue = () => {
    if (selectedMode === "import") {
      setCurrentStep("import");
    } else if (selectedMode === "ai") {
      setCurrentStep("ai-questions");
    } else if (selectedMode === "concierge") {
      setCurrentStep("concierge");
    } else if (selectedMode === "manual") {
      onComplete("manual");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Format non supporté",
          description: "Veuillez uploader un fichier PDF, Word ou texte.",
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
        title: "Information requise",
        description: "Veuillez uploader un CV ou entrer une URL LinkedIn.",
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
          title: "Import réussi",
          description: "Vos informations ont été analysées.",
        });
      } else {
        throw new Error(data.error || "Erreur lors de l'import");
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: "Erreur d'import",
        description: error.message || "Impossible d'analyser vos informations. Réessayez.",
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
        title: "Erreur",
        description: "Impossible de générer le profil. Réessayez.",
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
      title: "Demande envoyée",
      description: "Votre section Business sera préparée par notre équipe. Vous serez notifié.",
    });
    onComplete("concierge", { pending: true, message: conciergeMessage });
  };

  // Step: Choose Mode
  if (currentStep === "choose") {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-serif text-gold mb-4">Bienvenue dans votre univers Business</h2>
          <p className="text-gold/70 max-w-xl mx-auto">
            Nous allons créer, avec vous, la version la plus élégante et fidèle de votre parcours.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modes.map((mode) => (
            <Card
              key={mode.id}
              className={`cursor-pointer transition-all hover:border-gold/50 ${
                selectedMode === mode.id
                  ? "border-gold bg-gold/10"
                  : "border-gold/20 bg-black/50"
              }`}
              onClick={() => handleModeSelect(mode.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${selectedMode === mode.id ? "bg-gold/20" : "bg-gold/10"}`}>
                    <mode.icon className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gold mb-1">{mode.title}</h3>
                    <p className="text-sm text-gold/60">{mode.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedMode}
            className="bg-gold text-black hover:bg-gold/90 px-8"
          >
            Continuer
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Step: AI Questions
  if (currentStep === "ai-questions") {
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-serif text-gold mb-4">3 questions intelligentes</h2>
          <p className="text-gold/70">Répondez rapidement, Aurora fait le reste.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-gold">1. En une phrase, comment décririez-vous votre rôle aujourd'hui ?</Label>
            <Input
              value={q1}
              onChange={(e) => setQ1(e.target.value)}
              placeholder="Ex: CEO d'un groupe industriel familial..."
              className="bg-black/50 border-gold/30 text-gold placeholder:text-gold/30"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gold">2. Quelles sont, selon vous, vos 3 réalisations majeures ?</Label>
            <Textarea
              value={q2}
              onChange={(e) => setQ2(e.target.value)}
              placeholder="Ex: Création de 3000 emplois, acquisition de X, introduction en bourse..."
              className="bg-black/50 border-gold/30 text-gold placeholder:text-gold/30 min-h-[100px]"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-gold">3. Préférez-vous un ton :</Label>
            <RadioGroup value={tone} onValueChange={setTone} className="flex gap-4">
              {["discret", "institutionnel", "inspirant"].map((t) => (
                <div key={t} className="flex items-center space-x-2">
                  <RadioGroupItem value={t} id={t} className="border-gold text-gold" />
                  <Label htmlFor={t} className="text-gold/80 capitalize cursor-pointer">
                    {t}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep("choose")}
            className="border-gold/30 text-gold hover:bg-gold/10"
          >
            Retour
          </Button>
          <Button
            onClick={handleAIGenerate}
            disabled={!q1 || !q2}
            className="bg-gold text-black hover:bg-gold/90"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Générer mon profil
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
        <p className="text-gold/70">Nous analysons vos informations et créons votre profil...</p>
      </div>
    );
  }

  // Step: Preview
  if (currentStep === "preview" && generatedData) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-serif text-gold mb-4">Prévisualisation de votre section Business</h2>
          <p className="text-gold/70">Vérifiez et validez votre profil généré.</p>
        </div>

        <div className="space-y-6 bg-black/50 border border-gold/20 rounded-lg p-6">
          {generatedData.bio_executive && (
            <div>
              <h4 className="text-lg font-serif text-gold mb-2">Bio Exécutive</h4>
              <p className="text-gold/70">{generatedData.bio_executive}</p>
            </div>
          )}
          {generatedData.achievements_text && (
            <div>
              <h4 className="text-lg font-serif text-gold mb-2">Réalisations</h4>
              <p className="text-gold/70 whitespace-pre-line">{generatedData.achievements_text}</p>
            </div>
          )}
          {generatedData.vision_text && (
            <div>
              <h4 className="text-lg font-serif text-gold mb-2">Vision</h4>
              <p className="text-gold/70">{generatedData.vision_text}</p>
            </div>
          )}
          {generatedData.timeline && generatedData.timeline.length > 0 && (
            <div>
              <h4 className="text-lg font-serif text-gold mb-2">Parcours</h4>
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
              <h4 className="text-lg font-serif text-gold mb-2">Presse & Distinctions</h4>
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
            onClick={() => setCurrentStep(selectedMode === "import" ? "import" : "ai-questions")}
            className="border-gold/30 text-gold hover:bg-gold/10"
          >
            Revoir et modifier
          </Button>
          <Button onClick={handleValidate} className="bg-gold text-black hover:bg-gold/90">
            Tout valider
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
          <h2 className="text-2xl font-serif text-gold mb-4">Conciergerie Business</h2>
          <p className="text-gold/70">
            Nous pouvons prendre cela en charge pour vous. Envoyez vos documents ou dites-nous où trouver vos infos publiques.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gold">Indiquez vos sources : LinkedIn, site, documents…</Label>
            <Textarea
              value={conciergeMessage}
              onChange={(e) => setConciergeMessage(e.target.value)}
              placeholder="Ex: Mon LinkedIn est linkedin.com/in/... Mon site est..."
              className="bg-black/50 border-gold/30 text-gold placeholder:text-gold/30 min-h-[120px]"
            />
          </div>

          <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/10">
            <Upload className="w-4 h-4 mr-2" />
            Ajouter pièces jointes (CV, PDF...)
          </Button>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep("choose")}
            className="border-gold/30 text-gold hover:bg-gold/10"
          >
            Retour
          </Button>
          <Button
            onClick={handleConciergeSubmit}
            disabled={!conciergeMessage}
            className="bg-gold text-black hover:bg-gold/90"
          >
            <Phone className="w-4 h-4 mr-2" />
            Confier à ma conciergerie Aurora
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
          <h2 className="text-2xl font-serif text-gold mb-4">Import intelligent</h2>
          <p className="text-gold/70">Uploadez votre CV ou entrez votre URL LinkedIn pour pré-remplir votre section Business.</p>
        </div>

        <div className="space-y-6">
          {/* File Upload Zone */}
          <div className="space-y-2">
            <Label className="text-gold">Uploader votre CV</Label>
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
                <p className="text-gold/70">Cliquez pour uploader votre CV</p>
                <p className="text-gold/40 text-sm mt-1">PDF, Word ou texte (max 5MB)</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gold/20" />
            <span className="text-gold/50 text-sm">ou</span>
            <div className="flex-1 h-px bg-gold/20" />
          </div>

          {/* LinkedIn URL */}
          <div className="space-y-2">
            <Label className="text-gold">URL de votre profil LinkedIn</Label>
            <Input
              value={importSources}
              onChange={(e) => setImportSources(e.target.value)}
              placeholder="https://linkedin.com/in/..."
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
            Retour
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
            Analyser et importer
          </Button>
        </div>
      </div>
    );
  }

  return null;
};
