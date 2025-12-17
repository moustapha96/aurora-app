import React from "react";
import { Badge } from "@/components/ui/badge";
import { Building2, Award, Users } from "lucide-react";
import { BoardEditor } from "./editors";

interface BoardMember {
  id?: string;
  member_name: string;
  role: string;
  organization?: string;
  expertise?: string;
  description?: string;
  image_url?: string;
}

interface FamilyBoardProps {
  members: BoardMember[];
  isEditable?: boolean;
  onUpdate?: () => void;
}

export const FamilyBoard = ({ members, isEditable = false, onUpdate }: FamilyBoardProps) => {
  return (
    <div className="space-y-6">
      {isEditable && onUpdate && (
        <BoardEditor members={members} onUpdate={onUpdate} />
      )}

      {(!members || members.length === 0) ? (
        <p className="text-muted-foreground text-sm italic">
          Aucun membre du board personnel renseigné.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((member, idx) => (
            <div 
              key={idx}
              className="p-4 border border-gold/20 rounded-lg bg-gradient-to-br from-background to-gold/5 hover:border-gold/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                {member.image_url ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-gold/20">
                    <img src={member.image_url} alt={member.member_name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg flex-shrink-0 border border-gold/20 bg-gold/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-gold/60" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground">{member.member_name}</h4>
                  <p className="text-sm text-gold">{member.role}</p>
                </div>
              </div>
              
              <div className="mt-3 space-y-2">
                {member.organization && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    <span>{member.organization}</span>
                  </div>
                )}
                {member.expertise && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Award className="w-4 h-4" />
                    <span>{member.expertise}</span>
                  </div>
                )}
                {member.description && (
                  <p className="text-xs text-muted-foreground mt-2">{member.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};