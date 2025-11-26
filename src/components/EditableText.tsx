import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Pencil } from "lucide-react";

interface EditableTextProps {
  value: string;
  onSave: (value: string) => void;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
  editable?: boolean; // Control if editing is allowed
}

export const EditableText = ({ 
  value, 
  onSave, 
  multiline = false, 
  className = "",
  placeholder = "Cliquez pour modifier...",
  editable = true
}: EditableTextProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        {multiline ? (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className={className}
            rows={6}
            autoFocus
          />
        ) : (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className={className}
            autoFocus
          />
        )}
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave}>
            <Check className="w-4 h-4 mr-1" />
            Enregistrer
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            <X className="w-4 h-4 mr-1" />
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  if (!editable) {
    // Read-only mode
    return (
      <div className={`whitespace-pre-wrap p-2 ${className}`}>
        {value || ""}
      </div>
    );
  }

  return (
    <div 
      className={`group relative cursor-pointer hover:bg-accent/50 rounded-lg p-2 transition-colors ${className}`}
      onClick={() => setIsEditing(true)}
    >
      <div className="whitespace-pre-wrap">{value || placeholder}</div>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Pencil className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );
};
