import { cn } from "@/lib/utils";
import auroraLogo from "@/assets/aurora-logo.png";

interface AuroraLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const AuroraLogo = ({ className, size = "md" }: AuroraLogoProps) => {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16", 
    lg: "w-24 h-24"
  };

  return (
    <img 
      src={auroraLogo} 
      alt="Aurora Society" 
      className={cn(sizeClasses[size], "object-contain", className)}
    />
  );
};
