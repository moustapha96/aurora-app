import React from "react";
import { Badge } from "@/components/ui/badge";
import { User, Briefcase } from "lucide-react";
import { CloseFamilyEditor } from "./editors";

interface CloseFamilyMember {
  id?: string;
  relation_type: string;
  member_name: string;
  birth_year?: string;
  occupation?: string;
  description?: string;
  image_url?: string;
}

interface FamilyCloseMembersProps {
  members: CloseFamilyMember[];
  isEditable?: boolean;
  onUpdate?: () => void;
}

export const FamilyCloseMembers = ({ members, isEditable = false, onUpdate }: FamilyCloseMembersProps) => {
  return (
    <div className="space-y-6">
      {isEditable && onUpdate && (
        <CloseFamilyEditor members={members} onUpdate={onUpdate} />
      )}

      {(!members || members.length === 0) ? (
        <p className="text-muted-foreground text-sm italic">
          Aucun membre de la famille proche renseigné.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member, idx) => (
            <div 
              key={idx}
              className="relative overflow-hidden rounded-lg border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent"
            >
              <div className="aspect-[4/5] relative">
                {member.image_url ? (
                  <div className="absolute inset-0">
                    <img 
                      src={member.image_url} 
                      alt={member.member_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gold/5">
                    <User className="w-16 h-16 text-gold/20" />
                  </div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <Badge 
                    variant="outline" 
                    className="mb-2 border-gold/40 text-gold bg-background/80 backdrop-blur-sm"
                  >
                    {member.relation_type}
                  </Badge>
                  <h4 className="font-semibold text-foreground text-lg">{member.member_name}</h4>
                  {member.occupation && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Briefcase className="w-3 h-3" />
                      {member.occupation}
                    </p>
                  )}
                  {member.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {member.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
