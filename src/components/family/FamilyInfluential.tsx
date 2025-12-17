import React from "react";
import { Badge } from "@/components/ui/badge";
import { Star, Quote } from "lucide-react";
import { InfluentialEditor } from "./editors";

interface InfluentialPerson {
  id?: string;
  person_name: string;
  relationship?: string;
  context?: string;
  description?: string;
  image_url?: string;
}

interface FamilyInfluentialProps {
  people: InfluentialPerson[];
  isEditable?: boolean;
  onUpdate?: () => void;
}

export const FamilyInfluential = ({ people, isEditable = false, onUpdate }: FamilyInfluentialProps) => {
  return (
    <div className="space-y-6">
      {isEditable && onUpdate && (
        <InfluentialEditor people={people} onUpdate={onUpdate} />
      )}

      {(!people || people.length === 0) ? (
        <p className="text-muted-foreground text-sm italic">
          Aucune personne marquante renseignée.
        </p>
      ) : (
        <div className="space-y-4">
          {people.map((person, idx) => (
            <div 
              key={idx}
              className="flex gap-4 p-4 bg-gold/5 rounded-lg border border-gold/10 hover:border-gold/20 transition-colors"
            >
              {person.image_url ? (
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-gold/30">
                  <img src={person.image_url} alt={person.person_name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full flex-shrink-0 border-2 border-gold/30 bg-gold/10 flex items-center justify-center">
                  <Star className="w-6 h-6 text-gold/60" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-foreground">{person.person_name}</h4>
                  {person.relationship && (
                    <Badge variant="outline" className="border-gold/30 text-gold text-xs">{person.relationship}</Badge>
                  )}
                  {person.context && (
                    <Badge variant="secondary" className="text-xs">{person.context}</Badge>
                  )}
                </div>
                {person.description && (
                  <div className="mt-2 flex gap-2">
                    <Quote className="w-4 h-4 text-gold/40 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground italic">{person.description}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};