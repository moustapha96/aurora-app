import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Sparkles, Phone, PenLine, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface FamilyOnboardingProps {
  onSelectMode: (mode: string) => void;
}

export const FamilyOnboarding = ({ onSelectMode }: FamilyOnboardingProps) => {
  const { t } = useLanguage();
  const modes = [
    {
      id: "import",
      title: t("familyImportDocument"),
      description: t("familyImportDocumentDesc"),
      icon: FileText,
      color: "text-blue-400"
    },
    {
      id: "ai",
      title: t("aiSuggestions"),
      description: t("familyAISuggestionsDesc"),
      icon: Sparkles,
      color: "text-gold"
    },
    {
      id: "concierge",
      title: t("privateConcierge"),
      description: t("familyConciergeDesc"),
      icon: Phone,
      color: "text-emerald-400"
    },
    {
      id: "manual",
      title: t("manualEntry"),
      description: t("familyManualEntryDesc"),
      icon: PenLine,
      color: "text-purple-400"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-serif text-gold mb-4">
          {t("configureFamily")}
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {t("configureFamilyDesc")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <Card 
              key={mode.id}
              className="border-gold/20 hover:border-gold/40 transition-all cursor-pointer group bg-card/50 backdrop-blur-sm"
              onClick={() => onSelectMode(mode.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg bg-gold/10 ${mode.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gold/40 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-xl mt-4">{mode.title}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {mode.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full border-gold/30 text-gold hover:bg-gold/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMode(mode.id);
                  }}
                >
                  {t("select")}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
