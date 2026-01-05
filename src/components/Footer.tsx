import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="border-t border-primary/10 bg-background py-8 mt-auto">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Aurora Society. {t('allRightsReserved')}.
          </p>
          <div className="flex gap-6">
            <Link 
              to="/terms" 
              className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-300"
            >
              {t('termsAndConditions')}
            </Link>
            <Link 
              to="/contact" 
              className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-300"
            >
              {t('contact')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
