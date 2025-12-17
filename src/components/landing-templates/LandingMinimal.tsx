import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail, MapPin, Building2 } from "lucide-react";
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

interface LandingMinimalProps {
  member: MemberData;
  onContact?: () => void;
  showContactButton?: boolean;
}

export const LandingMinimal = ({ member, onContact, showContactButton = true }: LandingMinimalProps) => {
  const initials = `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 py-4">
          <AuroraLogo size="sm" />
        </div>
      </header>

      {/* Main content */}
      <main className="pt-24 pb-20 px-6">
        <div className="container mx-auto max-w-2xl">
          {/* Profile section */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
            <Avatar className="w-28 h-28 border-2 border-gray-100">
              <AvatarImage src={member.avatar_url} />
              <AvatarFallback className="text-2xl bg-gray-100 text-gray-600">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-light text-gray-900 mb-2">
                {member.first_name} {member.last_name}
              </h1>
              
              {member.job_function && (
                <p className="text-lg text-gray-500 mb-4">{member.job_function}</p>
              )}

              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-400">
                {member.country && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {member.country}
                  </span>
                )}
                {member.activity_domain && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {member.activity_domain}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Separator className="mb-12" />

          {/* Quote */}
          {member.personal_quote && (
            <blockquote className="mb-12">
              <p className="text-xl md:text-2xl text-gray-600 font-light leading-relaxed">
                "{member.personal_quote}"
              </p>
            </blockquote>
          )}

          {/* CTA */}
          {showContactButton && onContact && (
            <div className="flex justify-center md:justify-start">
              <Button 
                onClick={onContact}
                className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-6 rounded-none"
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100">
        <div className="container mx-auto px-6 text-center">
          <p className="text-xs text-gray-400 tracking-widest uppercase">
            Aurora Society Member
          </p>
        </div>
      </footer>
    </div>
  );
};
