import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Briefcase, Leaf, Gem, Globe } from "lucide-react";
import auroraLogo from "@/assets/aurora-logo.png";
import { useLanguage, languages } from "@/contexts/LanguageContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const isMobile = useIsMobile();


  return (
    <div className="min-h-screen bg-[hsl(0,0%,2%)] relative overflow-hidden">
      {/* Language Selector - Mobile only */}
      {isMobile && (
        <div className="fixed top-6 right-6 z-50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-primary/80 hover:text-primary hover:bg-primary/10 border border-primary/20 bg-[hsl(0,0%,5%)]/50 backdrop-blur-sm"
              >
                <Globe className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[hsl(0,0%,5%)] border-primary/20">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={language === lang.code ? "bg-primary/20 text-primary" : "text-foreground hover:bg-primary/10"}
                >
                  <span className="mr-2">{lang.flag}</span>
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      {/* Fine gold accent line on left */}
      <div className="fixed left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[hsl(38,80%,71%,0.2)] to-transparent z-10" />
      
      {/* Background depth layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(0,0%,2%)] via-[hsl(218,50%,6%,0.3)] to-[hsl(0,0%,2%)]" />
      {/* Blue halo at bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-t from-[hsl(218,60%,20%,0.25)] via-[hsl(218,50%,15%,0.15)] to-transparent blur-[120px] rounded-full pointer-events-none" />
      
      {/* Hero Section */}
      <div className="relative flex flex-col items-center justify-center min-h-screen px-6 py-24">
        <div className="flex flex-col items-center text-center w-full max-w-4xl mx-auto">
          
          {/* Logo with primary gold color */}
          <div className="mb-10 relative animate-fade-in">
            <div className="absolute inset-0 w-28 h-28 -translate-x-[6px] -translate-y-[6px] rounded-full bg-primary/10 blur-[35px]" />
            <img 
              src={auroraLogo} 
              alt="Aurora Society" 
              className="relative w-28 h-28 object-contain drop-shadow-[0_0_25px_hsl(var(--primary)/0.25)]"
              style={{ filter: 'sepia(100%) saturate(250%) brightness(0.95) hue-rotate(-10deg)' }}
            />
          </div>
          
          {/* Title */}
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-primary uppercase tracking-[0.35em] mb-10 font-light animate-fade-in"
            style={{ animationDelay: '100ms' }}>
            AURORA SOCIETY
          </h1>
          
          {/* Main Tagline */}
          <p className="text-foreground text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto leading-relaxed font-serif font-light mb-16 animate-fade-in" style={{ animationDelay: '200ms' }}>
            {t('privateCircleTagline')}
          </p>
          
          {/* 3 Small feature buttons with subtle reflection */}
          <div className="flex flex-wrap justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-[hsl(38,80%,71%,0.15)] bg-[hsl(0,0%,5%)] text-muted-foreground text-xs tracking-wide relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-[hsl(0,0%,100%,0.04)] to-transparent pointer-events-none" />
              <Briefcase className="w-4 h-4 text-primary/60" strokeWidth={1.2} />
              <span>{t('businessOpportunities')}</span>
            </div>
            <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-[hsl(38,80%,71%,0.15)] bg-[hsl(0,0%,5%)] text-muted-foreground text-xs tracking-wide relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-[hsl(0,0%,100%,0.04)] to-transparent pointer-events-none" />
              <Leaf className="w-4 h-4 text-primary/60" strokeWidth={1.2} />
              <span>{t('artOfLiving')}</span>
            </div>
            <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-[hsl(38,80%,71%,0.15)] bg-[hsl(0,0%,5%)] text-muted-foreground text-xs tracking-wide relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-[hsl(0,0%,100%,0.04)] to-transparent pointer-events-none" />
              <Gem className="w-4 h-4 text-primary/60" strokeWidth={1.2} />
              <span>{t('confidentialCircle')}</span>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '500ms' }}>
            <Button 
              onClick={() => navigate("/register")}
              className="h-12 px-8 text-xs font-medium tracking-[0.12em] uppercase
                bg-gradient-to-r from-[hsl(38,80%,68%)] to-[hsl(38,70%,55%)]
                text-[hsl(0,0%,3%)]
                rounded-md
                shadow-[0_4px_20px_hsl(38,80%,60%,0.15)]
                hover:brightness-105
                transition-all duration-300"
            >
              {t('joinPrivateList')}
            </Button>
            <Button 
              variant="ghost"
              onClick={() => navigate("/login")}
              className="h-12 px-8 text-xs font-light tracking-[0.08em]
                bg-transparent
                text-foreground/70
                border border-[hsl(38,80%,71%,0.15)]
                rounded-md
                hover:bg-[hsl(38,80%,71%,0.05)]
                hover:border-[hsl(38,80%,71%,0.3)]
                hover:text-foreground
                transition-all duration-300"
            >
              {t('alreadyMember')}
            </Button>
          </div>
          
          {/* Bottom proof */}
          <p className="text-[hsl(0,0%,30%)] text-xs tracking-wide mt-14 font-light animate-fade-in" style={{ animationDelay: '600ms' }}>
            {t('accessByRecommendationOnly')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
