import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  className?: string;
  onClick?: () => void;
}

export const ServiceCard = ({ icon: Icon, title, className, onClick }: ServiceCardProps) => {
  return (
    <div 
      className={cn(
        "group relative bg-card border border-border rounded-xl p-8 cursor-pointer transition-luxury aurora-glow hover:border-primary/50",
        className
      )}
      onClick={onClick}
    >
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="p-4 rounded-full border border-primary/30 group-hover:border-primary transition-luxury">
          <Icon className="w-8 h-8 text-primary" />
        </div>
      </div>
      
      {/* Title */}
      <h3 className="text-center text-xl font-serif text-foreground group-hover:text-primary transition-luxury">
        {title}
      </h3>
      
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-luxury pointer-events-none" />
    </div>
  );
};
