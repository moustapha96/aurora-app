import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="border-t border-gold/20 bg-black/40 py-8 mt-auto">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gold/60 text-sm">
            © {new Date().getFullYear()} Aurora Society. {t('allRightsReserved')}.
          </p>
          <div className="flex gap-6">
            <Link 
              to="/terms" 
              className="text-gold/60 hover:text-gold text-sm transition-colors"
            >
              {t('termsAndConditions')}
            </Link>
            <a 
              href="mailto:contact@aurora-society.com" 
              className="text-gold/60 hover:text-gold text-sm transition-colors"
            >
              {t('contact')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
