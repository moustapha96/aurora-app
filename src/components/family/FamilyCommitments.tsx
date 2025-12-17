import React from "react";
import { Badge } from "@/components/ui/badge";
import { Heart, Calendar, Building } from "lucide-react";
import { CommitmentsEditor } from "./editors";

interface Commitment {
  id?: string;
  title: string;
  category?: string;
  description?: string;
  organization?: string;
  start_year?: string;
  image_url?: string;
}

interface FamilyCommitmentsProps {
  commitments: Commitment[];
  isEditable?: boolean;
  onUpdate?: () => void;
}

export const FamilyCommitments = ({ commitments, isEditable = false, onUpdate }: FamilyCommitmentsProps) => {
  const getCategoryColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case "philanthropie": return "bg-pink-500/20 text-pink-400 border-pink-500/30";
      case "éducation": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "environnement": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-gold/20 text-gold border-gold/30";
    }
  };

  return (
    <div className="space-y-6">
      {isEditable && onUpdate && <CommitmentsEditor commitments={commitments} onUpdate={onUpdate} />}
      {(!commitments || commitments.length === 0) ? (
        <p className="text-muted-foreground text-sm italic">Aucun engagement familial renseigné.</p>
      ) : (
        <div className="space-y-4">
          {commitments.map((commitment, idx) => (
            <div key={idx} className="flex gap-4 p-4 border border-gold/20 rounded-lg hover:border-gold/30 transition-colors">
              <div className="w-20 h-20 rounded-lg flex-shrink-0 border border-gold/20 bg-gold/5 flex items-center justify-center">
                <Heart className="w-8 h-8 text-gold/40" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="font-semibold text-foreground">{commitment.title}</h4>
                  {commitment.category && <Badge variant="outline" className={getCategoryColor(commitment.category)}>{commitment.category}</Badge>}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  {commitment.organization && <span className="flex items-center gap-1"><Building className="w-3 h-3" />{commitment.organization}</span>}
                  {commitment.start_year && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Depuis {commitment.start_year}</span>}
                </div>
                {commitment.description && <p className="text-sm text-muted-foreground">{commitment.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};