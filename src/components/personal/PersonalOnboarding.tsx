import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Sparkles, Crown, Pencil } from "lucide-react";

interface PersonalOnboardingProps {
  onSelectMode: (mode: string) => void;
}

export const PersonalOnboarding = ({ onSelectMode }: PersonalOnboardingProps) => {
  const modes = [
    {
      id: "import",
      icon: Upload,
      title: "Import",
      description: "Importez vos données depuis un fichier ou une autre source"
    },
    {
      id: "ai",
      icon: Sparkles,
      title: "IA Aurora",
      description: "Laissez notre IA vous guider avec des suggestions personnalisées"
    },
    {
      id: "concierge",
      icon: Crown,
      title: "Concierge Privé",
      description: "Un conseiller dédié complète votre profil pour vous"
    },
    {
      id: "manual",
      icon: Pencil,
      title: "Saisie Manuelle",
      description: "Remplissez vous-même chaque section à votre rythme"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-serif text-primary mb-1">
          Bienvenue dans votre Univers Personnel
        </h2>
        <p className="text-sm text-muted-foreground">
          Choisissez comment configurer votre section passions
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <Card
              key={mode.id}
              className="cursor-pointer transition-all hover:border-gold hover:shadow-md border-muted/30"
              onClick={() => onSelectMode(mode.id)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="p-2 rounded-full bg-gold/10">
                  <Icon className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{mode.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{mode.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
