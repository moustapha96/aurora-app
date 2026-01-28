import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Crown, ArrowRight } from "lucide-react";
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

interface LandingLuxuryProps {
  member: MemberData;
  onContact?: () => void;
  showContactButton?: boolean;
  hideHeader?: boolean;
}

export const LandingLuxury = ({ member, onContact, showContactButton = true, hideHeader = false }: LandingLuxuryProps) => {
  const initials = `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(212,175,55,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {!hideHeader && (
          <header className="p-6 flex items-center justify-between">
            <AuroraLogo size="sm" />
            <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
              <Crown className="h-3 w-3" />
              Elite Member
            </Badge>
          </header>
        )}

        {/* Main content */}
        <main className={`flex-1 flex items-center justify-center px-6 ${hideHeader ? "pt-14" : ""}`}>
          <div className="text-center max-w-3xl">
            {/* Avatar with glow */}
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-amber-400 to-primary rounded-full blur-xl opacity-50 animate-pulse" />
              <Avatar className="w-40 h-40 relative ring-2 ring-primary/50">
                <AvatarImage src={member.avatar_url} />
                <AvatarFallback className="text-4xl bg-gradient-to-br from-primary/20 to-amber-500/20 text-primary font-serif">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Name with gradient */}
            <h1 className="text-5xl md:text-7xl font-serif mb-4">
              <span className="bg-gradient-to-r from-primary via-amber-200 to-primary bg-clip-text text-transparent">
                {member.first_name}
              </span>
              <br />
              <span className="text-white/90">{member.last_name}</span>
            </h1>

            {/* Subtitle */}
            <div className="flex items-center justify-center gap-4 mb-8 text-white/60">
              {member.job_function && <span>{member.job_function}</span>}
              {member.job_function && member.country && <span>•</span>}
              {member.country && <span>{member.country}</span>}
            </div>

            {/* Quote */}
            {member.personal_quote && (
              <p className="text-xl text-white/70 italic mb-12 max-w-xl mx-auto font-light">
                "{member.personal_quote}"
              </p>
            )}

            {/* CTA */}
            {showContactButton && onContact && (
              <Button 
                onClick={onContact}
                className="group bg-gradient-to-r from-primary to-amber-500 text-black font-medium px-8 py-6 text-lg rounded-full hover:opacity-90 transition-all"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Demander une introduction
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center">
          <p className="text-white/30 text-sm tracking-widest uppercase">
            Aurora Society • Réseau d'Excellence
          </p>
        </footer>
      </div>
    </div>
  );
};
