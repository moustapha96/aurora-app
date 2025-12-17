import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, Mail } from "lucide-react";
import { AuroraLogo } from "@/components/AuroraLogo";

interface MemberData {
  first_name: string;
  last_name: string;
  avatar_url?: string;
  country?: string;
  activity_domain?: string;
  job_function?: string;
  personal_quote?: string;
  wealth_billions?: string;
}

interface LandingClassicProps {
  member: MemberData;
  onContact?: () => void;
  showContactButton?: boolean;
}

export const LandingClassic = ({ member, onContact, showContactButton = true }: LandingClassicProps) => {
  const initials = `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`;
  
  const getWealthBadge = () => {
    const wealth = parseFloat(member.wealth_billions || '0');
    if (wealth >= 100) return { label: "Diamond", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" };
    if (wealth >= 30) return { label: "Platinum", color: "bg-slate-300/20 text-slate-200 border-slate-400/30" };
    if (wealth >= 10) return { label: "Gold", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
    return null;
  };

  const badge = getWealthBadge();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <AuroraLogo size="sm" />
          <Badge variant="outline" className="text-xs">Membre Aurora Society</Badge>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <Avatar className="w-32 h-32 mx-auto mb-6 ring-4 ring-primary/20">
              <AvatarImage src={member.avatar_url} />
              <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-4">
              {member.first_name} {member.last_name}
            </h1>
            
            {badge && (
              <Badge className={`${badge.color} mb-4`}>
                {badge.label} Circle
              </Badge>
            )}
            
            {member.personal_quote && (
              <p className="text-lg text-muted-foreground italic max-w-2xl mx-auto">
                "{member.personal_quote}"
              </p>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {member.country && (
              <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Localisation</p>
                    <p className="text-lg font-medium text-foreground">{member.country}</p>
                  </div>
                </div>
              </Card>
            )}
            
            {member.activity_domain && (
              <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Secteur d'activité</p>
                    <p className="text-lg font-medium text-foreground">{member.activity_domain}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* CTA */}
          {showContactButton && onContact && (
            <div className="text-center">
              <Button 
                variant="premium" 
                size="lg" 
                onClick={onContact}
                className="gap-2"
              >
                <Mail className="h-5 w-5" />
                Entrer en contact
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            Membre exclusif d'Aurora Society
          </p>
        </div>
      </footer>
    </div>
  );
};
