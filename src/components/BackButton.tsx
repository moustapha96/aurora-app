import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlatformContext } from "@/contexts/PlatformContext";

interface BackButtonProps {
  to?: string | number;
  label?: string;
  className?: string;
}

export const BackButton = ({ to = -1, label = "Retour", className = "" }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (typeof to === "number") {
      navigate(to);
    } else {
      navigate(to);
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
      {label}
    </Button>
  );
};

interface PageNavigationProps {
  to?: string | number;
  label?: string;
}

export const PageNavigation = ({ to = -1, label = "Retour" }: PageNavigationProps) => {
  const { isWeb } = usePlatformContext();
  
  // Only show in web mode and on medium screens and above
  if (!isWeb) {
    return null;
  }
  
  return (
    <div className="hidden md:block fixed top-20 sm:top-24 md:top-28 left-3 sm:left-4 md:left-6 z-40 safe-area-top">
      <BackButton to={to} label={label} />
    </div>
  );
};

// Spacer to add margin below fixed back button
export const PageContentSpacer = () => {
  return <div className="h-8 sm:h-10" />;
};
