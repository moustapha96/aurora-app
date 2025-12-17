import { AuroraLogo } from "@/components/AuroraLogo";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLanguage, languages } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";
import { Footer } from "@/components/Footer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Index = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="min-h-screen bg-black flex flex-col px-6">
      {/* Language Selector - Top Right */}
      <div className="absolute top-6 right-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gold hover:bg-gold/10">
              <Globe className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-black border-gold/30">
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => setLanguage(lang.code as any)}
                className={`text-gold hover:bg-gold/10 cursor-pointer ${language === lang.code ? 'bg-gold/20' : ''}`}
              >
                {lang.flag} {lang.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Content Centered */}
      <div className="text-center max-w-2xl mx-auto flex-1 flex flex-col items-center justify-center">
        {/* Logo */}
        <AuroraLogo size="lg" className="mx-auto mb-8" />
        
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-serif text-gold mb-2 tracking-wide">
          AURORA
        </h1>
        <h2 className="text-2xl md:text-3xl font-serif text-gold mb-8 tracking-widest">
          SOCIETY
        </h2>
        
        {/* Accroche principale */}
        <h3 className="text-xl md:text-2xl font-serif text-gold mb-6 leading-relaxed">
          {t('homeTagline')}
        </h3>
        
        {/* Sous-texte */}
        <p className="text-gold/80 text-base leading-relaxed mb-8 px-4">
          {t('homeDescription')}
        </p>

        {/* Philosophie */}
        <div className="border-t border-gold/20 pt-6 mb-10">
          <p className="text-gold/60 text-sm italic leading-relaxed px-4">
            {t('homePhilosophy')}
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="premium" 
            size="lg" 
            className="px-12 py-3"
            onClick={() => navigate("/register")}
          >
            {t('register')}
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="px-12 py-3 text-gold border-gold hover:bg-gold hover:text-black transition-all duration-300"
            onClick={() => navigate("/login")}
          >
            {t('signIn')}
          </Button>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Index;
