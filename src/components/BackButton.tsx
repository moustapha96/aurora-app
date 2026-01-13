import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlatformContext } from "@/contexts/PlatformContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface BackButtonProps {
  to?: string | number | string;
  label?: string;
  className?: string;
}

export const BackButton = ({ to = -1, label, className = "" }: BackButtonProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleClick = () => {
    if (typeof to === "number") {
      // Retour dans l'historique si possible, sinon fallback sur /member-card
      if (window.history.length > 1) {
        navigate(to);
      } else {
        navigate("/member-card");
      }
    } else if (to) {
      navigate(to);
    } else {
      navigate("/member-card");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`text-muted-foreground hover:text-foreground hover:bg-primary/10 h-8 px-2 text-xs ${className}`}
    >
      <ArrowLeft className="w-3 h-3 mr-1" />
      {label ?? t("back")}
    </Button>
  );
};

interface PageNavigationProps {
  to?: string | number | string;
  label?: string;
}

export const PageNavigation = ({ to = -1, label }: PageNavigationProps) => {
  const { isWeb } = usePlatformContext();
  const { t } = useLanguage();
  
  // Only show in web mode and on medium screens and above
  if (!isWeb) {
    return null;
  }
  
  return (
    <div className="hidden md:block fixed top-20 sm:top-24 md:top-28 left-3 sm:left-4 md:left-6 z-40 safe-area-top">
      <BackButton to={to} label={label ?? t("back")} />
    </div>
  );
};

// Spacer to add margin below fixed back button
export const PageContentSpacer = () => {
  return <div className="h-8 sm:h-10" />;
};

// Inline back button component matching Members.tsx style
interface PageHeaderBackButtonProps {
  to?: string | number;
  className?: string;
}

export const PageHeaderBackButton = ({ to, className = "" }: PageHeaderBackButtonProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleClick = () => {
    if (typeof to === "number") {
      // Retour dans l'historique si possible, sinon fallback sur /member-card
      if (window.history.length > 1) {
        navigate(to);
      } else {
        navigate("/member-card");
      }
    } else if (to) {
      navigate(to);
    } else {
      // Par défaut, retour à la page précédente ou /member-card
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/member-card");
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`text-gold/60 hover:text-gold mr-2 sm:mr-4 ${className}`}
    >
      <ArrowLeft className="w-4 h-4 sm:mr-2" />
      <span className="hidden sm:inline">{t('back')}</span>
    </Button>
  );
};
