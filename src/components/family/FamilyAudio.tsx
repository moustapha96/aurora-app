import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Music, 
  Upload, 
  Trash2, 
  Play, 
  Pause,
  Loader2,
  Volume2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FamilyAudioFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  duration_seconds: number | null;
  description: string | null;
  created_at: string;
}

interface FamilyAudioProps {
  isOwnProfile: boolean;
}

export const FamilyAudio = ({ isOwnProfile }: FamilyAudioProps) => {
  const { t } = useLanguage();
  const [audioFiles, setAudioFiles] = useState<FamilyAudioFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadAudioFiles();
  }, []);

  useEffect(() => {
    // Cleanup audio URLs on unmount
    return () => {
      Object.values(audioUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [audioUrls]);

  const loadAudioFiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('family_audio')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAudioFiles(data || []);
    } catch (error) {
      console.error('Error loading audio files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
      toast.error(t("unsupportedAudioFormat") || "Format audio non supporté (MP3, WAV, OGG, M4A acceptés)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("audioFileTooLarge") || "Le fichier audio dépasse 5 Mo");
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthenticated"));

      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      
      // Ensure proper MIME type for audio files
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const mimeTypes: Record<string, string> = {
        'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'ogg': 'audio/ogg',
        'm4a': 'audio/mp4', 'aac': 'audio/aac', 'flac': 'audio/flac'
      };
      const contentType = mimeTypes[fileExt] || file.type || 'audio/mpeg';
      const properFile = new File([file], file.name, { type: contentType, lastModified: Date.now() });
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('family-documents')
        .upload(filePath, properFile, { contentType });

      if (uploadError) throw uploadError;

      // Save metadata
      const { error: dbError } = await supabase
        .from('family_audio')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size
        });

      if (dbError) throw dbError;

      toast.success(t("audioAdded") || "Fichier audio ajouté");
      loadAudioFiles();
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast.error(t("cannotAddAudio") || "Impossible d'ajouter le fichier audio");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (audio: FamilyAudioFile) => {
    if (!confirm(t("deleteAudioConfirm") || "Supprimer ce fichier audio ?")) return;
    
    try {
      // Delete from storage
      await supabase.storage
        .from('family-documents')
        .remove([audio.file_path]);

      // Delete metadata
      const { error } = await supabase
        .from('family_audio')
        .delete()
        .eq('id', audio.id);

      if (error) throw error;

      toast.success(t("audioDeleted") || "Fichier audio supprimé");
      
      // Stop playing if this was the playing file
      if (playingId === audio.id) {
        setPlayingId(null);
        audioRef.current?.pause();
      }
      
      loadAudioFiles();
    } catch (error) {
      console.error('Error deleting audio:', error);
      toast.error(t("cannotDeleteAudio") || "Impossible de supprimer le fichier audio");
    }
  };

  const handlePlayPause = async (audio: FamilyAudioFile) => {
    // If currently playing this audio, pause it
    if (playingId === audio.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      // Get or create signed URL
      let url = audioUrls[audio.id];
      if (!url) {
        const { data, error } = await supabase.storage
          .from('family-documents')
          .createSignedUrl(audio.file_path, 3600);

        if (error) throw error;
        url = data.signedUrl;
        setAudioUrls(prev => ({ ...prev, [audio.id]: url }));
      }

      // Create and play audio
      const audioElement = new Audio(url);
      audioRef.current = audioElement;
      
      audioElement.onended = () => setPlayingId(null);
      audioElement.onerror = () => {
        toast.error(t("cannotPlayAudio") || "Impossible de lire le fichier audio");
        setPlayingId(null);
      };

      await audioElement.play();
      setPlayingId(audio.id);
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error(t("cannotPlayAudio") || "Impossible de lire le fichier audio");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <Card className="border-gold/20">
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gold" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gold/20 bg-card/50">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2 text-gold">
          <Music className="w-5 h-5" />
          {t("audioFiles") || "Fichiers Audio"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("audioFilesDesc") || "Enregistrements familiaux, messages vocaux (max 5 Mo)"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isOwnProfile && (
          <div className="flex items-center gap-2">
            <Label htmlFor="audio-upload" className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 bg-gold/10 hover:bg-gold/20 rounded-lg transition-colors border border-gold/20">
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gold" />
                ) : (
                  <Upload className="w-4 h-4 text-gold" />
                )}
                <span className="text-sm text-gold">{t("addAudio") || "Ajouter un audio"}</span>
              </div>
            </Label>
            <Input
              id="audio-upload"
              type="file"
              accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/m4a,.mp3,.wav,.ogg,.m4a"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </div>
        )}

        {audioFiles.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            {t("noAudioFiles") || "Aucun fichier audio"}
          </p>
        ) : (
          <div className="space-y-2">
            {audioFiles.map((audio) => (
              <div
                key={audio.id}
                className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-gold/10"
              >
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePlayPause(audio)}
                    className="h-10 w-10 rounded-full bg-gold/10 hover:bg-gold/20 text-gold"
                  >
                    {playingId === audio.id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </Button>
                  <div>
                    <p className="text-sm font-medium text-foreground">{audio.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(audio.file_size)} • {new Date(audio.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {playingId === audio.id && (
                    <Volume2 className="w-4 h-4 text-gold animate-pulse" />
                  )}
                  {isOwnProfile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(audio)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
