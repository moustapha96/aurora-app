import { cn } from "@/lib/utils";

interface AuroraLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const AuroraLogo = ({ className, size = "md" }: AuroraLogoProps) => {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24", 
    lg: "w-32 h-32"
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {/* Outer Circle */}
      <div className="absolute inset-0 rounded-full border-2 border-primary opacity-80" />
      
      {/* Inner A */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-serif text-primary text-2xl font-bold tracking-wider">
          A
        </span>
      </div>
      
      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-full bg-primary opacity-10 blur-sm" />
    </div>
  );
};