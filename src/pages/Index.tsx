import { AuroraLogo } from "@/components/AuroraLogo";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLanguage, languages } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import logo from "@/assets/logo.png";

const Index = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { isAdmin, loading: adminLoading } = useAdmin();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Wait for admin check to complete
        if (adminLoading) {
          return; // Still checking admin status
        }
        
        // User is authenticated, check if admin
        if (isAdmin === true) {
          // Admin user, redirect to admin dashboard
          navigate("/admin/dashboard", { replace: true });
        } else {
          // Regular member, redirect to member-card
          navigate("/member-card", { replace: true });
        }
      } else {
        // User is not authenticated, show landing page
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [navigate, isAdmin, adminLoading]);

  // Show loading state while checking authentication and admin status
  if (checkingAuth || adminLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AuroraLogo size="lg" className="mx-auto mb-4 animate-pulse" />
          <p className="text-gold/80">{t('loading') || 'Chargement...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col px-6">
      {/* Language Selector - Top Right */}
      <div className="absolute top-6 right-6">
        <Select value={language} onValueChange={(value) => setLanguage(value as any)}>
          <SelectTrigger className="w-[180px] border-gold/30 bg-black/50 text-gold hover:border-gold">
            <Globe className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-black border-gold/30 z-50">
            {languages.map((lang) => (
              <SelectItem 
                key={lang.code} 
                value={lang.code}
                className="text-gold hover:bg-gold/10 focus:bg-gold/10"
              >
                {lang.flag} {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Content Centered */}
      <div className="text-center max-w-md mx-auto flex-1 flex flex-col items-center justify-center">
        {/* Logo */}
        {/* <AuroraLogo size="lg" className="mx-auto mb-8" /> */}
        <img src={logo} alt="Logo" className="w-32 h-32 mx-auto mb-8" />
        
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-serif text-gold mb-2 tracking-wide">
          AURORA
        </h1>
        <h2 className="text-2xl md:text-3xl font-serif text-gold mb-8 tracking-widest">
          SOCIETY
        </h2>
        
        {/* Welcome Message */}
        <h3 className="text-3xl font-serif text-gold mb-6">
          {t('welcome')}
        </h3>
        
        {/* Description */}
        <p className="text-gold/80 text-base leading-relaxed mb-12 px-4">
          {t('description')}
        </p>
        
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
