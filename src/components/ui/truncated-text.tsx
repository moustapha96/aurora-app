import { useState } from "react";
import { cn } from "@/lib/utils";

interface TruncatedTextProps {
  text: string;
  className?: string;
  maxLines?: number;
}

export const TruncatedText = ({ text, className, maxLines = 1 }: TruncatedTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  const lineClampClass = maxLines === 1 ? "line-clamp-1" : maxLines === 2 ? "line-clamp-2" : "line-clamp-3";

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Truncated version */}
      <p className={cn(
        "text-sm text-muted-foreground transition-opacity duration-200",
        lineClampClass,
        isExpanded && "opacity-0",
        className
      )}>
        {text}
      </p>

      {/* Expanded tooltip on hover */}
      {isExpanded && (
        <div className="absolute left-0 top-0 z-50 min-w-full max-w-md p-3 bg-popover border border-border rounded-lg shadow-lg animate-fade-in">
          <p className={cn("text-sm text-foreground whitespace-pre-wrap", className)}>
            {text}
          </p>
        </div>
      )}
    </div>
  );
};
