import React from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar } from "lucide-react";
import { LineageEditor } from "./editors";

interface LineageEntry {
  id?: string;
  generation: string;
  member_name: string;
  title?: string;
  origin_location?: string;
  birth_year?: string;
  description?: string;
  image_url?: string;
}

interface FamilyLineageProps {
  entries: LineageEntry[];
  isEditable?: boolean;
  onUpdate?: () => void;
}

export const FamilyLineage = ({ entries, isEditable = false, onUpdate }: FamilyLineageProps) => {
  // Group by generation
  const groupedByGeneration = entries.reduce((acc, entry) => {
    const gen = entry.generation || "Autre";
    if (!acc[gen]) acc[gen] = [];
    acc[gen].push(entry);
    return acc;
  }, {} as Record<string, LineageEntry[]>);

  return (
    <div className="space-y-6">
      {isEditable && onUpdate && (
        <LineageEditor entries={entries} onUpdate={onUpdate} />
      )}

      {(!entries || entries.length === 0) ? (
        <p className="text-muted-foreground text-sm italic">
          Aucune lignée renseignée. Ajoutez vos origines familiales.
        </p>
      ) : (
        Object.entries(groupedByGeneration).map(([generation, members]) => (
          <div key={generation} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gold/20" />
              <Badge variant="outline" className="border-gold/30 text-gold text-xs">
                {generation}
              </Badge>
              <div className="h-px flex-1 bg-gold/20" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {members.map((member, idx) => (
                <div 
                  key={idx} 
                  className="p-3 bg-gold/5 rounded-lg border border-gold/10 flex gap-3"
                >
                  {member.image_url && (
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-gold/20">
                      <img 
                        src={member.image_url} 
                        alt={member.member_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{member.member_name}</p>
                    {member.title && (
                      <p className="text-sm text-gold/80">{member.title}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {member.origin_location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {member.origin_location}
                        </span>
                      )}
                      {member.birth_year && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {member.birth_year}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
