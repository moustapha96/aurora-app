import React from "react";
import { Crown, Quote, Sparkles } from "lucide-react";
import { HeritageEditor } from "./editors";

interface HeritageData {
  id?: string;
  motto?: string;
  values_text?: string;
  legacy_vision?: string;
  heritage_description?: string;
  banner_image_url?: string;
}

interface FamilyHeritageProps {
  heritage: HeritageData | null;
  isEditable?: boolean;
  onUpdate?: () => void;
}

export const FamilyHeritage = ({ heritage, isEditable = false, onUpdate }: FamilyHeritageProps) => {
  const hasContent = heritage && (heritage.motto || heritage.values_text || heritage.legacy_vision || heritage.heritage_description);

  return (
    <div className="space-y-6">
      {isEditable && onUpdate && <HeritageEditor heritage={heritage} onUpdate={onUpdate} />}
      {!hasContent ? (
        <p className="text-muted-foreground text-sm italic">Aucun contenu d'héritage et transmission renseigné.</p>
      ) : (
        <>
          {heritage?.motto && (
            <div className="relative overflow-hidden rounded-lg border border-gold/30 bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 p-6 text-center">
              <Crown className="w-8 h-8 text-gold mx-auto mb-3" />
              <p className="text-xl font-serif text-gold italic">« {heritage.motto} »</p>
            </div>
          )}
          {heritage?.values_text && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gold flex items-center gap-2"><Sparkles className="w-4 h-4" />Valeurs transmises</h4>
              <p className="text-muted-foreground whitespace-pre-line pl-6">{heritage.values_text}</p>
            </div>
          )}
          {heritage?.legacy_vision && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gold flex items-center gap-2"><Quote className="w-4 h-4" />Vision de transmission</h4>
              <p className="text-muted-foreground whitespace-pre-line pl-6 italic">{heritage.legacy_vision}</p>
            </div>
          )}
          {heritage?.heritage_description && (
            <div className="p-4 bg-gold/5 rounded-lg border border-gold/10">
              <p className="text-muted-foreground whitespace-pre-line">{heritage.heritage_description}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};