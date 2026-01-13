import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader2, CheckCircle, AlertTriangle, XCircle, User, Shield, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface EditableImageProps {
  imageUrl: string;
  onSave: (url: string) => void;
  className?: string;
  alt?: string;
  storageFolder?: string;
  editable?: boolean;
  requireProfileVerification?: boolean; // New prop to enable AI verification
}

type VerificationStatus = 'idle' | 'verifying' | 'valid' | 'invalid' | 'warning';

interface VerificationResult {
  isValid: boolean;
  hasFace: boolean;
  isAppropriate: boolean;
  qualityOk: boolean;
  reason: string;
}

export const EditableImage = ({ 
  imageUrl, 
  onSave, 
  className = "",
  alt = "Image",
  storageFolder = "personal-content",
  editable = true,
  requireProfileVerification = false
}: EditableImageProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const verifyProfileImage = async (base64Image: string): Promise<VerificationResult | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-profile-image', {
        body: { imageBase64: base64Image }
      });

      if (error) {
        console.error('Profile verification error:', error);
        return null;
      }

      return data as VerificationResult;
    } catch (error) {
      console.error('Profile verification error:', error);
      return null;
    }
  };

  const uploadFile = async (file: File) => {
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

      // Add cache-buster to force refresh everywhere
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

      onSave(cacheBustedUrl);
      setIsEditing(false);
      setPendingFile(null);
      setPendingPreview(null);
      setVerificationStatus('idle');
      setVerificationResult(null);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset verification state
    setVerificationStatus('idle');
    setVerificationResult(null);

    if (requireProfileVerification) {
      // Store file and create preview for verification
      setPendingFile(file);
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setPendingPreview(base64);
        
        // Start verification
        setVerificationStatus('verifying');
        const result = await verifyProfileImage(base64);
        
        if (result) {
          setVerificationResult(result);
          if (result.isValid) {
            setVerificationStatus('valid');
            toast({ 
              title: "Photo de profil validée",
              description: "Vous pouvez maintenant confirmer le téléchargement."
            });
          } else if (result.hasFace && result.isAppropriate) {
            setVerificationStatus('warning');
            toast({ 
              title: "Photo partiellement validée",
              description: result.reason,
              variant: "default"
            });
          } else {
            setVerificationStatus('invalid');
            toast({ 
              title: "Photo non valide",
              description: result.reason,
              variant: "destructive"
            });
          }
        } else {
          // If verification fails, allow upload anyway with warning
          setVerificationStatus('warning');
          toast({ 
            title: "Vérification impossible",
            description: "La photo sera téléchargée sans vérification.",
            variant: "default"
          });
        }
      };
      reader.readAsDataURL(file);
    } else {
      // No verification needed, upload directly
      await uploadFile(file);
    }
  };

  const handleConfirmUpload = async () => {
    if (pendingFile) {
      await uploadFile(pendingFile);
    }
  };

  const handleCancelUpload = () => {
    setPendingFile(null);
    setPendingPreview(null);
    setVerificationStatus('idle');
    setVerificationResult(null);
    setIsEditing(false);
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'verifying':
        return <Loader2 className="w-5 h-5 animate-spin text-primary" />;
      case 'valid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'invalid':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-3">
        <div className={className}>
          <img 
            src={pendingPreview || imageUrl} 
            alt={alt} 
            className="w-full h-full object-cover rounded-lg mb-2" 
          />
        </div>

        {/* Verification status display */}
        {requireProfileVerification && verificationStatus !== 'idle' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm font-medium">
                {verificationStatus === 'verifying' && "Analyse en cours..."}
                {verificationStatus === 'valid' && "Photo validée"}
                {verificationStatus === 'warning' && "Validation partielle"}
                {verificationStatus === 'invalid' && "Photo non valide"}
              </span>
            </div>

            {verificationResult && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{verificationResult.reason}</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant={verificationResult.hasFace ? "default" : "destructive"} className="text-xs">
                    <User className="w-3 h-3 mr-1" />
                    {verificationResult.hasFace ? "Visage détecté" : "Pas de visage"}
                  </Badge>
                  <Badge variant={verificationResult.isAppropriate ? "default" : "destructive"} className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    {verificationResult.isAppropriate ? "Appropriée" : "Inappropriée"}
                  </Badge>
                  <Badge variant={verificationResult.qualityOk ? "default" : "secondary"} className="text-xs">
                    <ImageIcon className="w-3 h-3 mr-1" />
                    {verificationResult.qualityOk ? "Qualité OK" : "Qualité faible"}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 items-center flex-wrap">
          {!pendingFile && (
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading || verificationStatus === 'verifying'}
            />
          )}
          
          {pendingFile && (verificationStatus === 'valid' || verificationStatus === 'warning') && (
            <Button 
              size="sm" 
              onClick={handleConfirmUpload}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                "Confirmer"
              )}
            </Button>
          )}

          {pendingFile && verificationStatus === 'invalid' && (
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
            />
          )}
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleCancelUpload}
            disabled={uploading || verificationStatus === 'verifying'}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (!editable) {
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