import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditableImageProps {
  imageUrl: string;
  onSave: (url: string) => void;
  className?: string;
  alt?: string;
  storageFolder?: string;
  editable?: boolean; // Control if editing is allowed
}

export const EditableImage = ({ 
  imageUrl, 
  onSave, 
  className = "",
  alt = "Image",
  storageFolder = "personal-content",
  editable = true
}: EditableImageProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(storageFolder)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(storageFolder)
        .getPublicUrl(filePath);

      onSave(publicUrl);
      setIsEditing(false);
      toast({ title: "Image mise à jour" });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ 
        title: "Erreur lors du téléchargement", 
        variant: "destructive" 
      });
    } finally {
      setUploading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <div className={className}>
          <img src={imageUrl} alt={alt} className="w-full h-full object-cover rounded-lg mb-2" />
        </div>
        <div className="flex gap-2 items-center">
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
          />
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setIsEditing(false)}
            disabled={uploading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (!editable) {
    // Read-only mode - just display the image
    return (
      <div className={className}>
        <img src={imageUrl} alt={alt} className="w-full h-full object-cover rounded-lg" />
      </div>
    );
  }

  return (
    <div 
      className={`group relative cursor-pointer ${className}`}
      onClick={() => setIsEditing(true)}
    >
      <img src={imageUrl} alt={alt} className="w-full h-full object-cover rounded-lg" />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
        <Upload className="w-8 h-8 text-white" />
      </div>
    </div>
  );
};
