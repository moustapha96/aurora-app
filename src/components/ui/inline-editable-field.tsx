import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface InlineEditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  disabled?: boolean;
}

export const InlineEditableField = ({ 
  value, 
  onSave, 
  placeholder = "Cliquer pour modifier", 
  className = "", 
  multiline = false,
  disabled = false
}: InlineEditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    setTempValue(value);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const trimmed = tempValue.trim();
    if (trimmed !== value) {
      onSave(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setTempValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            "bg-background/80 border border-gold/40 rounded px-2 py-1 w-full text-foreground focus:outline-none focus:ring-1 focus:ring-gold resize-none",
            className
          )}
          rows={3}
        />
      );
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          "bg-background/80 border border-gold/40 rounded px-2 py-1 w-full text-foreground focus:outline-none focus:ring-1 focus:ring-gold",
          className
        )}
      />
    );
  }

  return (
    <span
      onClick={handleClick}
      className={cn(
        "cursor-text hover:bg-gold/10 rounded px-1 -mx-1 transition-colors inline-block",
        !value && "text-muted-foreground/50 italic",
        disabled && "cursor-default hover:bg-transparent",
        className
      )}
    >
      {value || placeholder}
    </span>
  );
};
