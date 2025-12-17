import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  showBottom?: boolean;
}

export const PageNavigation = ({ to = -1, label = "Retour", showBottom = true }: PageNavigationProps) => {
  return (
    <>
      {/* Top left back button */}
      <div className="fixed top-24 left-4 z-50">
        <BackButton to={to} label={label} />
      </div>
      
      {/* Bottom center back button */}
      {showBottom && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <BackButton to={to} label={label} />
        </div>
      )}
    </>
  );
};
